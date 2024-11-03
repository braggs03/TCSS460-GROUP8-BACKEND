"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openRoutes = void 0;
const express_1 = __importDefault(require("express"));
const message_1 = require("./message");
const book_1 = require("./book");
const openRoutes = express_1.default.Router();
exports.openRoutes = openRoutes;
openRoutes.use('/message', message_1.messageRouter);
openRoutes.use('/book/', book_1.bookRouter);
//# sourceMappingURL=index.js.map