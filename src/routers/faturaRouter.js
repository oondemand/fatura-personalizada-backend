const express = require("express");
const FaturaController = require("../controllers/faturaController");

const router = express.Router();

// Rotas para Fatura
router.post("/", FaturaController.gerarPreview);
router.post("/listar-variaveis-omie", FaturaController.listarVariaveisOmie);
router.post(
  "/listar-variaveis-sistema",
  FaturaController.listarVariaveisSistema
);

module.exports = router;
