import express, { Router } from "express";

const bookRouter: Router = express.Router();

bookRouter.get("/", (request, response) => {
    //request.params.title;
    response.send("Hello, World!");
});

export { bookRouter };