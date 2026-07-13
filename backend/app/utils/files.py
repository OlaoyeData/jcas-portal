import uuid
import os
from pathlib import Path
from fastapi import HTTPException, UploadFile
from app.core.config import settings

UPLOAD_BASE = Path(settings.UPLOAD_DIR)
MAX_BYTES   = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


async def save_upload(
    file: UploadFile,
    subfolder: str = "",
) -> tuple[str, str, int]:
    """
    Persist an uploaded file to disk under UPLOAD_DIR/<subfolder>/.

    Returns
    -------
    stored_name : str   UUID-based filename on disk
    file_path   : str   Full absolute path
    file_size   : int   Bytes written
    """
    # ── Validate extension ───────────────────────────────────────────────
    original   = file.filename or "upload"
    ext        = Path(original).suffix.lower()
    if ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' is not allowed. "
                   f"Accepted: {settings.ALLOWED_FILE_TYPES}",
        )

    # ── Build destination path ───────────────────────────────────────────
    dest_dir = UPLOAD_BASE / subfolder
    dest_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid.uuid4().hex}{ext}"
    file_path   = dest_dir / stored_name

    # ── Stream to disk with size check ──────────────────────────────────
    total = 0
    with open(file_path, "wb") as out:
        while chunk := await file.read(1024 * 1024):   # 1 MB chunks
            total += len(chunk)
            if total > MAX_BYTES:
                out.close()
                file_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=413,
                    detail=f"File exceeds the maximum allowed size of "
                           f"{settings.MAX_UPLOAD_SIZE_MB} MB",
                )
            out.write(chunk)

    return stored_name, str(file_path), total


def delete_file(file_path: str) -> bool:
    """Remove a stored file from disk. Returns True if deleted."""
    p = Path(file_path)
    if p.exists():
        p.unlink()
        return True
    return False
