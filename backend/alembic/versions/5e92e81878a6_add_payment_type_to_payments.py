"""add payment_type to payments

Revision ID: 5e92e81878a6
Revises: dd7d4729d788
Create Date: 2026-07-12 19:42:31.863486

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5e92e81878a6'
down_revision = 'dd7d4729d788'
branch_labels = None
depends_on = None


def _get_columns(inspector, table):
    return [col["name"] for col in inspector.get_columns(table)]


def _get_unique_constraint_names(inspector, table):
    return [uc["name"] for uc in inspector.get_unique_constraints(table)]


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    columns = _get_columns(inspector, 'payments')
    if 'payment_type' not in columns:
        op.add_column('payments', sa.Column('payment_type', sa.String(length=20), nullable=False, server_default='publication'))

    # re-inspect since a prior migration may have already swapped the constraint
    inspector = sa.inspect(conn)
    constraints = _get_unique_constraint_names(inspector, 'payments')

    if 'payments_manuscript_id_key' in constraints:
        op.drop_constraint('payments_manuscript_id_key', 'payments', type_='unique')

    if 'uq_payment_manuscript_type' not in constraints:
        op.create_unique_constraint('uq_payment_manuscript_type', 'payments', ['manuscript_id', 'payment_type'])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    constraints = _get_unique_constraint_names(inspector, 'payments')

    if 'uq_payment_manuscript_type' in constraints:
        op.drop_constraint('uq_payment_manuscript_type', 'payments', type_='unique')

    if 'payments_manuscript_id_key' not in constraints:
        op.create_unique_constraint('payments_manuscript_id_key', 'payments', ['manuscript_id'])

    columns = _get_columns(inspector, 'payments')
    if 'payment_type' in columns:
        op.drop_column('payments', 'payment_type')