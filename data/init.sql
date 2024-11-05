-- Active: 1710457548247@@127.0.0.1@5432@tcss460@public
CREATE TABLE
    Demo (
        DemoID SERIAL PRIMARY KEY,
        Priority INT,
        Name TEXT NOT NULL UNIQUE,
        Message TEXT
    );

CREATE TABLE
    Account (
        Account_ID SERIAL PRIMARY KEY,
        FirstName VARCHAR(255) NOT NULL,
        LastName VARCHAR(255) NOT NULL,
        Username VARCHAR(255) NOT NULL UNIQUE,
        Email VARCHAR(255) NOT NULL UNIQUE,
        Phone VARCHAR(15) NOT NULL UNIQUE,
        Account_Role int NOT NULL 
            CHECK (Account_Role >= 0 AND Account_Role <=2)
    );

CREATE TABLE
    Account_Credential (
        Credential_ID SERIAL PRIMARY KEY,
        Account_ID INT NOT NULL,
        Salted_Hash VARCHAR(255) NOT NULL,
        salt VARCHAR(255),
        FOREIGN KEY (Account_ID) REFERENCES Account (Account_ID)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    );

CREATE TABLE
    RAW_BOOKS (
        isbn13 BIGINT,
        authors TEXT,
        publication_year INT,
        title TEXT,
        rating_avg FLOAT,
        rating_count INT,
        rating_1_star INT,
        rating_2_star INT,
        rating_3_star INT,
        rating_4_star INT,
        rating_5_star INT,
        image_url TEXT,
        image_small_url TEXT
    );

COPY RAW_BOOKS
FROM
    '/docker-entrypoint-initdb.d/books.csv' DELIMITER ',' CSV HEADER;

CREATE TABLE
    BOOKS (
        isbn13 BIGINT PRIMARY KEY NOT NULL,
        publication_year INT NOT NULL CHECK (publication_year > 0),
        title TEXT NOT NULL,
        rating_avg FLOAT NOT NULL CHECK (rating_avg >= 0),
        rating_count INT NOT NULL CHECK (rating_count >=0),
        rating_1_star INT NOT NULL CHECK (rating_1_star >=0),
        rating_2_star INT NOT NULL CHECK (rating_2_star >=0),
        rating_3_star INT NOT NULL CHECK (rating_3_star >=0),
        rating_4_star INT NOT NULL CHECK (rating_4_star >=0),
        rating_5_star INT NOT NULL CHECK (rating_5_star >=0),
        image_url TEXT,
        image_small_url TEXT
    );

CREATE TABLE
    AUTHORS (
        id SERIAL PRIMARY KEY,
        author_name TEXT NOT NULL
    );

CREATE TABLE
    SERIES (
        id SERIAL PRIMARY KEY,
        series_name TEXT NOT NULL
    );

CREATE TABLE
    BOOK_MAP (
        book_isbn BIGINT NOT NULL,
        author_id INT NOT NULL,
        series_id INT,
        series_position INT,
        FOREIGN KEY (book_isbn) REFERENCES BOOKS (isbn13)
            ON DELETE CASCADE
            ON UPDATE CASCADE, 
        FOREIGN KEY (author_id) REFERENCES AUTHORS (id) 
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        FOREIGN KEY (series_id) REFERENCES SERIES (id) 
            ON DELETE SET NULL
    );

/* Insert data from RAW_BOOKS into BOOKS */
INSERT INTO
    BOOKS
SELECT
    isbn13,
    ABS(publication_year),
    title,
    rating_avg,
    rating_count,
    rating_1_star,
    rating_2_star,
    rating_3_star,
    rating_4_star,
    rating_5_star,
    image_url,
    image_small_url
FROM
    RAW_BOOKS;

/* Insert data from RAW_BOOKS into SERIES */
INSERT INTO
    AUTHORS (author_name)
SELECT DISTINCT
    STRING_TO_TABLE(authors, ', ')
FROM
    RAW_BOOKS;

/* Insert data from RAW_BOOKS into SERIES */
/**
 * Entry examples:
Zero History (Blue Ant, #3; The other series, #4)
Unseen Academicals (Discworld, #37; Rincewind #8)
The Art of Asking; or, How I Learned to Stop Worrying and Let People Help
The Emperor's Code (The 39 Clues, #8)
Beyond the Grave (The 39 Clues #4)
A Dog's Journey (A Dog's Purpose, #2)
Y: The Last Man, Vol. 6: Girl on Girl (Y: The Last Man, #6)
 */
INSERT INTO
    SERIES (series_name)
SELECT
    "name"
FROM
    (
        SELECT
            TRIM("match" [1]) as "name",
            COUNT(TRIM("match" [1]))
        FROM
            (
                SELECT
                    regexp_matches(title, '(?<=\(|([0-9]; ))[^,)#]+', 'g') as "match"
                FROM
                    RAW_BOOKS
            )
        GROUP BY
            "match"
        HAVING
            COUNT("match") > 1
    );

/**
 * Insert data from RAW_BOOKS into BOOK_MAP
 */
INSERT INTO
    BOOK_MAP
SELECT
    isbn13 as "book_isbn",
    AUTHORS.id as "author_id",
    SERIES.id as "series_id",
    "positions"."series_pos"
FROM
    AUTHORS
    JOIN RAW_BOOKS ON authors LIKE '%' || author_name || '%' /* author_name is a substring of authors */
    /* series_name is a substring of title inside parenthesis. */
    LEFT JOIN SERIES ON (
        title LIKE '%(' || series_name || ', #%)'
        OR title LIKE '%; ' || series_name || ', #%)'
    )
    LEFT JOIN (
        /* series_pos is a number after # */
        SELECT
            isbn13 as "isbn13_series",
            regexp_matches(title, '(?<=\(|([0-9]; ))[^,)#]+', 'g') as "series_name",
            NULLIF(
                (
                    regexp_matches(title, '(?<= #)[-0-9]+', 'g')::int[]
                ) [1],
                -1
            ) as "series_pos"
        FROM
            RAW_BOOKS
    ) AS "positions" ON isbn13 = "isbn13_series";

/**
 * Remove series from title
 */
UPDATE BOOKS
SET
    title = substring(BOOKS.title for strpos(BOOKS.title, '(') -2)
WHERE
    (
        title LIKE '%(%'
        AND title LIKE '%#%'
    )