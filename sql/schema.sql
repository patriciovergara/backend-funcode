BEGIN;

CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_name_not_blank
        CHECK (LENGTH(TRIM(name)) > 0),

    CONSTRAINT users_email_not_blank
        CHECK (LENGTH(TRIM(email)) > 0)
);

CREATE TABLE categories (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,

    CONSTRAINT categories_name_not_blank
        CHECK (LENGTH(TRIM(name)) > 0)
);

CREATE TABLE posts (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 0) NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT posts_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT posts_category_fk
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,

    CONSTRAINT posts_title_not_blank
        CHECK (LENGTH(TRIM(title)) > 0),

    CONSTRAINT posts_description_not_blank
        CHECK (LENGTH(TRIM(description)) > 0),

    CONSTRAINT posts_price_positive
        CHECK (price > 0),

    CONSTRAINT posts_image_url_not_blank
        CHECK (LENGTH(TRIM(image_url)) > 0)
);

CREATE INDEX posts_user_created_idx
    ON posts (user_id, created_at DESC, id DESC);

CREATE INDEX posts_category_idx
    ON posts (category_id);

INSERT INTO categories (name)
VALUES
    (U&'P\00E1ginas web'),
    (U&'Cat\00E1logos digitales'),
    (U&'Sistemas de gesti\00F3n');

COMMIT;