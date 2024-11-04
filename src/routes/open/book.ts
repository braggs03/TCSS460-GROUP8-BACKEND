import express, { NextFunction, Router, Request, Response } from 'express';
import { pool, validationFunctions } from '../../core/utilities';
import { LIMIT_DEFAULT, OFFSET_DEFAULT, RATING_MAX, RATING_MAX_DEFAULT, RATING_MIN, RATING_MIN_DEFAULT } from '../../core/utilities/constants';
import { AuthRequest } from '../auth/login';

const bookRouter: Router = express.Router();

const selectBookInfo = `
SELECT DISTINCT
    book_isbn, publication_year, title, series_name, series_position, rating_avg, rating_count, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url
FROM
    BOOK_MAP
    LEFT JOIN BOOKS ON BOOK_MAP.book_isbn = BOOKS.isbn13
    LEFT JOIN SERIES ON BOOK_MAP.series_id = SERIES.id`;

/**
 * @apiDefine BookInformation
 * @apiSuccess (200: Success) {Object} book the book object containing all information
 * @apiSuccess (200: Success) {String} book.book_isbn ISBN of the book.
 * @apiSuccess (200: Success) {Number} book.publication_year Year the book was published.
 * @apiSuccess (200: Success) {String} book.title Title of the book.
 * @apiSuccess (200: Success) {String} book.series_name Name of the series the book is a part of.
 * @apiSuccess (200: Success) {Number} book.series_position Position of the book in the series.
 * @apiSuccess (200: Success) {Number} book.rating_avg Average rating of the book.
 * @apiSuccess (200: Success) {Number} book.rating_count Number of ratings the book has received.
 * @apiSuccess (200: Success) {Number} book.rating_1_star Number of 1 star ratings the book has received.
 * @apiSuccess (200: Success) {Number} book.rating_2_star Number of 2 star ratings the book has received.
 * @apiSuccess (200: Success) {Number} book.rating_3_star Number of 3 star ratings the book has received.
 * @apiSuccess (200: Success) {Number} book.rating_4_star Number of 4 star ratings the book has received.
 * @apiSuccess (200: Success) {Number} book.rating_5_star Number of 5 star ratings the book has received.
 * @apiSuccess (200: Success) {String} book.image_url URL of the image of the book.
 * @apiSuccess (200: Success) {String} book.image_small_url URL of the small image of the book.
 * @apiSuccess (200: Success) {String[]} book.authors Array of authors of the book.
 */

/**
 * @api {get} /book/isbn Request to get a book by ISBN.
 * @apiName GetBookByISBN
 * @apiGroup Book
 *
 * @apiQuery {number} isbn a book ISBN to look up.
 *
 * @apiError (400: Missing ISBN) {String} message Missing 'isbn' query parameter.
 * @apiError (404: ISBN Not Found) {String} message Book with given ISBN not found.
 * @apiError (400: Bad ISBN) {String} message ISBN not valid. ISBN should be a positive 13 digit number.
 * @apiError (403: Invalid JWT) {String} message Provided JWT is invalid. Please sign-in again.
 * @apiError (401: Authorization Token is not supplied) {String} message No JWT provided, please sign in.
 * @apiUse BookInformation
 */
