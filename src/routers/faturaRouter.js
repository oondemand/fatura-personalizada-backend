const express = require("express");
const FaturaController = require("../controllers/faturaController");

const router = express.Router();

// Rotas para Fatura
router.post("/", FaturaController.gerarPreview);
router.post("/download-pdf", FaturaController.downloadPdf);

router.post("/listar-variaveis-omie", FaturaController.listarVariaveisOmie);
router.post(
  "/listar-variaveis-sistema",
  FaturaController.listarVariaveisSistema
);

router.post("/enviar-fatura", FaturaController.enviarFatura);

module.exports = router;
