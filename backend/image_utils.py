import io
import os

from PIL import Image

MAX_WIDTH = 1920
MAX_HEIGHT = 1920
QUALITY = 85
MAX_FILE_SIZE_MB = 10
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}


def _is_supported_image(ext: str) -> bool:
    return ext in ALLOWED_EXTENSIONS


def _validate_file_size(file_bytes: bytes) -> None:
    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise ValueError(f"Файл слишком большой (макс {MAX_FILE_SIZE_MB} МБ)")


def _open_image(file_bytes: bytes) -> Image.Image | None:
    try:
        return Image.open(io.BytesIO(file_bytes))
    except Exception:
        return None


def _prepare_mode(img: Image.Image, ext: str) -> Image.Image:
    if img.mode not in ("RGBA", "LA", "P"):
        return img

    if ext in (".jpg", ".jpeg"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        source = img.convert("RGBA") if img.mode == "P" else img
        mask = source.split()[-1] if "A" in source.mode else None
        background.paste(source, mask=mask)
        return background

    if ext == ".png":
        return img

    return img.convert("RGB")


def _resize_if_needed(img: Image.Image) -> Image.Image:
    width, height = img.size
    if width <= MAX_WIDTH and height <= MAX_HEIGHT:
        return img

    ratio = min(MAX_WIDTH / width, MAX_HEIGHT / height)
    new_size = (int(width * ratio), int(height * ratio))
    return img.resize(new_size, Image.Resampling.LANCZOS)


def _save_image(img: Image.Image, ext: str) -> tuple[bytes, str]:
    output = io.BytesIO()

    if ext in (".jpg", ".jpeg"):
        result = img if img.mode == "RGB" else img.convert("RGB")
        result.save(output, format="JPEG", quality=QUALITY, optimize=True)
        return output.getvalue(), ".jpg"

    if ext == ".png":
        img.save(output, format="PNG", optimize=True)
        return output.getvalue(), ".png"

    if ext == ".webp":
        img.save(output, format="WEBP", quality=QUALITY)
        return output.getvalue(), ".webp"

    result = img if img.mode == "RGB" else img.convert("RGB")
    result.save(output, format="JPEG", quality=QUALITY, optimize=True)
    return output.getvalue(), ".jpg"


def compress_image(file_bytes: bytes, filename: str) -> tuple[bytes, str]:
    ext = os.path.splitext(filename)[1].lower()

    if not _is_supported_image(ext):
        return file_bytes, filename

    _validate_file_size(file_bytes)

    img = _open_image(file_bytes)
    if img is None:
        return file_bytes, filename

    img = _prepare_mode(img, ext)
    img = _resize_if_needed(img)
    result_bytes, out_ext = _save_image(img, ext)
    new_filename = os.path.splitext(filename)[0] + out_ext

    return result_bytes, new_filename
