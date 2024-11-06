// RATING

const RATING_MAX: number = 5;
const RATING_MIN: number = 1;
const RATING_MAX_DEFAULT: number = 5;
const RATING_MIN_DEFAULT: number = 1;

// PAGINATION

const LIMIT_DEFAULT: number = 10;
const OFFSET_DEFAULT: number = 0;

// Response Messages

const SQL_ERR: string = 'Server error. Please contact support.'

export { RATING_MAX, RATING_MIN, RATING_MAX_DEFAULT, RATING_MIN_DEFAULT, LIMIT_DEFAULT, OFFSET_DEFAULT, SQL_ERR }

/**
 * @apiDefine IBook
 * @apiSuccess (200: API Success) {IBook[]} entries An array of IBook objects. View documentation for object fields.
 */

/**
 * @apiDefine JWT
 * @apiError (401: Authorization Token is not supplied) {string} message No JWT provided, please sign in.
 * @apiError (403: Invalid JWT) {string} message Provided JWT is invalid. Please sign-in again.
 */

/**
 * @apiDefine SQL_ERR
 * @apiError (500: Server Error) {string} message Server error. Please contact support.
 */

/**
 * @apiDefine Pagination_Input
 * @apiBody {number} [limit=10] a minimum rating required for a book.
 * @apiBody {number} [offset=0] a maximum rating required for a book.
 */

/**
 * @apiDefine Pagination_Output
 * @apiSuccess (200: API Success) {Object} pagination Contains metadata on pagination.
 * @apiSuccess (200: API Success) {number} pagination.totalRecords The total number of entries for the given query.
 * @apiSuccess (200: API Success) {number} pagination.limit The current limit applied.
 * @apiSuccess (200: API Success) {number} pagination.offset The applied offset for this query.
 * @apiSuccess (200: API Success) {number} pagination.nextPage The new computed offset to recieve the next limit # of books. Computed as limit + offset.
 */

// UNUSED 

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