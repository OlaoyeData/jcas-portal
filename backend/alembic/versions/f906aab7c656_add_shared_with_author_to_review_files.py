"""add shared_with_author to review_files

Revision ID: f906aab7c656
Revises: 0006_payments_review_files
Create Date: 2026-07-08 02:11:17.028486

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f906aab7c656'
down_revision = '0006_payments_review_files'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('review_files', sa.Column('shared_with_author', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('review_files', sa.Column('shared_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('review_files', 'shared_at')
    op.drop_column('review_files', 'shared_with_author')