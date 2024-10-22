import express, { Router } from 'express';

import { messageRouter } from './message';
import { bookRouter } from './book';

const openRoutes: Router = express.Router();

openRoutes.use('/message', messageRouter);
openRoutes.use('/book/', bookRouter)

export { openRoutes };
