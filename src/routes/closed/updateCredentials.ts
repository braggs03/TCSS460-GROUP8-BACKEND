// express is the framework we're going to use to handle requests
import express, { NextFunction, Request, Response, Router } from 'express';
import { checkToken } from '../../core/middleware';
import { pool, validationFunctions } from '../../core/utilities';
import { credentialingFunctions } from '../../core/utilities';
import { SQL_ERR } from '../../core/utilities/constants';

const isValidEmail = validationFunctions.isValidEmail;
const isValidPassword = validationFunctions.isValidPassword;
const generateHash = credentialingFunctions.generateHash;
const generateSalt = credentialingFunctions.generateSalt;

// retrieve the router object from express
const updateCredetialsRouter: Router = express.Router();

/**
 * @api {post} /credentials/changePassword Request to change the current users password.
 * @apiName Change Password
 * @apiGroup Change Credentials
 * @apiDescription Request to change the current users password. Must include current user email, current password, and new password. The new password must conform the required password requirements. See 'Request to register a user' for more information.
 *
 * @apiBody {string} email The current email of the user.
 * @apiBody {string} oldPassword The current password of the user.
 * @apiBody {string} newPassword The password the user wishes to change to.
 *
 * @apiSuccess (200: Update Password Success) {string} Password Updated Successfully.
 *
 * @apiError (400: Missing or Invalid Email) {string} message Invalid or missing email - please refer to documentation.
 * @apiError (400: Missing or Invalid Old Password) {string} message Invalid or missing old password - please refer to documentation.
 * @apiError (400: Missing or Invalid New Password) {string} message Invalid or missing new password - please refer to documentation.
 * @apiError (400: Email Does Not Exist) {String} message Email does not exist.
 * @apiError (400: Provided Password Does Not Match Current Password) {String} message Provided password does not match existing password.
 * @apiUse JWT
 * @apiUse SQL_ERR
 */
updateCredetialsRouter.post(
    '/changePassword',
    checkToken,
    (request: Request, response: Response, next: NextFunction) => {
        if (isValidEmail(request.body.email)) {
            next();
        } else {
            response.status(400).send({
                message:
                    'Invalid or missing email - please refer to documentation.',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        if (isValidPassword(request.body.oldPassword)) {
            next();
        } else {
            response.status(400).send({
                message:
                    'Invalid or missing old password - please refer to documentation.',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        if (isValidPassword(request.body.newPassword)) {
            next();
        } else {
            response.status(400).send({
                message:
                    'Invalid or missing new password - please refer to documentation.',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        const theQuery =
            'SELECT Account_Credential.Account_ID, Salted_Hash, salt FROM Account, Account_Credential WHERE Account.Account_ID = Account_Credential.Account_ID AND Email = $1';
        const values = [request.body.email];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rows.length === 1) {
                    const user = result.rows[0];
                    const salt: string = user.salt;
                    const oldSaltedHash: string = generateHash(
                        request.body.oldPassword,
                        salt
                    );
                    const userSaltedHash: string = user.salted_hash;
                    if (oldSaltedHash === userSaltedHash) {
                        request.body.account_id = user.account_id;
                        request.body.newSalt = generateSalt(32);
                        request.body.newSaltedHash = generateHash(
                            request.body.newPassword,
                            request.body.newSalt
                        );
                        next();
                    } else {
                        response.status(400).send({
                            message:
                                'Provided password does not match existing password.',
                        });
                    }
                } else {
                    response.status(400).send({
                        message: 'Email does not exist.',
                    });
                }
            })
            .catch((error) => {
                console.error('DB Query error on POST change password');
                console.error(error);
                response.status(500).send({
                    message: SQL_ERR,
                });
            });
    },
    (request: Request, response: Response) => {
        const theQuery =
            'UPDATE Account_Credential SET Salted_Hash = $2, salt = $3 WHERE Account_ID = $1';
        const values = [
            request.body.account_id,
            request.body.newSaltedHash,
            request.body.newSalt,
        ];

        pool.query(theQuery, values)
            .then(() => {
                response.status(200).send({
                    message: 'Password Updated Successfully',
                });
            })
            .catch((error) => {
                console.error('DB Query error on POST change password');
                console.error(error);
                response.status(500).send({
                    message: SQL_ERR,
                });
            });
    }
);

export { updateCredetialsRouter };
