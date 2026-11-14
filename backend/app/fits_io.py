"""Range-backed FITS access.

SPHEREx Level-2 files are ~62 MB each, but a 0.5 deg cutout only needs a few
hundred rows. This module exposes an ``io.RawIOBase`` that serves ``read``/``seek``
from HTTP ``Range`` requests, so ``astropy.io.fits`` can open a remote product
lazily and pull just the window we ask for.
"""

from __future__ import annotations

import io
import threading
from typing import Iterator
from contextlib import contextmanager

import httpx
from astropy.io import fits

DEFAULT_BLOCK = 128 * 1024
DEFAULT_TIMEOUT = 120.0


class HttpRangeFile(io.RawIOBase):
    """Read-only, seekable file object backed by HTTP Range requests."""

    def __init__(
        self,
        url: str,
        *,
        client: httpx.Client | None = None,
        block: int = DEFAULT_BLOCK,
        timeout: float = DEFAULT_TIMEOUT,
    ) -> None:
        super().__init__()
        self.url = url
        self._client = client
        self._owns_client = client is None
        self._block = block
        self._timeout = timeout
        self._pos = 0
        self._buf = b""
        self._buf_start = 0
        self._lock = threading.Lock()
        self.requests = 0
        self.bytes_fetched = 0

        response = self._http().head(url)
        response.raise_for_status()
        self.size = int(response.headers.get("Content-Length", "0"))
        if self.size <= 0:
            raise ValueError(f"cannot determine size of {url}")

    # -------------------------------------------------------------- helpers
    def _http(self) -> httpx.Client:
        if self._client is None:
            self._client = httpx.Client(timeout=self._timeout, follow_redirects=True)
        return self._client

    def _covers(self, start: int, size: int) -> bool:
        return self._buf_start <= start and start + size <= self._buf_start + len(self._buf)

    def _fill(self, start: int) -> None:
        if start >= self.size:
            self._buf = b""
            self._buf_start = start
            return
        end = min(start + self._block, self.size) - 1
        response = self._http().get(self.url, headers={"Range": f"bytes={start}-{end}"})
        if response.status_code not in (200, 206):
            response.raise_for_status()
        self._buf = response.content
        self._buf_start = start
        self.requests += 1
        self.bytes_fetched += len(self._buf)

    # ------------------------------------------------------------ io protocol
    def readable(self) -> bool:
        return True

    def writable(self) -> bool:
        return False

    def seekable(self) -> bool:
        return True

    def tell(self) -> int:
        return self._pos

    def seek(self, offset: int, whence: int = io.SEEK_SET) -> int:
        if whence == io.SEEK_SET:
            self._pos = offset
        elif whence == io.SEEK_CUR:
            self._pos += offset
        elif whence == io.SEEK_END:
            self._pos = self.size + offset
        else:  # pragma: no cover - defensive
            raise ValueError(f"invalid whence {whence}")
        return self._pos

    def read(self, size: int = -1) -> bytes:  # type: ignore[override]
        with self._lock:
            if size is None or size < 0:
                size = self.size - self._pos
            size = min(size, max(self.size - self._pos, 0))
            if size == 0:
                return b""

            chunks: list[bytes] = []
            remaining = size
            while remaining > 0:
                if not self._covers(self._pos, 1):
                    self._fill(self._pos)
                offset = self._pos - self._buf_start
                if offset >= len(self._buf):
                    break
                take = min(remaining, len(self._buf) - offset)
                chunks.append(self._buf[offset : offset + take])
                self._pos += take
                remaining -= take
            return b"".join(chunks)

    def readinto(self, target) -> int:  # type: ignore[override]
        data = self.read(len(target))
        target[: len(data)] = data
        return len(data)

    def close(self) -> None:
        try:
            super().close()
        finally:
            if self._owns_client and self._client is not None:
                self._client.close()
                self._client = None


@contextmanager
def open_fits(url: str, *, client: httpx.Client | None = None) -> Iterator[tuple[fits.HDUList, HttpRangeFile]]:
    """Open a remote FITS product lazily over Range requests."""
    remote = HttpRangeFile(url, client=client)
    hdul = fits.open(remote, memmap=False, lazy_load_hdus=True, cache=False)
    try:
        yield hdul, remote
    finally:
        try:
            hdul.close()
        finally:
            remote.close()

