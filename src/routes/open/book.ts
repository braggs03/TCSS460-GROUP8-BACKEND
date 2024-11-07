import express, { NextFunction, Router, Request, Response } from 'express';
import { pool, validationFunctions } from '../../core/utilities';
import {
    RATING_MAX_DEFAULT,
    RATING_MIN_DEFAULT,
    SQL_ERR,
} from '../../core/utilities/constants';
import {
    getBookInfoQuery,
    convertBookInfoToIBookInfo,
    mwRatingAverage,
    determineRatingChange,
    getDeleteBookQuery,
} from '../../core/utilities/helpers';
import { checkToken } from '../../core/middleware';

const bookRouter: Router = express.Router();

/**
 * @api {get} /book/isbn Request to get a book by ISBN.
 * @apiDescription Retrieve a book by a valid ISBN13. The ISBN13 must be valid and passed in as a number.
 * @apiName GetBookByISBN
 * @apiGroup Book
 *
 * @apiQuery {number} isbn a book ISBN to look up.
 *
 * @apiSuccess (200: API Success) {IBook} entry A IBook object. View documentation for object fields.
 *
 * @apiError (400: Missing ISBN) {String} message Missing 'isbn' query parameter.
 * @apiError (404: ISBN Not Found) {String} message Book not found.
 * @apiError (400: Bad ISBN) {String} message ISBN not valid. ISBN should be a positive 13 digit number.
 * @apiUse JWT
 * @apiUse SQL_ERR
 */
bookRouter.get(
    '/isbn',
    checkToken,
    (request: Request, response: Response, next: NextFunction) => {
        if (request.query.isbn === undefined) {
            return response.status(400).send({
                message: "Missing 'isbn' query parameter.",
            });
        }
        if (
            !validationFunctions.isNumberProvided(request.query.isbn) ||
            !validationFunctions.validateISBN(
                request.query.isbn as unknown as number
            )
        ) {
            return response.status(400).send({
                message:
                    'ISBN not valid. ISBN should be a positive 13 digit number.',
            });
        }
        return next();
    },
    async (request: Request, response: Response) => {
        const theQuery = getBookInfoQuery('book_isbn = $1');

        const values = [request.query.isbn];

        await pool
            .query(theQuery, values)
            .then((result) => {
                if (result.rows.length === 0) {
                    return response.status(404).send({
                        message: 'Book not found.',
                    });
                }
                return response.status(200).send({
                    entry: convertBookInfoToIBookInfo(result.rows[0]),
                });
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on GET /isbn');
                console.error(error);
                return response.status(500).send({
                    message: SQL_ERR,
                });
            });
    }
);

/**
 * @api {get} /book/year Request to books with a given year.
 * @apiDescription You can request a range of books by year (e.g 2020-2022). If a user only wants to search by one year, enter the same number for both parameters (e.g: 2022-2022).
 * @apiName GetBookByYear
 * @apiGroup Book
 *
 * @apiQuery {number} [year_min = 1600] a minimum year for the range
 * @apiQuery {number} [year_max = 3000] a maximum year for the range
 *
 * @apiUse IBook
 * 
 * @apiError (400: Year Parameter Invalid) {String} message Year parameter is invalid. A year should be a number between 1600 and 3000. Additionally, the minimum year should be less than or equal to the maximum year.
 * @apiError (404: Year not found) {string} message No books found for the given year range.
 * @apiUse JWT
 * @apiUse SQL_ERR
 */
bookRouter.get('/year', checkToken, (request: Request, response: Response) => {
    const yearMin = parseInt(request.query.year_min as string);
    const yearMax = parseInt(request.query.year_max as string);
    if (!validationFunctions.validateYear(yearMin, yearMax)) {
        return response.status(400).send({
            message:
                'Year parameter is invalid. A year should be a number between 1600 and 3000. Additionally, the minimum year should be less than or equal to the maximum year.',
        });
    }

    const theQuery = getBookInfoQuery('publication_year BETWEEN $1 AND $2');

    pool.query(theQuery, [yearMin, yearMax])
        .then((result) => {
            if (result.rows.length === 0) {
                return response.status(404).send({
                    message: 'No books found for the given year range.',
                });
            }
            return response
                .status(200)
                .send({ entries: result.rows.map(convertBookInfoToIBookInfo) });
        })
        .catch((error) => {
            console.error('DB Query error on GET by year');
            console.error(error);
            response.status(500).send({ message: SQL_ERR });
        });
});

