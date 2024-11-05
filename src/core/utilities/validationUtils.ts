import { Request } from 'express';
import {
    RATING_MAX,
    RATING_MIN,
    LIMIT_DEFAULT,
    OFFSET_DEFAULT,
} from './constants';

/**
 * Checks the parameter to see if it is a a String.
 *
 * @param {any} candidate the value to check
 * @returns true if the parameter is a String0, false otherwise
 */
function isString(candidate: any): candidate is string {
    return typeof candidate === 'string';
}

/**
 * Checks the parameter to see if it is a a String with a length greater than 0.
 *
 * @param {any} candidate the value to check
 * @returns true if the parameter is a String with a length greater than 0, false otherwise
 */
function isStringProvided(candidate: any): boolean {
    return isString(candidate) && candidate.length > 0;
}

/**
 * Checks the parameter to see if it can be converted into a number.
 *
 * @param {any} candidate the value to check
 * @returns true if the parameter is a number, false otherwise
 */
function isNumberProvided(candidate: any): boolean {
    return (
        isNumber(candidate) ||
        (candidate != null &&
            candidate != '' &&
            !isNaN(Number(candidate.toString())))
    );
}

/**
 * Helper
 * @param x data value to check the type of
 * @returns true if the type of x is a number, false otherise
 */
function isNumber(x: any): x is number {
    return typeof x === 'number';
}

// Feel free to add your own validations functions!
// for example: isNumericProvided, isValidPassword, isValidEmail, etc
// don't forget to export any

function validateISBN(isbn: number): boolean {
    const isbnStr = isbn.toString();
    return isbnStr.length == 13 && isbn > 0;
}

function validateRatings(rating_min: number, rating_max: number) {
    return (
        rating_min >= RATING_MIN &&
        rating_min <= RATING_MAX &&
        rating_max >= RATING_MIN &&
        rating_max <= RATING_MAX &&
        rating_min <= rating_max
    );
}

function validateYear(min: number, max: number): boolean {
    const isMinValid = min >= 1600 && min <= 3000;
    const isMaxValid = max >= 1600 && max <= 3000;
    const isRangeValid = min <= max;
    return isMinValid && isMaxValid && isRangeValid;
}

function validatePagination(request: Request) {
    request.query.limit =
        isNumberProvided(request.query.limit) && +request.query.limit > 0
            ? request.query.limit
            : LIMIT_DEFAULT.toString();
    request.query.offset =
        isNumberProvided(request.query.offset) && +request.query.offset >= 0
            ? request.query.offset
            : OFFSET_DEFAULT.toString();
}

function validateTitle(title: string): boolean {
    return title.trim().length > 0;
}

const validationFunctions = {
    isStringProvided,
    isNumberProvided,
    validateISBN,
    validateRatings,
    validateYear,
    validatePagination,
    validateTitle,
};

export { validationFunctions };
