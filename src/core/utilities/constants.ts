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

// Documentation

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
 * @apiQuery {number} [limit=10] a minimum rating required for a book.
 * @apiQuery {number} [offset=0] a maximum rating required for a book.
 */

/**
 * @apiDefine Pagination_Output
 * @apiSuccess (200: API Success) {Object} pagination Contains metadata on pagination.
 * @apiSuccess (200: API Success) {number} pagination.totalRecords The total number of entries for the given query.
 * @apiSuccess (200: API Success) {number} pagination.limit The current limit applied.
 * @apiSuccess (200: API Success) {number} pagination.offset The applied offset for this query.
 * @apiSuccess (200: API Success) {number} pagination.nextPage The new computed offset to recieve the next limit # of books. Computed as limit + offset.
 */