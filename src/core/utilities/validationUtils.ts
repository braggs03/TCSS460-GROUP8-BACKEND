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
    return (isbnStr.length == 13 || isbnStr.length == 10) && isbn > 0;
}

function validateYear(min: number, max: number): boolean {
    const isMinValid = min >= 1600 && min <= 3000;
    const isMaxValid = max >= 1600 && max <= 3000;
    const isRangeValid = min <= max;
    return isMinValid && isMaxValid && isRangeValid;
}


const validationFunctions = {
    isStringProvided,
    isNumberProvided,
    validateISBN,
    validateYear
};


export { validationFunctions };
