import express, { Router } from "express";

const bookRouter: Router = express.Router();

/**
 * @api {get} /book Request to get book(s) by title.
 * @apiName GetBookByTitle
 * @apiGroup Book
 *
 * @apiBody {String} [isbn] a book ISBN.
 * @apiBody {String} [title] a book title.
 * @apiBody {String} [author] a book author.
 * @apiBody {String} [rating_min=0] a book rating.
 * @apiBody {String} [rating_max=5] a book rating.
 * @apiBody {String} [year_min=1900] a book year.
 * @apiBody {String} [year_max=3000] a book year.
 *
 * @apiSuccess {Book} an object containing book information.
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * @apiError (400: Malformed Authorization Header) {String} message "Malformed Authorization Header"
 * @apiError (404: User Not Found) {String} message "User not found"
 * @apiError (400: Invalid Credentials) {String} message "Credentials did not match"
 *
 */
bookRouter.get("/", (request, response) => {
    response.send(request.query.title);
    //response.send("Hello, World!");

    
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