bookRouter.get('/isbn',
    (request: Request, response: Response, next: NextFunction) => {
        if(request.query.isbn === undefined) {
            return response.status(400).send({
                message: "Missing 'isbn' query paremeter."
            });
        }
        if (
            !validationFunctions.isNumberProvided(request.query.isbn) ||
            !validationFunctions.validateISBN(request.query.isbn as unknown as number)
        ) {
            return response.status(400).send({
                message: 'ISBN not valid. ISBN should be a positive 13 or 10 digit number.'
            }); 
        }
        return next();
    },
    async (request: Request, response: Response) => {
        const theQuery = selectBookInfo + ' WHERE book_isbn = $1 LIMIT 1;';
        let values = [request.query.isbn];

        let book = {}
        await pool.query(theQuery, values)
            .then((result) => {
                if(result.rows.length === 0) {
                    return response.status(404).send({
                        message: 'Book not found'
                    });
                }
                book = result.rows[0];
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on GET /isbn');
                console.error(error);
                return response.status(500).send({
                    message: 'server error - contact support',
                });
            });

        // if the response has already been sent, don't send it again
        if(response.headersSent) return;

        const theAuthorQuery = `SELECT author_name FROM
                                BOOK_MAP LEFT JOIN AUTHORS ON author_id = id
                                WHERE book_isbn=$1`
        pool.query(theAuthorQuery, values)
            .then((result) => {
                book['authors'] = result.rows.map((row: { author_name: string; }) => row.author_name);
                return response.send(book);
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on GET /isbn');
                console.error(error);
                return response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    });

/**
 * @api {get} /book/year Request to books with a given year.
 * @apiDescription You can request a range of books by year (e.g 2020-2022). If a user only wants to search by one year, enter the same number for both parameters (e.g: 2022-2022).
 * @apiName GetBookByYear
 * @apiGroup Book
 * @apiQuery {number} [year_min = 1600] a minimum year for the range
 * @apiQuery {number} max a maximum year for the range
 * @apiUse BookInformation
 * @apiError (400: Missing Year) {string} message 'year_max' query parameter is missing or not a number.
 * @apiError (400: Year Parameter Invalid) {String} message Year parameter is invalid. A year should be a number between 1600 and 3000. Additionally, the minimum year should be less than or equal to the maximum year.
 * @apiError (401: Authorization Token is not supplied) {string} message No JWT provided, please sign in.
 * @apiError (403: Invalid JWT) {string} message Provided JWT is invalid. Please sign-in again.
 * @apiError (404: Year not found) {string} message No books found for the given year range.
 */
bookRouter.get('/year', (request: Request, response: Response, next: NextFunction) => {
    //default min is 1600
    const yearMin = parseInt(request.query.year_min as string) || 1600;
    const yearMax = parseInt(request.query.year_max as string);

    if (isNaN(yearMax)) {
        return response.status(400).send({ message: "'year_max' query parameter is missing or not a number." });
    }
    
    if (!validationFunctions.validateYear(yearMin, yearMax)) {
        return response.status(400).send({
            message: 'Year parameter is invalid. A year should be a number between 1600 and 3000. Additionally, the minimum year should be less than or equal to the maximum year.',
        });
    }

    const theQuery = `SELECT b.isbn13 AS book_isbn,b.publication_year,b.title,s.series_name,bm.series_position,b.rating_avg,b.rating_count,b.rating_1_star,b.rating_2_star,
    b.rating_3_star,b.rating_4_star,b.rating_5_star,b.image_url,b.image_small_url,
    ARRAY_AGG(DISTINCT a.author_name) AS authors
    FROM
    BOOKS b
        LEFT JOIN BOOK_MAP bm ON b.isbn13 = bm.book_isbn
        LEFT JOIN SERIES s ON bm.series_id = s.id
        LEFT JOIN BOOK_MAP bm_author ON b.isbn13 = bm_author.book_isbn
        LEFT JOIN AUTHORS a ON bm_author.author_id = a.id
    WHERE
        b.publication_year BETWEEN $1 AND $2
    GROUP BY
        b.isbn13, s.series_name, bm.series_position;`;
    
    pool.query(theQuery, [yearMin, yearMax])
        .then((result) => {
            if (result.rows.length === 0) {
                return response.status(404).send({ message: 'No books found for the given year range.' });
            }
            response.send(result.rows );
        })
        .catch((error) => {
            console.error('DB Query error on GET by year');
            console.error(error);
            response.status(500).send({ message: 'server error - contact support' });
        });
});
  


/**
 * @api {get} /book/title Request a book by title.
 * @apiName GetBookByTitle
 * @apiGroup Book
 *
 * @apiQuery {string} title the book title to search
 *
 * @apiError (400: Missing Title) {String} message Title was not provided
 * @apiError (404: Title not found) {String} message Title was not found
 * @apiError (403: Invalid JWT) {String} message Provided JWT is invalid. Please sign-in again.
 * @apiError (401: Authorization Token is not supplied) {String} message No JWT provided, please sign in.
 * @apiUse BookInformation
 */
bookRouter.get('/title', (request, response) => {
    const titleQuery = request.query.title as string;
    if (!validationFunctions.validateTitle(titleQuery)) {
        return response.status(400).send({
            message: 'Title was not provided',
        });
    }
    const theQuery = `
    SELECT b.isbn13 AS book_isbn, b.publication_year, b.title, s.series_name,bm.series_position,b.rating_avg,b.rating_count,b.rating_1_star,b.rating_2_star,b.rating_3_star,
        b.rating_4_star,b.rating_5_star,b.image_url,b.image_small_url,
        ARRAY_AGG(DISTINCT a.author_name) AS authors
    FROM
        BOOKS b
    LEFT JOIN
        BOOK_MAP bm ON b.isbn13 = bm.book_isbn
    LEFT JOIN
        SERIES s ON bm.series_id = s.id
    LEFT JOIN
        BOOK_MAP bm_author ON b.isbn13 = bm_author.book_isbn
    LEFT JOIN
        AUTHORS a ON bm_author.author_id = a.id
    WHERE
        b.title ILIKE '%' || $1 || '%'  
    GROUP BY
        b.isbn13, s.series_name, bm.series_position;`;

    pool.query(theQuery,[titleQuery])
        .then((result) => {
            if (result.rows.length === 0) {
                return response.status(404).send({ message: 'Title was not found' });
            }
            response.send(result.rows);
        })
        .catch((error) => {
            console.error('DB Query error on GET by title');
            console.error(error);
            response.status(500).send({ message: 'server error - contact support' });
        });
});

/**
 * @api {get} /book/rating Request to books within a given range of ratings. 
 * @apiDescription If book(s) from a point and up are desired, only set rating_min. If book(s) from a point and below are desired, only set rating_max. Both can be suppiled to get the book(s) within that range inclusively. 
 * If a specific rating is required, set rating_min and rating_max to the same value. If no ratings are provided, default values of 1 and 5 are used for the min and max, respectfully.
 * @apiName GetBookByRating
 * @apiGroup Book
 *
 * @apiBody {number} [rating_min=1] a minimum rating required for a book. 
 * @apiBody {number} [rating_max=5] a maximum rating required for a book.
 * @apiBody {number} [limit=10] a minimum rating required for a book. 
 * @apiBody {number} [offset=0] a maximum rating required for a book.
 * 
 * @apiSuccess {Book(s)} success object containing information of books within the range of ratings.
 * @apiError (400: Missing max and min rating) {String} message "Missing max and min rating, atleast one of which should be supplied.""
 * @apiError (400: Bad maximum or minimum rating) {String} message "Min or Max is not a valid rating, should be a floating point from 1 to 5 with no crossover i.e rating_min <= rating_max."
 * @apiError (403: Invalid JWT) {String} message "Provided JWT is invalid. Please sign-in again."
 * @apiError (401: Authorization Token is not supplied) {String} message "No JWT provided, please sign in."
 */
bookRouter.get('/rating', 
    (request: Request, response: Response, next: NextFunction) => {
        validationFunctions.validatePagination(request);
        if (request.query.rating_min === undefined && request.query.rating_max === undefined) {
            response.status(400).send({
                message: "Missing maximum and minimum rating."
            });
        } else {
            const ratingMin: number = request.query.rating_min !== undefined ? +request.query.rating_min : RATING_MIN_DEFAULT;
            const ratingMax: number = request.query.rating_max !== undefined ? +request.query.rating_max : RATING_MAX_DEFAULT;
            if (validationFunctions.isNumberProvided(ratingMin) && validationFunctions.isNumberProvided(ratingMax) && validationFunctions.validateRatings(+ratingMin, +ratingMax)) {
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
    (request: Request, response: Response) => {
        const query = selectBookInfo + ' WHERE rating_avg >= $1 AND rating_avg <= $2 ORDER BY rating_avg DESC LIMIT $3 OFFSET $4'
        const values = [
            request.query.rating_min, 
            request.query.rating_max,
            request.query.limit,
            request.query.offset
        ];

        pool.query(query, values)
            .then((result) => {
                response.send(result.rows);
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on GET /ratings');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

/**
 * @api {get} /book/series Request to get all series names
 * 
 * @apiName GetSeriesNames
 * @apiGroup Book
 * 
 * @apiSuccess {String[]} success an array of series names.
 * @apiError (403: Invalid JWT) {String} message "Provided JWT is invalid. Please sign-in again."
 * @apiError (401: Authorization Token is not supplied) {String} message "No JWT provided, please sign in."
 * @apiError (500: SQL Error) {String} message "SQL Error. Call 911."
 */
bookRouter.get('/series', (request, response) => {});

/**
 * @api {get} /book/series/:series Request to get all books in a series.
 * 
 * @apiName GetBooksInSeries
 * @apiGroup Book
 * 
 * @apiParam {string} series a series name.
 * 
 * @apiSuccess {Book[]} books an array of objects containing book information.
 * @apiError (403: Invalid JWT) {String} message "Provided JWT is invalid. Please sign-in again."
 * @apiError (401: Authorization Token is not supplied) {String} message "No JWT provided, please sign in."
 * @apiError (500: SQL Error) {String} message "SQL Error. Call 911."
 */
bookRouter.get('/series/:series', (request, response) => {});

/**
 * @api {get} /book/:author Request to a get a book by author.
 * @apiName GetBookByAuthor
 * @apiGroup Book
 * 
 * @apiParam {string} author name of author to look up
 * 
 * @apiError (400: Missing Author) {string} message 'author' query parameter is missing.
 * @apiError (401: Authorization Token is not supplied) {string} message No JWT provided, please sign in.
 * @apiError (403: Invalid JWT) {string} message Provided JWT is invalid. Please sign-in again.
 * @apiError (404: Author not found) {string} message Author was not found.
 * @apiUse BookInformation
 */
bookRouter.get('/:author', (request: Request, response: Response, next: NextFunction) => {
    const theQuery = 'SELECT book_isbn, author_id, series_id, series_position FROM BOOK_MAP'; //only temp
    let values = [request.params.author];

    pool.query(theQuery)
        .then((result) => {
            response.send({
                books: result.rows,
            });
        })
        .catch((error) => {
            //log the error
            console.error('DB Query error on GET /:author');
            console.error(error);
            response.status(500).send({
                message: 'server error - contact support',
            });
        });
    });

/**
 * @api {get} /book Request to get book(s).
 * @apiName GetBookByAttributes
 * @apiGroup Book
 *
 * @apiBody {String} [isbn] a book ISBN.
 * @apiBody {String} [title] a book title.
 * @apiBody {String} [author] a book author.
 * @apiBody {String} [rating_min=0] a book rating.
 * @apiBody {String} [rating_max=5] a book rating.
 * @apiBody {String} [year_min=1600] a book year.
 * @apiBody {String} [year_max=3000] a book year.
 *
 *
 * @apiError (403: Invalid JWT) {String} message "Provided JWT is invalid. Please sign-in again."
 * @apiError (401: Authorization Token is not supplied) {String} message "No JWT provided, please sign in."
 * @apiError (400: ISBN Parameter Invalid) {String} message "ISBN parameter is invalid. An ISBN should be a positive 13 digit number."
 * @apiError (400: Title Parameter Invalid) {String} message "Title parameter is invalid. A title should be a non-empty string."
 * @apiError (400: Author Parameter Invalid) {String} message "Author parameter is invalid. An author should be a non-empty string."
 * @apiError (400: Rating Parameter Invalid) {String} message "Rating parameter is invalid. A rating should be a number between 0 and 5. Additionally, the minimum rating should be less than or equal to the maximum rating."
 * @apiError (400: Year Parameter Invalid) {String} message "Year parameter is invalid. A year should be a number between 1600 and 3000. Additionally, the minimum year should be less than or equal to the maximum year."
 * @apiError (404: Book not found) {String} message "No books found that meet the search criteria. Try again with a different search criteria."
 *
 */

/**
 * @api {get} /book Request to get all book(s).
 * @apiName GetAllBooks
 * @apiGroup Book
 * @apiQuery {number} [limit=10] limit a limit value. 
 * @apiQuery {number} [offset=0] offset a offset value.
 * @apiUse BookInformation
 *
 * @apiError (400: Malformed Authorization Header) {String} message "Malformed Authorization Header"
 * @apiError (404: User Not Found) {String} message "User not found"
 * @apiError (400: Invalid Credentials) {String} message "Credentials did not match"
 * @apiError (500: SQL Error) {String} message "SQL Error. Call 911."
 */
bookRouter.get('/', (request: Request, response: Response, next: NextFunction) => {
    validationFunctions.validatePagination(request);

    const limit: number = request.query.limit ? +request.query.limit : LIMIT_DEFAULT;
    const offset: number = request.query.offset ? +request.query.offset : OFFSET_DEFAULT;

    const theQuery = `
        SELECT b.isbn13 AS book_isbn, b.publication_year, b.title, s.series_name, bm.series_position, b.rating_avg, b.rating_count,
               b.rating_1_star, b.rating_2_star, b.rating_3_star, b.rating_4_star, b.rating_5_star,
               b.image_url, b.image_small_url, ARRAY_AGG(DISTINCT a.author_name) AS authors
        FROM BOOKS b
            LEFT JOIN BOOK_MAP bm ON b.isbn13 = bm.book_isbn
            LEFT JOIN SERIES s ON bm.series_id = s.id
            LEFT JOIN BOOK_MAP bm_author ON b.isbn13 = bm_author.book_isbn
            LEFT JOIN AUTHORS a ON bm_author.author_id = a.id
        GROUP BY b.isbn13, s.series_name, bm.series_position
        ORDER BY b.title ASC
        LIMIT $1 OFFSET $2;`;

    const values = [limit, offset];

    pool.query(theQuery, values)
        .then((result) => {
            response.send(
                result.rows,
            );
        })
        .catch((error) => {
            console.error('DB Query error on GET all');
            console.error(error);
            response.status(500).send({
                message: 'Server error - contact support',
            });
        });
});

/**
 * @api {delete} /book Request to delete book(s).
 * @apiName DeleteBookByAttributes
 * @apiGroup Book
 *
 * @apiBody {String} [isbn] a book ISBN.
 * @apiBody {String} [title] a book title.
 * @apiBody {String} [author] a book author.
 * @apiBody {String} [rating_min=0] a book rating.
 * @apiBody {String} [rating_max=5] a book rating.
 * @apiBody {String} [year_min=1600] a book year.
 * @apiBody {String} [year_max=3000] a book year.
 *
 * @apiSuccess {Book} success an object showcasing the deleted book.
 *
 * @apiError (400: Malformed Authorization Header) {String} message "Malformed Authorization Header"
 * @apiError (404: User Not Found) {String} message "User not found"
 * @apiError (400: Invalid Credentials) {String} message "Credentials did not match"
 * @apiError (400: ISBN Parameter Invalid) {String} message "ISBN parameter is invalid. An ISBN should be a positive 13 digit number."
 * @apiError (400: Title Parameter Invalid) {String} message "Title parameter is invalid. A title should be a non-empty string."
 * @apiError (400: Author Parameter Invalid) {String} message "Author parameter is invalid. An author should be a non-empty string."
 * @apiError (400: Rating Parameter Invalid) {String} message "Rating parameter is invalid. A rating should be a number between 0 and 5. Additionally, the minimum rating should be less than or equal to the maximum rating."
 * @apiError (400: Year Parameter Invalid) {String} message "Year parameter is invalid. A year should be a number between 1600 and 3000. Additionally, the minimum year should be less than or equal to the maximum year."
 * @apiError (404: Book not found) {String} message "No books found that meet the search criteria. Try again with a different search criteria."
 *
 */
bookRouter.delete('/', (request, response) => {
    response.send('Hello, World!');
});

/**
 * @api {put} /book Request to change a book by rating
 *
 * @apiDescription Request to change a book's rating (by adding/changing stars).
 *
 * @apiName PutBook
 * @apiGroup Book
 *
 * @apiBody {number} isbn the isbn of the book that needs to be changed
 * @apiBody {rating} rating the new rating to be changed
 *
 * @apiSuccess {String} success the rating was successfully changed
 *
 * @apiError (403: Invalid JWT) {String} message "Provided JWT is invalid. Please sign-in again."
 * @apiError (401: Authorization Token is not supplied) {String} message "No JWT provided, please sign in."
 * @apiError (404: Book Not Found) {String} message Book not found
 * @apiError (400: Missing Parameters) {String} message Parameters were not added correctly, try again.
 */
bookRouter.put('/',(request, response) => {

});

/**
 * @api {post} /book Request to add an entry.
 *
 * @apiDescription Request to add a book into the database.
 *
 * @apiName PostBook
 * @apiGroup Book
 *
 * @apiBody {string} isbn the isbn of the book that needs to be added
 * @apiBody {number} publication_year the year of the book that needs to be added
 * @apiBody {string} title the title of the book that needs to be added
 * @apiBody {string} series_name the series of the book that needs to be added
 * @apiBody {number} series_pos the series number of the book that needs to be added
 * @apiBody {number} rating_avg the average rating of the book that needs to be added
 * @apiBody {number} rating_1 the number of 1 stars of the book that needs to be added
 * @apiBody {number} rating_2 the number of 2 stars of the book that needs to be added
 * @apiBody {number} rating_3 the number of 3 stars of the book that needs to be added
 * @apiBody {number} rating_4 the number of 4 stars of the book that needs to be added
 * @apiBody {number} rating_5 the number of 5 stars of the book that needs to be added
 * @apiBody {string} image_url the url of the book that needs to be added
 * @apiBody {string} small_url the small image 
 *
 * @apiSuccess {String} success the book was added
 * 
 * @apiError (403: Invalid JWT) {String} message "Provided JWT is invalid. Please sign-in again."
 * @apiError (401: Authorization Token is not supplied) {String} message "No JWT provided, please sign in."
 * @apiError (400: Missing Parameters) {String} message Parameters were not added correctly, try again.
 */
bookRouter.post('/',(request, response) => {

});

export { bookRouter };