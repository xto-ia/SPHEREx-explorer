"""Shared HTTP client (connection pooling, browser-free upstream access)."""

from __future__ import annotations

import httpx

from .config import UPSTREAM_TIMEOUT

USER_AGENT = "SPHEREx-Explorer/2.0 (+https://github.com/xto-ia/SPHEREx-explorer)"

client = httpx.Client(
    timeout=UPSTREAM_TIMEOUT,
    follow_redirects=True,
    headers={"User-Agent": USER_AGENT},
    limits=httpx.Limits(max_connections=16, max_keepalive_connections=8),
)