/**
 * @api {get} /book/title Request a book by title.
 * @apiDescription Used to request a list of book by title. Title does not have to be exact.
 * @apiName GetBookByTitle
 * @apiGroup Book
 *
 * @apiQuery {string} title The book title to search for.
 *
 * @apiUse IBook
 *
 * @apiError (400: Missing Title) {String} message Title was not provided.
 * @apiError (404: Title not found) {String} message No books found for that given title.
 * @apiUse JWT
 * @apiUse SQL_ERR
 */
bookRouter.get('/title', checkToken, (request, response) => {
    const titleQuery = request.query.title as string;
    if (!validationFunctions.validateTitle(titleQuery)) {
        return response.status(400).send({
            message: 'Title was not provided.',
        });
    }
    const theQuery = getBookInfoQuery("title LIKE '%'||$1||'%'");
    
    pool.query(theQuery, [titleQuery])
        .then((result) => {
            if (result.rows.length === 0) {
                return response.status(404).send({
                    message: 'No books found for that given title.',
                });
            }
            return response
                .status(200)
                .send({ entries: result.rows.map(convertBookInfoToIBookInfo) });
        })
        .catch((error) => {
            console.error('DB Query error on GET title');
            console.error(error);
            response.status(500).send({
                message: SQL_ERR,
            });
        });
});

/**
 * @api {get} /book/rating Request to books within a given range of ratings.
 * @apiDescription If book(s) from a point and up are desired, only set rating_min. If book(s) from a point and below are desired, only set rating_max. Both can be suppiled to get the book(s) within that range inclusively. If a specific rating is required, set rating_min and rating_max to the same value. If no ratings are provided, default values of 1 and 5 are used for the min and max, respectfully.
 * @apiName GetBookByRating
 * @apiGroup Book
 *
 * @apiBody {number} [rating_min=1] a minimum rating required for a book.
 * @apiBody {number} [rating_max=5] a maximum rating required for a book.
 * @apiUse Pagination_Input
 *
 * @apiUse IBook
 * @apiUse Pagination_Output
 * 
 * @apiError (400: Missing max and min rating) {String} message "Missing max and min rating, atleast one of which should be supplied.""
 * @apiError (400: Bad maximum or minimum rating) {String} message "Min or Max is not a valid rating, should be a floating point from 1 to 5 with no crossover i.e rating_min <= rating_max."
 * @apiUse JWT
 * @apiUse SQL_ERR
 */
bookRouter.get(
    '/rating',
    checkToken,
    (request: Request, response: Response, next: NextFunction) => {
        if (
            request.query.rating_min === undefined &&
            request.query.rating_max === undefined
        ) {
            response.status(400).send({
                message: 'Missing maximum and minimum rating.',
            });
        } else {
            const ratingMin: number =
                request.query.rating_min !== undefined
                    ? +request.query.rating_min
                    : RATING_MIN_DEFAULT;
            const ratingMax: number =
                request.query.rating_max !== undefined
                    ? +request.query.rating_max
                    : RATING_MAX_DEFAULT;
            if (
                validationFunctions.isNumberProvided(ratingMin) &&
                validationFunctions.isNumberProvided(ratingMax) &&
                validationFunctions.validateRatings(+ratingMin, +ratingMax)
            ) {
                request.query.rating_min = ratingMin.toString();
                request.query.rating_max = ratingMax.toString();
                next();
            } else {
                return response.status(400).send({
                    message: 'Bad maximum and/or minimum rating.',
                });
            }
        }
    },
    async (request: Request, response: Response) => {
        validationFunctions.validatePagination(request);
        const query =
            getBookInfoQuery('rating_avg BETWEEN $1 AND $2') +
            ' ORDER BY rating_avg DESC LIMIT $3 OFFSET $4';

        const values = [
            request.query.rating_min,
            request.query.rating_max,
            request.query.limit,
            request.query.offset,
        ];

        const count = await pool.query(
            'SELECT count(*) AS exact_count FROM books;'
        );

        pool.query(query, values)
            .then((result) => {
                if (result.rows.length === 0) {
                    return response.status(404).send({
                        message: 'No books found for the given rating range.',
                    });
                }
                response.status(200).send({ 
                    entries: result.rows.map(convertBookInfoToIBookInfo), 
                    pagination: {
                        totalRecords: count.rows[0].exact_count,
                        limit: request.query.limit,
                        offset: request.query.offset,
                        nextPage: +request.query.limit + +request.query.offset,
                    } 
                });
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on GET /ratings');
                console.error(error);
                response.status(500).send({
                    message: SQL_ERR,
                });
            });
    }
);

