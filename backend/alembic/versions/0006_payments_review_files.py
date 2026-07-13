"""Add screening, payments, review files, APC fields"""
revision = '0006_payments_review_files'
down_revision = '0005_editor_roles'

from alembic import op

def upgrade():
    # New manuscript statuses
    op.execute("ALTER TYPE manuscriptstatus ADD VALUE IF NOT EXISTS 'desk_rejected'")
    op.execute("ALTER TYPE manuscriptstatus ADD VALUE IF NOT EXISTS 'awaiting_payment'")

    # Screening timestamp on manuscripts
    op.execute("ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS screened_at TIMESTAMPTZ")
    op.execute("ALTER TABLE manuscripts ADD COLUMN IF NOT EXISTS screened_by INTEGER REFERENCES users(id)")

    # Payments table
    op.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id               SERIAL PRIMARY KEY,
            manuscript_id    INTEGER UNIQUE REFERENCES manuscripts(id),
            amount           FLOAT   NOT NULL DEFAULT 0,
            currency         VARCHAR(10)  DEFAULT 'USD',
            status           VARCHAR(30)  NOT NULL DEFAULT 'pending',
            proof_filename   VARCHAR(500),
            proof_stored_name VARCHAR(500),
            proof_file_path  VARCHAR(1000),
            proof_mime_type  VARCHAR(100),
            proof_uploaded_at TIMESTAMPTZ,
            confirmed_by     INTEGER REFERENCES users(id),
            confirmed_at     TIMESTAMPTZ,
            notes            TEXT,
            created_at       TIMESTAMPTZ DEFAULT NOW()
        )
    """)

    # Review supplementary files table
    op.execute("""
        CREATE TABLE IF NOT EXISTS review_files (
            id          SERIAL PRIMARY KEY,
            review_id   INTEGER REFERENCES reviews(id),
            filename    VARCHAR(500) NOT NULL,
            stored_name VARCHAR(500) NOT NULL,
            file_path   VARCHAR(1000) NOT NULL,
            file_size   INTEGER,
            mime_type   VARCHAR(100),
            uploaded_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)

    # Bank / APC fields on journal_settings
    op.execute("ALTER TABLE journal_settings ADD COLUMN IF NOT EXISTS bank_name VARCHAR(200)")
    op.execute("ALTER TABLE journal_settings ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(200)")
    op.execute("ALTER TABLE journal_settings ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100)")
    op.execute("ALTER TABLE journal_settings ADD COLUMN IF NOT EXISTS bank_routing_code VARCHAR(100)")
    op.execute("ALTER TABLE journal_settings ADD COLUMN IF NOT EXISTS apc_amount FLOAT DEFAULT 0")
    op.execute("ALTER TABLE journal_settings ADD COLUMN IF NOT EXISTS apc_currency VARCHAR(10) DEFAULT 'USD'")
    op.execute("ALTER TABLE journal_settings ADD COLUMN IF NOT EXISTS apc_waiver_policy TEXT")

def downgrade():
    pass