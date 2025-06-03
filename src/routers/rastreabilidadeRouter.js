const express = require("express");
const logController = require("../controllers/logController");
const documentoTrackingController = require("../controllers/documentoTrackingController");
const router = express.Router();

// Rota para buscar os logs de rastreabilidade
router.get("/logs", logController.getLogs);
router.get("/documentos", documentoTrackingController.listDocumentoTracking);
router.delete("/logs/limpar", logController.limparLogs);

module.exports = router;
