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
    Persist an uploaded file. Uses S3/R2 when settings.USE_S3 is True,
    otherwise falls back to local disk under UPLOAD_DIR/<subfolder>/
    (used for local development).

    Returns
    -------
    stored_name : str   UUID-based filename
    file_ref    : str   S3 object key (if USE_S3) or full local path
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

    stored_name = f"{uuid.uuid4().hex}{ext}"

    # ── Read the whole file into memory, enforcing the size cap ──────────
    # (fine for a journal's PDF/docx/zip uploads at MAX_UPLOAD_SIZE_MB;
    # for much larger files you'd want true streaming multipart upload instead)
    chunks = []
    total = 0
    while chunk := await file.read(1024 * 1024):   # 1 MB chunks
        total += len(chunk)
        if total > MAX_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds the maximum allowed size of "
                       f"{settings.MAX_UPLOAD_SIZE_MB} MB",
            )
        chunks.append(chunk)
    data = b"".join(chunks)

    if settings.USE_S3:
        from app.utils.storage import upload_bytes
        key = f"{subfolder}/{stored_name}" if subfolder else stored_name
        upload_bytes(data, key, content_type=file.content_type or "application/octet-stream")
        return stored_name, key, total

    # ── Local disk fallback ────────────────────────────────────────────
    dest_dir = UPLOAD_BASE / subfolder
    dest_dir.mkdir(parents=True, exist_ok=True)
    file_path = dest_dir / stored_name
    with open(file_path, "wb") as out:
        out.write(data)
    return stored_name, str(file_path), total


def delete_file(file_path: str) -> bool:
    """Remove a stored file — from S3/R2 if settings.USE_S3, else from local disk."""
    if settings.USE_S3:
        from app.utils.storage import delete_object
        return delete_object(file_path)
    p = Path(file_path)
    if p.exists():
        p.unlink()
        return True
    return False