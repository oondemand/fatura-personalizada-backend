const express = require("express");
const router = express.Router();
const gatilhoController = require("../controllers/gatilhoController");

router.post("/", gatilhoController.createGatilho);
router.get("/", gatilhoController.getAllGatilhos);
router.get("/:id", gatilhoController.getGatilhoById);
router.put("/:id", gatilhoController.updateGatilho);
router.delete("/:id", gatilhoController.deleteGatilho);

module.exports = router;
