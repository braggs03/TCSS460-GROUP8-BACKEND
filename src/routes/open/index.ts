import express, { Router } from 'express';

import { bookRouter } from './book';

const openRoutes: Router = express.Router();

openRoutes.use('/book/', bookRouter)

export { openRoutes };
