const express = require("express");
const DashboardController = require("../controllers/dashboard");
const router = express.Router();

router.get("/", DashboardController.caracteristicas);

module.exports = router;
