"""add payment_type to payments

Revision ID: dd7d4729d788
Revises: f906aab7c656
Create Date: 2026-07-10 01:41:07.266382

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'dd7d4729d788'
down_revision = 'f906aab7c656'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('payments', sa.Column('payment_type', sa.String(length=20), nullable=False, server_default='publication'))
    op.drop_constraint('payments_manuscript_id_key', 'payments', type_='unique')
    op.create_unique_constraint('uq_payment_manuscript_type', 'payments', ['manuscript_id', 'payment_type'])


def downgrade() -> None:
    op.drop_constraint('uq_payment_manuscript_type', 'payments', type_='unique')
    op.create_unique_constraint('payments_manuscript_id_key', 'payments', ['manuscript_id'])
    op.drop_column('payments', 'payment_type')