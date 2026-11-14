"""Disk cache with a hard size budget and least-recently-used eviction."""

from __future__ import annotations

import hashlib
import json
import sqlite3
import threading
import time
import zlib
from pathlib import Path
from typing import Any

import numpy as np

from .config import CACHE_DIR, CACHE_LIMIT_BYTES


class DiskCache:
    """A tiny file cache: content lives on disk, indexing in SQLite."""

    def __init__(self, root: Path = CACHE_DIR, limit_bytes: int = CACHE_LIMIT_BYTES) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.limit_bytes = limit_bytes
        self._lock = threading.Lock()
        self._db = sqlite3.connect(self.root / "index.sqlite", check_same_thread=False)
        self._db.execute(
            """
            CREATE TABLE IF NOT EXISTS entries (
                key TEXT PRIMARY KEY,
                path TEXT NOT NULL,
                kind TEXT NOT NULL,
                size INTEGER NOT NULL,
                created REAL NOT NULL,
                accessed REAL NOT NULL,
                expires REAL
            )
            """
        )
        self._db.commit()

    # ------------------------------------------------------------------ paths
    def _path_for(self, key: str, kind: str) -> Path:
        digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
        folder = self.root / kind / digest[:2]
        folder.mkdir(parents=True, exist_ok=True)
        suffix = {"json": ".json", "npz": ".npz", "npy": ".npy", "bin": ".bin"}.get(kind, ".bin")
        return folder / f"{digest}{suffix}"

    def _lookup(self, key: str) -> tuple[Path, float | None] | None:
        row = self._db.execute("SELECT path, expires FROM entries WHERE key = ?", (key,)).fetchone()
        if not row:
            return None
        path = Path(row[0])
        if not path.exists():
            self._db.execute("DELETE FROM entries WHERE key = ?", (key,))
            self._db.commit()
            return None
        return path, row[1]

    def _touch(self, key: str) -> None:
        self._db.execute("UPDATE entries SET accessed = ? WHERE key = ?", (time.time(), key))
        self._db.commit()

    # ------------------------------------------------------------------- API
    def get_json(self, key: str) -> Any:
        with self._lock:
            found = self._lookup(key)
            if not found:
                return None
            path, expires = found
            if expires is not None and expires < time.time():
                return None
            self._touch(key)
        try:
            return json.loads(path.read_text("utf-8"))
        except (OSError, ValueError):
            return None

    def put_json(self, key: str, value: Any, ttl: float | None = None) -> None:
        path = self._path_for(key, "json")
        payload = json.dumps(value).encode("utf-8")
        path.write_bytes(payload)
        self._register(key, path, "json", len(payload), ttl)

    def get_npz(self, key: str) -> dict[str, np.ndarray] | None:
        with self._lock:
            found = self._lookup(key)
            if not found:
                return None
            path, expires = found
            if expires is not None and expires < time.time():
                return None
            self._touch(key)
        try:
            with np.load(path, allow_pickle=False) as data:
                return {name: data[name] for name in data.files}
        except (OSError, ValueError):
            return None

    def put_npz(self, key: str, arrays: dict[str, np.ndarray], ttl: float | None = None) -> None:
        path = self._path_for(key, "npz")
        np.savez_compressed(path, **arrays)
        self._register(key, path, "npz", path.stat().st_size, ttl)

    def key(self, *parts: Any) -> str:
        raw = "|".join(str(part) for part in parts)
        return zlib.compress(raw.encode("utf-8"), 1).hex()

    # ------------------------------------------------------------ bookkeeping
    def _register(self, key: str, path: Path, kind: str, size: int, ttl: float | None) -> None:
        now = time.time()
        expires = now + ttl if ttl else None
        with self._lock:
            self._db.execute(
                "INSERT OR REPLACE INTO entries (key, path, kind, size, created, accessed, expires)"
                " VALUES (?, ?, ?, ?, ?, ?, ?)",
                (key, str(path), kind, size, now, now, expires),
            )
            self._db.commit()
        self.enforce_limit()

    def enforce_limit(self) -> None:
        with self._lock:
            total = self._db.execute("SELECT COALESCE(SUM(size), 0) FROM entries").fetchone()[0]
            if total <= self.limit_bytes:
                return
            stale = self._db.execute(
                "SELECT key, path, size FROM entries ORDER BY accessed ASC"
            ).fetchall()
        removed = 0
        for key, path, size in stale:
            if total <= self.limit_bytes:
                break
            try:
                Path(path).unlink(missing_ok=True)
            except OSError:
                pass
            with self._lock:
                self._db.execute("DELETE FROM entries WHERE key = ?", (key,))
                self._db.commit()
            total -= size
            removed += 1
        if removed:
            with self._lock:
                self._db.execute("VACUUM")
                self._db.commit()

    def stats(self) -> dict[str, Any]:
        with self._lock:
            total, count = self._db.execute(
                "SELECT COALESCE(SUM(size), 0), COUNT(*) FROM entries"
            ).fetchone()
        return {
            "entries": count,
            "bytes": int(total),
            "limit_bytes": self.limit_bytes,
            "root": str(self.root),
        }


cache = DiskCache()