/**
 * @api {get} /book/series Request to get all series names
 * @apiDescription Used to retrieve the name of all series names.
 * @apiName GetSeriesNames
 * @apiGroup Book
 *
 * @apiUse IBook
 *
 * @apiUse JWT
 * @apiUse SQL_ERR
 */
bookRouter.get(
    '/series',
    checkToken,
    (request: Request, response: Response) => {
        const theQuery = `
        SELECT series_name
        FROM SERIES;`;

        pool.query(theQuery)
            .then((result) => {
                const names = { series_names: [] };
                for (const row of result.rows) {
                    names.series_names.push(row.series_name);
                }
                response.send(names);
            })
            .catch((error) => {
                console.error('DB Query error on GET all series');
                console.error(error);
                response.status(500).send({
                    message: 'SQL Error. Call 911.',
                });
            });
    }
);

/**
 * @api {get} /book/series/:series Request to get all books in a series.
 * @apiDescription Used to retrieve all books in a series. Series name must match exactly. If exact series name is unknown, consult /book/series route.
 * @apiName GetBooksInSeries
 * @apiGroup Book
 *
 * @apiParam {string} series a series name.
 *
 * @apiUse IBook
 *
 * @apiError (400: Missing Name) {String} message "name route parameter is missing."
 * @apiUse JWT
 * @apiUse SQL_ERR
 */
bookRouter.get(
    '/series/:name',
    checkToken,
    (request: Request, response: Response, next: NextFunction) => {
        if (request.params.name == undefined) {
            return response.status(400).send({
                message: 'name route parameter is missing.',
            });
        }
        next();
    },
    (request: Request, response: Response) => {
        const theQuery =
            getBookInfoQuery('series_name = $1') + ' ORDER BY series_position';

        const values = [request.params.name];

        pool.query(theQuery, values)
            .then((result) => {
                response.status(200).send({
                    entries: result.rows.map(convertBookInfoToIBookInfo),
                });
            })
            .catch((error) => {
                console.error('DB Query error on GET all series');
                console.error(error);
                response.status(500).send({
                    message: SQL_ERR,
                });
            });
    }
);

/**
 * @api {get} /book/:author Request to a get a book by author.
 * @apiDescription Used to retrieve all books in by an author. Author name must match exactly.
 * @apiName GetBookByAuthor
 * @apiGroup Book
 *
 * @apiSuccess {string} author The Author's full name
 *
 * @apiParam {string} author The name of the author to search for.
 *
 * @apiError (400: Missing Author) {string} message 'author' query parameter is missing.
 * @apiError (404: Author not found) {string} message Author was not found.
 * @apiUse JWT
 * @apiUse SQL_ERR
 */
bookRouter.get(
    '/authors/:author?',
    checkToken,
    async (request: Request, response: Response) => {
        const authorName = request.params.author;
        if (!authorName) {
            return response.status(400).send({
                message: "Missing 'author' parameter.",
            });
        }

        const theQuery = `SELECT id, author_name FROM AUTHORS WHERE author_name ILIKE '%'||$1||'%';`;

        const authorIds = [];

        await pool
            .query(theQuery, [authorName])
            .then((result) => {
                if (result.rows.length === 0) {
                    return response.status(404).send({
                        message: 'Author was not found.',
                    });
                }
                result.rows.map((row: { id: string }) => {
                    authorIds.push(row.id);
                });
            })
            .catch((error) => {
                console.error('DB Query error on GET /:author', error);
                response.status(500).send({
                    message: SQL_ERR,
                });
            });

        if (response.headersSent) return;

        const theBookQuery = getBookInfoQuery('author_id = ANY($1::integer[])');

    await pool
        .query(theBookQuery, [authorIds])
        .then((result) => {
                response.status(200).send({
                    entries: result.rows.map(convertBookInfoToIBookInfo),
                });
        })
        .catch((error) => {
            console.error('DB Query error on GET /:author', error);
            response.status(500).send({
                message: SQL_ERR,
            });
        });
    }
);

/**
 * @api {get} /book Request to get all book(s).
 * @apiDescription Retrieves all books in the database.
 * @apiName GetAllBooks
 * @apiGroup Book
 * 
 * @apiUse Pagination_Input
 *
 * @apiUse IBook
 * @apiUse Pagination_Output
 * 
 * @apiUse JWT
 * @apiUse SQL_ERR
 */
