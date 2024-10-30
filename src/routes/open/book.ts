import express, { NextFunction, Router, Request, Response } from 'express';
import { pool, validationFunctions } from '../../core/utilities';
import { AuthRequest } from '../auth/login';

const bookRouter: Router = express.Router();

const selectBookInfo = `
SELECT
    book_isbn, publication_year, title, series_name, series_position, rating_avg, rating_count, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url
FROM
    BOOK_MAP
    LEFT JOIN BOOKS ON BOOK_MAP.book_isbn = BOOKS.isbn13
    LEFT JOIN SERIES ON BOOK_MAP.series_id = SERIES.id`;

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
 * @apiSuccess {Book} an object containing book information.
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
 *
 * @apiSuccess {Book[]} an array of objects containing book information.
 *
 * @apiError (400: Malformed Authorization Header) {String} message "Malformed Authorization Header"
 * @apiError (404: User Not Found) {String} message "User not found"
 * @apiError (400: Invalid Credentials) {String} message "Credentials did not match"
 * @apiError (500: SQL Error) {String} message "SQL Error. Call 911."
 */
bookRouter.get('/', (request, response) => {
    response.send(request.query.title);
    //response.send("Hello, World!");
});

/**
 * @api {get} /book/isbn Request to a book by ISBN.
 * @apiName GetBookByISBN
 * @apiGroup Book
 *
 * @apiBody {number} isbn a book ISBN.
 *
 * @apiSuccess {Book} an object containing book information.
 * What if no books are found?
 * @apiError (400: Missing ISBN) {String} message "Missing 'isbn' query paremeter."
 * @apiError (400: Bad ISBN) {String} message "ISBN not valid. ISBN should be a 13 or 10 digit number."
 * @apiError (403: Invalid JWT) {String} message "Provided JWT is invalid. Please sign-in again."
 * @apiError (401: Authorization Token is not supplied) {String} message "No JWT provided, please sign in."
 *
 */

bookRouter.get('/isbn',
    (request: Request, response: Response, next: NextFunction) => {
        if(request.query.isbn === undefined) {
            return response.status(400).send({
                message: "Missing 'isbn' query paremeter."
            });
        }
        if (
            validationFunctions.isNumberProvided(request.query.isbn) &&
            validationFunctions.validateISBN(request.query.isbn as unknown as number)
        ) {
            return next();
        } else {
            return response.status(400).send({
                message: 'ISBN not valid. ISBN should be a 13 or 10 digit number.'
            });
        }
    },
    (request: Request, response: Response) => {
    const theQuery = selectBookInfo + ' WHERE book_isbn = $1 LIMIT 1;';
    let values = [request.query.isbn];

    pool.query(theQuery, values)
        .then((result) => {
            return response.send(result.rows[0]);
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
 * @api {get} /book/author Request to a book by author.
 * @apiName GetBookByAuthor
 * @apiGroup Book
 *
 * @apiBody {} author a book author.
 *
 * @apiSuccess {Author} an object containing books related to the given Author.
 *
 * @apiError (400: Missing Author) {String} message "Author name was not provided"
 * @apiError (404: Author not found) {String} message "Author was not found"
 * @apiError (403: Invalid JWT) {String} message "Provided JWT is invalid. Please sign-in again."
 * @apiError (401: Authorization Token is not supplied) {String} message "No JWT provided, please sign in."
 */
bookRouter.get('/:author', (request, response) => {
    const theQuery = 'SELECT all FROM Demo WHERE author = $1';
    let values = [request.params.author];

    pool.query(theQuery, values)
        .then((result) => {
            response.send(result.rows);
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
 * @api {get} /book/title Request to books withing given range.
 * @apiName GetBookByRating
 * @apiGroup Book
 *
 * @apiBody {number} [rating_min=0] a book rating.
 * @apiBody {number} [rating_max=5] a book rating.
 *
 * @apiSuccess {Book(s)} an object containing information of books within range of ratings.
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * @apiError (403: Invalid JWT) {String} message "Provided JWT is invalid. Please sign-in again."
 * @apiError (401: Authorization Token is not supplied) {String} message "No JWT provided, please sign in."
 *
 */
bookRouter.get('/rating', (request, response) => {});

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
 * @apiSuccess {Book} an object containing book information.
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

export { bookRouter };

