"""
S3-compatible object storage helper.

Works with real AWS S3 (leave S3_ENDPOINT_URL blank) or any S3-compatible
service such as Cloudflare R2 (set S3_ENDPOINT_URL to your R2 endpoint).
Only imported/used when settings.USE_S3 is True — local disk storage
(app/utils/files.py) still works unchanged for local development.
"""
import boto3
from botocore.client import Config as BotoConfig
from app.core.config import settings

_client = None


def get_s3_client():
    global _client
    if _client is None:
        kwargs = {
            "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
            "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
            "region_name": settings.AWS_REGION,
            # R2/S3-compatible services generally want path-style addressing
            "config": BotoConfig(signature_version="s3v4", s3={"addressing_style": "path"}),
        }
        if settings.S3_ENDPOINT_URL:
            kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
        _client = boto3.client("s3", **kwargs)
    return _client


def upload_bytes(data: bytes, key: str, content_type: str = "application/octet-stream") -> None:
    """Upload raw bytes to the configured bucket under `key`."""
    get_s3_client().put_object(
        Bucket=settings.AWS_S3_BUCKET,
        Key=key,
        Body=data,
        ContentType=content_type,
    )


def generate_download_url(key: str, filename: str = None, expires_in: int = 3600) -> str:
    """Return a time-limited presigned URL the browser can download/redirect to directly —
    the file never has to pass through our own server, which saves bandwidth and CPU
    on a small free-tier backend."""
    params = {"Bucket": settings.AWS_S3_BUCKET, "Key": key}
    if filename:
        params["ResponseContentDisposition"] = f'attachment; filename="{filename}"'
    return get_s3_client().generate_presigned_url(
        "get_object", Params=params, ExpiresIn=expires_in
    )


def delete_object(key: str) -> bool:
    try:
        get_s3_client().delete_object(Bucket=settings.AWS_S3_BUCKET, Key=key)
        return True
    except Exception:
        return False