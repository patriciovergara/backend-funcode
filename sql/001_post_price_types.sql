BEGIN;

ALTER TABLE posts
    ADD COLUMN price_type VARCHAR(10) NOT NULL DEFAULT 'fixed';

ALTER TABLE posts
    ALTER COLUMN price DROP NOT NULL;

ALTER TABLE posts
    DROP CONSTRAINT posts_price_positive;

ALTER TABLE posts
    ADD CONSTRAINT posts_price_type_valid
    CHECK (price_type IN ('fixed', 'from', 'quote'));

ALTER TABLE posts
    ADD CONSTRAINT posts_price_matches_type
    CHECK (
        (
            price_type = 'quote'
            AND price IS NULL
        )
        OR
        (
            price_type IN ('fixed', 'from')
            AND price IS NOT NULL
            AND price > 0
        )
    );

COMMIT;