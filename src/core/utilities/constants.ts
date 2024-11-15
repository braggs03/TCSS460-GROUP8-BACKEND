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
 * @apiSuccess (200: API Success) {Object[]} entries An array of IBook objects.
 * @apiSuccess (200: API Success) {number} entries.IBook.book_isbn The ISBN of the given IBook object.
 * @apiSuccess (200: API Success) {string} entries.IBook.authors The common seperated list of the authors of the given IBook object.
 * @apiSuccess (200: API Success) {number} entries.IBook.publication The publication year of the given IBook object.
 * @apiSuccess (200: API Success) {string} entries.IBook.title The title of the given IBook object.
 * @apiSuccess (200: API Success) {Object} entries.IBook.ratings The ratings object of the given IBook object.
 * @apiSuccess (200: API Success) {number} entries.IBook.ratings.average The average rating of the given ratings object.
 * @apiSuccess (200: API Success) {number} entries.IBook.ratings.count The number of ratings of the given ratings object.
 * @apiSuccess (200: API Success) {number} entries.IBook.ratings.rating_1 The number of 1 star ratings of the given ratings object.
 * @apiSuccess (200: API Success) {number} entries.IBook.ratings.rating_2 The number of 2 star ratings of the given ratings object.
 * @apiSuccess (200: API Success) {number} entries.IBook.ratings.rating_3 The number of 3 star ratings of the given ratings object.
 * @apiSuccess (200: API Success) {number} entries.IBook.ratings.rating_4 The number of 4 star ratings of the given ratings object.
 * @apiSuccess (200: API Success) {number} entries.IBook.ratings.rating_5 The number of 5 star ratings of the given ratings object.
 * @apiSuccess (200: API Success) {Object} [entries.IBook.series_info] The title of the given IBook object.
 * @apiSuccess (200: API Success) {string} [entries.IBook.series_info.name] The name of the series of the given IBook object.
 * @apiSuccess (200: API Success) {number} [entries.IBook.series_info.position] The position/order of the given IBook in its series.
 */

/**
 * @apiDefine JWT
 * @apiError (401: Authorization Token is not supplied) {string} message "No JWT provided, please sign in."
 * @apiError (403: Invalid JWT) {string} message "Provided JWT is invalid. Please sign-in again."
 */

/**
 * @apiDefine SQL_ERR
 * @apiError (500: Server Error) {string} message "Server error. Please contact support."
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