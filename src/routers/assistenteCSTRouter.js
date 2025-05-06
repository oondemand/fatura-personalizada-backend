const express = require("express");
const assistenteController = require("../controllers/assistenteController");
const promptController = require("../controllers/promptController");

const authCstMiddleware = require("../middlewares/cst-auth");

const router = express.Router();

router.get("/", authCstMiddleware, assistenteController.readAllCST);
router.get("/prompts", authCstMiddleware, promptController.readAll);

module.exports = router;
