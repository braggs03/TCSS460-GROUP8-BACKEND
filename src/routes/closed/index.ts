import express, { Router } from 'express';

import { checkToken } from '../../core/middleware';
import { tokenTestRouter } from './tokenTest';
import { bookRouter } from './book';
import { updateCredetialsRouter } from './updateCredentials';

const closedRoutes: Router = express.Router();

closedRoutes.use('/jwt_test', checkToken, tokenTestRouter);
closedRoutes.use('/book/', bookRouter);
closedRoutes.use('/credentials/', updateCredetialsRouter)

export { closedRoutes };