bookRouter.get('/', checkToken, async (request: Request, response: Response) => {
    validationFunctions.validatePagination(request);

    const theQuery = getBookInfoQuery() + ' ORDER BY title LIMIT $1 OFFSET $2';
    const values = [request.query.limit, request.query.offset];

    const count = await pool.query(
        'SELECT count(*) AS exact_count FROM books;'
    );

    pool.query(theQuery, values)
        .then((result) => {
            response.send({ 
                entries: result.rows.map(convertBookInfoToIBookInfo), 
                pagination: {
                    totalRecords: count.rows[0].exact_count,
                    limit: request.query.limit,
                    offset: request.query.offset,
                    nextPage: +request.query.limit + +request.query.offset,
                } 
            });
        })
        .catch((error) => {
            console.error('DB Query error on GET all');
            console.error(error);
            response.status(500).send({
                message: SQL_ERR,
            });
        });
});

/**
 * @api {put} /book Request to change a book by rating
 *
 * @apiDescription Request to change a book's rating (by adding/changing stars). If the user enters a 1 into the field, the rating is +1, if it's 0/undefined, the rating is not changed,
 * if the rating is given -1, then we subtract -1 from that rating. A user cannot send no ratings to be updated...
 *
 * @apiName PutBook
 * @apiGroup Book
 *
 * @apiBody {number} isbn the isbn of the book that needs to be changed
 * @apiBody {number} [new_star1] 1 stars of the book that needs to be updated
 * @apiBody {number} [new_star2] 2 stars of the book that needs to be updated
 * @apiBody {number} [new_star3] 3 stars of the book that needs to be updated
 * @apiBody {number} [new_star4] 4 stars of the book that needs to be updated
 * @apiBody {number} [new_star5] 5 stars of the book that needs to be updated
 * 
 * @apiSuccess {String} success The rating was successfully updated
 *
 * @apiError (404: Book Not Found) {String} message ISBN does not exist - update failed.
 * @apiError (400: Missing Parameters) {String} message You cannot leave all ratings undefined or 0. You must update at least one rating!
 * @apiUse JWT
 * @apiUse SQL_ERR
 */
bookRouter.put('/', checkToken, (request: Request, response: Response) => {
    if (!request.body.isbn) {
        return response.status(400).send({
            message: 'You are missing parameters (either isbn or rating). You MUST provide an ISBN and at least 1 rating to update.',
        });
    }
    if (
        (request.body.new_star1 === undefined &&
        request.body.new_star2 === undefined &&
        request.body.new_star3 === undefined &&
        request.body.new_star4 === undefined &&
        request.body.new_star5 === undefined) ||
        (request.body.new_star1 === 0 &&
            request.body.new_star2 === 0 &&
            request.body.new_star3 === 0 &&
            request.body.new_star4 === 0 &&
            request.body.new_star5 === 0)) {
        return response.status(400).send({
            message: 'You cannot leave all ratings undefined or 0. You must update at least one rating!',
        });
    }
    const theQuery = getBookInfoQuery('book_isbn = $1');
    pool.query(theQuery, [request.body.isbn])
        .then((result) => {
            if (result.rows.length === 0) {
                return response.status(404).send({
                    message: 'ISBN does not exist - update failed.'
                });
            }
            const newStars = [
                request.body.new_star1,
                request.body.new_star2,
                request.body.new_star3,
                request.body.new_star4,
                request.body.new_star5,
            ];
            const ratingChange = newStars.map(
                (rating, index) =>
                    determineRatingChange(rating) +
                    result.rows[0][`rating_${index + 1}_star`]
            );
            const ratingCount =
                ratingChange[0] +
                ratingChange[1] +
                ratingChange[2] +
                ratingChange[3] +
                ratingChange[4];
            const ratingAvg = mwRatingAverage(
                ratingChange[0],
                ratingChange[1],
                ratingChange[2],
                ratingChange[3],
                ratingChange[4],
                ratingCount
            );
            const updateQuery = `
            UPDATE BOOKS
            SET 
                rating_1_star = $1,
                rating_2_star = $2,
                rating_3_star = $3,
                rating_4_star = $4,
                rating_5_star = $5,
                rating_count = $6,
                rating_avg = $7
            WHERE isbn13 = $8; `;
            pool.query(updateQuery, [ratingChange[0],ratingChange[1],ratingChange[2], ratingChange[3],ratingChange[4], ratingCount, ratingAvg, result.rows[0].book_isbn])
                .then(() => {
                    return response.status(200).send({entry: convertBookInfoToIBookInfo(result.rows[0])});
                }).catch((error) => {
                    return response.status(500).send({
                        message: SQL_ERR,
                    });
                });
        })
        .catch((error) => {
            return response.status(500).send({
                message: SQL_ERR,
            });
        });
    });

