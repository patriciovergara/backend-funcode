BEGIN;

ALTER TABLE posts
    ADD COLUMN original_price NUMERIC(12, 0);

ALTER TABLE posts
    ADD CONSTRAINT posts_original_price_valid
    CHECK (
        original_price IS NULL
        OR (
            price_type IN ('fixed', 'from')
            AND price IS NOT NULL
            AND original_price > price
        )
    );

COMMIT;
