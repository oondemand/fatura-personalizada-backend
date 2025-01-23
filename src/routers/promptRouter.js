const express = require("express");
const promptController = require("../controllers/promptController");

const router = express.Router();

router.post("/", promptController.create);
router.get("/", promptController.readAll);
router.put("/:id", promptController.update);
router.get("/:id", promptController.readOne);
router.delete("/:id", promptController.delete);

module.exports = router;