/**
 * @api {post} /book Request to add a book
 *
 * @apiDescription Request to add a book into the database. If the book is not a series, you must enter an empty string for series_name and enter null for series_pos
 *
 * @apiName PostBook
 * @apiGroup Book
 *
 * @apiBody {number} isbn the isbn of the book that needs to be added
 * @apiBody {number} publication_year the year of the book that needs to be added
 * @apiBody {string} title the title of the book that needs to be added
 * @apiBody {string} series_name the series of the book that needs to be added
 * @apiBody {number} series_pos the series number of the book that needs to be added
 * @apiBody {string[]} authors an array of authors, they must be comma separated.
 * @apiBody {number} [rating_1=0] rating_1 the number of 1 stars of the book that needs to be added
 * @apiBody {number} [rating_2=0] rating_2 the number of 2 stars of the book that needs to be added
 * @apiBody {number} [rating_3=0] rating_3 the number of 3 stars of the book that needs to be added
 * @apiBody {number} [rating_4=0] rating_4 the number of 4 stars of the book that needs to be added
 * @apiBody {number} [rating_5=0] rating_5 the number of 5 stars of the book that needs to be added
 * @apiBody {string} image_url the url of the book that needs to be added
 * @apiBody {string} small_url the small image url that needs to be added
 *
 * @apiSuccess (Success 201) {String} success the book was created
 *
 * @apiError (400: Missing Parameters) {String} message One of the parameters is missing! Please re-check to see you have all required fields!.
 * @apiError (400: ISBN Invalid) {String} message ISBN not valid. ISBN should be a positive 13 digit number.
 * @apiError (400: Empty Title) {String} message Title is empty and/or year is not in the range of 1600 - 3000
 * @apiError (404: Duplicate ISBN) {String} message Cannot have duplicate ISBNs! Try a different value.
 * @apiUse JWT
 * @apiUse SQL_ERR
 */
