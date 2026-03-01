import os
from typing import Any, cast

import httpx

TURNSTILE_SECRET = os.getenv("TURNSTILE_SECRET_KEY", "")
VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


async def verify_turnstile(token: str) -> bool:
    if not TURNSTILE_SECRET:
        return True

    async with httpx.AsyncClient() as client:
        response = await client.post(
            VERIFY_URL,
            data={
                "secret": TURNSTILE_SECRET,
                "response": token,
            },
        )
        result = cast(dict[str, Any], response.json())
        return bool(result.get("success", False))
