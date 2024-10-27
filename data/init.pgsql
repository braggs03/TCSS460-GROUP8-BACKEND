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
    );

CREATE TABLE
    Account_Credential (
        Credential_ID SERIAL PRIMARY KEY,
        Account_ID INT NOT NULL,
        Salted_Hash VARCHAR(255) NOT NULL,
        salt VARCHAR(255),
        FOREIGN KEY (Account_ID) REFERENCES Account (Account_ID)
    );

CREATE TABLE
    RAW_BOOKS (
        id INT PRIMARY KEY,
        isbn13 BIGINT,
        authors TEXT,
        publication_year INT,
        original_title TEXT,
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
        publication_year INT NOT NULL,
        original_title TEXT,
        title TEXT NOT NULL,
        rating_avg FLOAT NOT NULL,
        rating_count INT NOT NULL,
        rating_1_star INT NOT NULL,
        rating_2_star INT NOT NULL,
        rating_3_star INT NOT NULL,
        rating_4_star INT NOT NULL,
        rating_5_star INT NOT NULL,
        image_url TEXT,
        image_small_url TEXT
    );

CREATE TABLE
    AUTHORS (id SERIAL PRIMARY KEY, author_name TEXT NOT NULL);

CREATE TABLE
    SERIES (id SERIAL PRIMARY KEY, series_name TEXT NOT NULL);

CREATE TABLE
    BOOK_MAP (
        book_isbn INT NOT NULL,
        author_id INT NOT NULL,
        series_id INT,
        series_position INT,
        FOREIGN KEY (book_isbn) REFERENCES BOOKS (isbn13),
        FOREIGN KEY (author_id) REFERENCES AUTHORS (id),
        FOREIGN KEY (series_id) REFERENCES SERIES (id)
    );

/* Insert data from RAW_BOOKS into BOOKS */
INSERT INTO
    BOOKS
SELECT
    isbn13,
    publication_year,
    original_title,
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
                    regexp_matches(title, '(?<=\(|([0-9]; ))[^,)#]+') as "match"
                FROM
                    RAW_BOOKS
            )
        GROUP BY
            "match"
        HAVING
            COUNT("match") > 1
    )