bookRouter.post(
    '/',
    checkToken,
    (request: Request, response: Response, next: NextFunction) => {
        if (
            request.body.isbn13 === undefined ||
            request.body.publication_year === undefined ||
            request.body.title === undefined ||
            request.body.image_url === undefined ||
            request.body.small_url === undefined
        ) {
            return response.status(400).send({
                message:
                    'One of the parameters is missing! Please re-check to see you have all required fields!',
            });
        }

        if (
            !validationFunctions.isNumberProvided(request.body.isbn13) ||
            !validationFunctions.validateISBN(
                request.body.isbn13 as unknown as number
            )
        ) {
            return response.status(400).send({
                message:
                    'ISBN not valid. ISBN should be a positive 13 digit number.',
            });
        }
        if (
            !validationFunctions.validateTitle(request.body.title) ||
            !validationFunctions.validatePostYear(request.body.publication_year)
        ) {
            return response.status(400).send({
                message:
                    'Title is empty and/or year is not in the range of 1600 - 3000',
            });
        }

        return next();
    },
    async (request: Request, response: Response) => {
        const bookISBN = request.body.isbn13;
        const rating1 = request.body.rating_1 > 0 ? request.body.rating_1 : 0;
        const rating2 = request.body.rating_2 > 0 ? request.body.rating_2 : 0;
        const rating3 = request.body.rating_3 > 0 ? request.body.rating_3 : 0;
        const rating4 = request.body.rating_4 > 0 ? request.body.rating_4 : 0;
        const rating5 = request.body.rating_5 > 0 ? request.body.rating_5 : 0;
        const ratingCount = rating1 + rating2 + rating3 + rating4 + rating5;
        const ratingAvg = mwRatingAverage(
            rating1,
            rating2,
            rating3,
            rating4,
            rating5,
            ratingCount
        );

        const authors = request.body.authors || [];
        const authorIds: number[] = [];

        for (const authorName of authors) {
            const authorQuery = `SELECT id FROM AUTHORS WHERE author_name = $1`;
            const authorResult = await pool.query(authorQuery, [authorName]);

            if (authorResult.rows.length > 0) {
                authorIds.push(authorResult.rows[0].id);
            } else {
                const insertAuthorQuery = `INSERT INTO AUTHORS (author_name) VALUES ($1) RETURNING id`;
                const insertResult = await pool.query(insertAuthorQuery, [
                    authorName,
                ]);
                authorIds.push(insertResult.rows[0].id);
            }
        }

        let seriesId: number = null;
        const seriesName = request.body.series_name;
        if (request.body.series_pos && request.body.series_name) {
            const seriesQuery = `SELECT id FROM SERIES WHERE series_name = $1`;
            const seriesResult = await pool.query(seriesQuery, [
                request.body.series_name,
            ]);

            if (seriesResult.rows.length > 0) {
                seriesId = seriesResult.rows[0].id;
            } else {
                const insertSeriesQuery = `INSERT INTO SERIES (series_name) VALUES ($1) RETURNING id`;
                const insertSeriesResult = await pool.query(insertSeriesQuery, [
                    request.body.series_name,
                ]);
                seriesId = insertSeriesResult.rows[0].id;
            }
        }

        const insertBookQuery = `
        INSERT INTO BOOKS (isbn13, publication_year, title, rating_avg, rating_count, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`;
        await pool
            .query(insertBookQuery, [
                bookISBN,
                request.body.publication_year,
                request.body.title,
                ratingAvg,
                ratingCount,
                rating1,
                rating2,
                rating3,
                rating4,
                rating5,
                request.body.image_url,
                request.body.small_url,
            ])
            .then((result) => {
                response.status(201).send({
                    isbn13: bookISBN,
                    publication_year: request.body.publication_year,
                    title: request.body.title,
                    rating_avg: ratingAvg,
                    rating_count: ratingCount,
                    rating_1: rating1,
                    rating_2: rating2,
                    rating_3: rating3,
                    rating_4: rating4,
                    rating_5: rating5,
                    image_url: request.body.image_url,
                    image_small_url: request.body.small_url,
                    authors: authors.join(", "),
                    series_name: seriesName,
                    series_pos: request.body.series_pos,
                });
            })
            .catch((error) => {
                if (
                    error.detail != undefined &&
                    (error.detail as string).endsWith('already exists.')
                ) {
                    response.status(400).send({
                        message: 'Cannot have duplicate ISBNs! Try a different value.',
                    });
                } else {
                    console.error(error);
                    response.status(500).send({
                        message: SQL_ERR,
                    });
                }
            });
        const seriesPos = request.body.series_pos;
        for (const idOfAuthor of authorIds) {
             pool.query(
                `INSERT INTO BOOK_MAP (book_isbn, author_id, series_id, series_position) VALUES ($1, $2, $3, $4)`,
                [request.body.isbn13, idOfAuthor, seriesId, seriesPos]
            );
        }
    }
);

/**
 * @api {delete} /book Request to delete book(s).
 * @apiName DeleteBookByISBN
 * @apiGroup Book
 *
 * @apiBody {String} [isbn] a book ISBN.
 *
 * @apiSuccess {Book} success an object showcasing the deleted book.
 *
 * @apiError (400: ISBN Parameter Invalid) {String} message "ISBN parameter is invalid. An ISBN should be a positive 13 digit number."
 * @apiError (404: Book not found) {String} message "No books found that meet the search criteria. Try again with a different search criteria."
 * @apiUse JWT
 * @apiUse SQL_ERR
 */
bookRouter.delete(
    '/isbn',
    checkToken,
    (request: Request, response: Response, next: NextFunction) => {
        if (request.query.isbn === undefined) {
            return response.status(400).send({
                message: "Missing 'isbn' query parameter.",
            });
        }
        if (
            !validationFunctions.isNumberProvided(request.query.isbn) ||
            !validationFunctions.validateISBN(
                request.query.isbn as unknown as number
            )
        ) {
            return response.status(400).send({
                message:
                    'ISBN not valid. ISBN should be a positive 13 or 10 digit number.',
            });
        }
        next();
    },
    async (request: Request, response: Response) => {
        const theQuery = getDeleteBookQuery('isbn13 = $1');
        const values = [request.query.isbn];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rows.length === 0) {
                    return response.status(404).send({
                        message:
                            'No books found that meet the search criteria. Try again with a different search criteria.',
                    });
                }
                response
                    .status(200)
                    .send(result.rows.map(convertBookInfoToIBookInfo));
            })
            .catch((error) => {
                console.error('DB Query error on DELETE /isbn');
                console.error(error);
                response.status(500).send({
                    message: SQL_ERR,
                });
            });
    });

export { bookRouter };