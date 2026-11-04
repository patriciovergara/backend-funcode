BEGIN;

ALTER TABLE users
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'customer';

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('customer', 'admin'));

COMMIT;