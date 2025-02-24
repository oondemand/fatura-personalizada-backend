const express = require("express");
const router = express.Router();
const configuracaoController = require("../controllers/configuracaoController");

router.post("/", configuracaoController.criarConfiguracao);
router.get("/", configuracaoController.obterConfiguracao);
router.get(
  "/listar-configuracoes-unicas",
  configuracaoController.listarConfiguracoesUnicas
);

router.get(
  "/listar-categorias-omie/:baseOmieId",
  configuracaoController.listarCategoriasOmie
);

router.get(
  "/listar-etapas-omie/:baseOmieId",
  configuracaoController.listarEtapasOmie
);

router.get("/:id", configuracaoController.obterConfiguracaoPorId);
router.put("/:id", configuracaoController.atualizarConfiguracao);
router.delete("/:id", configuracaoController.excluirConfiguracao);

module.exports = router;
