BEGIN;

TRUNCATE TABLE
    manuscript_status_history,
    manuscript_files,
    manuscript_authors,
    review_files,
    reviews,
    review_assignments,
    payments,
    notifications,
    articles,
    issues,
    volumes,
    manuscripts,
    editor_invitations,
    announcements,
    email_templates,
    journal_settings,
    subject_areas,
    users
RESTART IDENTITY CASCADE;

INSERT INTO users (
    email, hashed_password, name, role,
    is_active, is_verified, is_approved,
    created_at, updated_at
) VALUES (
    'admin@jcas.com',
    '$2b$12$V/kX134Nv9rz0B/oR5ZTbuUKE6FIO4liD4Up/r09.4e/kCXodivMu',
    'System Administrator',
    'admin',
    true, true, true,
    now(), now()
);

INSERT INTO users (
    email, hashed_password, name, role,
    is_active, is_verified, is_approved,
    created_at, updated_at
) VALUES (
    'jcas@aaua.edu.ng',
    '$2b$12$zOjcGBeVGDc/mMJ267RMz.74AQBle1DapPpbgFnSO9PP7.H0vnjNG',
    'Editor in Chief',
    'editor_in_chief',
    true, true, true,
    now(), now()
);

COMMIT;