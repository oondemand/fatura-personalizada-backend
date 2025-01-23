const express = require("express");
const assistenteController = require("../controllers/assistenteController");

const router = express.Router();

router.post("/", assistenteController.create);
router.get("/", assistenteController.readAll);
router.put("/:id", assistenteController.update);
router.get("/:id", assistenteController.readOne);
router.post("/:id", assistenteController.clone);
router.delete("/:id", assistenteController.delete);

module.exports = router;
