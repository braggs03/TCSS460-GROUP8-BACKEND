import express, { Router } from 'express';
import { pool, validationFunctions, checkToken } from '../../core/utilities';

const bookRouter: Router = express.Router();

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

/**
 * /book?title=The%20Great%20Gatsby&rating=5
 * /book/title?title=The%20Great%20Gatsby and /book/rating?rate=5
 * 
 * 
SELECT * WHERE (
        title = title AND 
        rating > rate
    )

    //title
    "title = title"
    //rating
    "RATING > rate" 

*/
