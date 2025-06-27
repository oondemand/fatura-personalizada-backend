const express = require("express");
const router = express.Router();
const { ordemServico } = require("../controllers/webhook/ordemServico");
const { pedidoVenda } = require("../controllers/webhook/pedidoVenda");

router.post("/ordem-servico/:id", ordemServico);
router.post("/pedido-venda/:id", pedidoVenda);
router.post("/crm/:id", crm);

module.exports = router;
