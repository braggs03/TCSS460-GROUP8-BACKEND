"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookRouter = void 0;
const express_1 = __importDefault(require("express"));
const utilities_1 = require("../../core/utilities");
const bookRouter = express_1.default.Router();
exports.bookRouter = bookRouter;
const selectBookInfo = `
SELECT
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
 * @api {get} /book/isbn Request to get a book by ISBN.
 * @apiName GetBookByISBN
 * @apiGroup Book
 *
 * @apiQuery {number} isbn a book ISBN to look up.
 *
 * @apiError (400: Missing ISBN) {String} message Missing 'isbn' query paremeter.
 * @apiError (404: ISBN Not Found) {String} message Book with given ISBN not found.
 * @apiError (400: Bad ISBN) {String} message ISBN not valid. ISBN should be a positive 13 digit number.
 * @apiError (403: Invalid JWT) {String} message Provided JWT is invalid. Please sign-in again.
 * @apiError (401: Authorization Token is not supplied) {String} message No JWT provided, please sign in.
 * @apiUse BookInformation
 */
bookRouter.get('/isbn', (request, response, next) => {
    if (request.query.isbn === undefined) {
        return response.status(400).send({
            message: "Missing 'isbn' query paremeter."
        });
    }
    if (!utilities_1.validationFunctions.isNumberProvided(request.query.isbn) ||
        !utilities_1.validationFunctions.validateISBN(request.query.isbn)) {
        return response.status(400).send({
            message: 'ISBN not valid. ISBN should be a positive 13 or 10 digit number.'
        });
    }
    return next();
}, (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const theQuery = selectBookInfo + ' WHERE book_isbn = $1 LIMIT 1;';
    let values = [request.query.isbn];
    let book = {};
    yield utilities_1.pool.query(theQuery, values)
        .then((result) => {
        if (result.rows.length === 0) {
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
    if (response.headersSent)
        return;
    const theAuthorQuery = `SELECT author_name FROM
                                BOOK_MAP LEFT JOIN AUTHORS ON author_id = id
                                WHERE book_isbn=$1`;
    utilities_1.pool.query(theAuthorQuery, values)
        .then((result) => {
        book['authors'] = result.rows.map((row) => row.author_name);
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
}));
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
bookRouter.get('/:author', (request, response) => {
    const theQuery = 'SELECT all FROM Demo WHERE author = $1';
    let values = [request.params.author];
    utilities_1.pool.query(theQuery, values)
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
 * @api {get} /book/year Request to books with a given year.
 * @apiDescription You can request a range of books by year (e.g 2020-2022). If a user only wants to search by one year, enter the same number for both parameters (e.g: 2022-2022).
 * @apiName GetBookByYear
 * @apiGroup Book*
 * @apiBody {number} [year_min = 0] a minimum year for the range
 * @apiBody {number} max a maximum year for the range*
 * @apiSuccess {Book(s)} an object containing information of books within a given range.*
 * @apiError (400: Missing Year) {string} message 'year' query parameter is missing.
 * @apiError (400: Year Parameter Invalid) {String} message Year parameter is invalid. A year should be a number between 1600 and 3000. Additionally, the minimum year should be less than or equal to the maximum year.
 * @apiError (401: Authorization Token is not supplied) {string} message No JWT provided, please sign in.
 * @apiError (403: Invalid JWT) {string} message Provided JWT is invalid. Please sign-in again.
 * @apiError (404: Author not found) {string} message Author was not found.**/
bookRouter.get('/year', (request, response) => { });
/**
 * @api {get} /book/title Request a book by title.
 * @apiName GetBookByTitle
 * @apiGroup Book
 *
 * @apiQuery {string} title the book title to search
 *
 * @apiError (400: Missing Title) {String} message "Title was not provided"
 * @apiError (404: Title not found) {String} message "Title was not found"
 * @apiError (403: Invalid JWT) {String} message "Provided JWT is invalid. Please sign-in again."
 * @apiError (401: Authorization Token is not supplied) {String} message "No JWT provided, please sign in."
 * @apiUse BookInformation
 */
bookRouter.get('/title', (request, response) => {
    response.send('Hello, World!');
});
/**
 * @api {get} /book/rating Request to books within a given range.
 * @apiDescription If book(s) from a point and up are desired, only set rating_min. If book(s) from a point and below are desired, only set rating_max. Both can be suppiled to get the book(s) within that range inclusively. If a specific rating is required, set rating_min and rating_max to the same value.
 * @apiName GetBookByRating
 * @apiGroup Book
 *
 * @apiBody {number} [rating_min=1] a minimum rating required for a book.
 * @apiBody {number} [rating_max=5] a maximum rating required for a book.
 *
 * @apiSuccess {Book(s)} an object containing information of books within the range of ratings.
 *
 * @apiError (400: Missing max and min rating) {String} message "Missing max and min rating, atleast one of which should be supplied"
 * @apiError (400: Bad Min Rating) {String} message "Min rating is not a valid rating, should be a floating point from 1 to 5."
 * @apiError (400: Bad Max Rating) {String} message "Max rating is not a valid rating, should be a floating point from 1 to 5."
 * @apiError (400: Min Rating Greater Than Max Rating) {String} message "The provided minimum rating is greater than the maximum rating."
 * @apiError (403: Invalid JWT) {String} message "Provided JWT is invalid. Please sign-in again."
 * @apiError (401: Authorization Token is not supplied) {String} message "No JWT provided, please sign in."
 */
bookRouter.get('/rating', (request, response) => {
});
/**
 * @api {get} /book/isbn Request to get a book by ISBN.
 * @apiName GetBookByISBN
 * @apiGroup Book
 *
 * @apiBody {number} isbn a book ISBN.
 *
 * @apiSuccess {Book} an object containing book information.
 * What if no books are found?
 * @apiError (400: Missing ISBN) {String} message "Missing 'isbn' query paremeter."
 * @apiError (400: Bad ISBN) {String} message "ISBN not valid. ISBN should be a positive 13 digit number."
 * @apiError (403: Invalid JWT) {String} message "Provided JWT is invalid. Please sign-in again."
 * @apiError (401: Authorization Token is not supplied) {String} message "No JWT provided, please sign in."
 *
 */
/**
 * @api {get} /book/series Request to get all series names
 *
 * @apiName GetSeriesNames
 * @apiGroup Book
 *
 * @apiSuccess {String[]} an array of series names.
 * @apiError (403: Invalid JWT) {String} message "Provided JWT is invalid. Please sign-in again."
 * @apiError (401: Authorization Token is not supplied) {String} message "No JWT provided, please sign in."
 * @apiError (500: SQL Error) {String} message "SQL Error. Call 911."
 */
bookRouter.get('/series', (request, response) => { });
/**
 * @api {get} /book/series/:series Request to get all books in a series.
 *
 * @apiName GetBooksInSeries
 * @apiGroup Book
 *
 * @apiParam {String} series a series name.
 *
 * @apiSuccess {Book[]} books an array of objects containing book information.
 * @apiError (403: Invalid JWT) {String} message "Provided JWT is invalid. Please sign-in again."
 * @apiError (401: Authorization Token is not supplied) {String} message "No JWT provided, please sign in."
 * @apiError (500: SQL Error) {String} message "SQL Error. Call 911."
 */
bookRouter.get('/series/:series', (request, response) => { });
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
//# sourceMappingURL=book.js.map