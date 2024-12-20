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
    const isPositive = (min && max) > 0;
    return isMinValid && isMaxValid && isRangeValid && isPositive;
}
function validatePostYear(year: number): boolean {
    const isPositive = year > 0;
    const isValidYear = year >= 1600;
    const isValidMax = year <= 3000;
    return isPositive && isValidYear && isValidMax;
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

// Add more/your own password validation here. The *rules* must be documented
// and the client-side validation should match these rules.
const isValidPassword = (password: string): boolean => {
    if (password.length < 15) {
        return false;
    }
    // eslint-disable-next-line no-useless-escape
    const testSpecial = /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;
    let sum = 0;
    let isNum = false;
    let hasSpecialChar = false;
    for (const char of password) {
        if (
            validationFunctions.isNumberProvided(parseInt(char)) &&
            !isNaN(parseInt(char))
        ) {
            sum = parseInt(char) + sum;
            isNum = true;
        } else if (testSpecial.test(char)) {
            hasSpecialChar = true;
        }
    }
    return isNum && hasSpecialChar && sum === 20;
};

// Add more/your own phone number validation here. The *rules* must be documented
// and the client-side validation should match these rules.
const isValidPhone = (phone: string) => {
    return phone
        .toLowerCase()
        .match(
            /^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/
        );
};

// Add more/your own role validation here. The *rules* must be documented
// and the client-side validation should match these rules.
const isValidRole = (priority: string): boolean =>
    validationFunctions.isNumberProvided(priority) &&
    parseInt(priority) >= 1 &&
    parseInt(priority) <= 5;

// Add more/your own email validation here. The *rules* must be documented
// and the client-side validation should match these rules.
const isValidEmail = (email: string) => {
    return email
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

const validationFunctions = {
    isStringProvided,
    isNumberProvided,
    validateISBN,
    validateRatings,
    validateYear,
    validatePagination,
    validateTitle,
    validatePostYear,
    isValidEmail,
    isValidPassword,
    isValidPhone,
    isValidRole,
};

export { validationFunctions };
