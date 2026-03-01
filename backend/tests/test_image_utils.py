from __future__ import annotations

import io

from PIL import Image
import pytest

from backend.image_utils import (
    MAX_FILE_SIZE_MB,
    MAX_HEIGHT,
    MAX_WIDTH,
    compress_image,
)


class TestImageUtils:
    @staticmethod
    def _make_image(
        fmt: str = "JPEG",
        size: tuple[int, int] = (200, 200),
        mode: str = "RGB",
    ) -> tuple[bytes, str]:
        img = Image.new(mode, size, color="blue")
        buf = io.BytesIO()
        img.save(buf, format=fmt)
        ext_map = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}
        filename = f"test{ext_map.get(fmt, '.jpg')}"
        return buf.getvalue(), filename

    def test_jpeg_passthrough(self):
        raw, name = self._make_image("JPEG", (100, 100))
        result, new_name = compress_image(raw, name)
        assert len(result) > 0
        assert new_name.endswith(".jpg")

    def test_png_passthrough(self):
        raw, name = self._make_image("PNG", (50, 50), mode="RGBA")
        result, new_name = compress_image(raw, name)
        assert new_name.endswith(".png")

    def test_resize_large_image(self):
        raw, name = self._make_image("JPEG", (4000, 3000))
        result, new_name = compress_image(raw, name)
        img = Image.open(io.BytesIO(result))
        assert img.width <= MAX_WIDTH
        assert img.height <= MAX_HEIGHT

    def test_unsupported_extension_passthrough(self):
        raw = b"not an image"
        result, name = compress_image(raw, "virus.exe")
        assert result == raw
        assert name == "virus.exe"

    def test_file_too_large_raises(self):
        huge = b"\x00" * (MAX_FILE_SIZE_MB * 1024 * 1024 + 1)
        with pytest.raises(ValueError, match="слишком большой"):
            compress_image(huge, "huge.jpg")

    def test_corrupt_bytes_passthrough(self):
        raw = b"\xff\xd8\xff\x00" + b"\x00" * 100
        result, name = compress_image(raw, "broken.jpg")
        assert result == raw
