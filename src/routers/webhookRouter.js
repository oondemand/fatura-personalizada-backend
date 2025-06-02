// src/routers/webhookRouter.js
const express = require("express");
const faturaService = require("../services/faturaService");
const BaseOmie = require("../models/baseOmie");
const Gatilho = require("../models/gatilho");

const router = express.Router();

router.post("/gerar-fatura/:id", async (req, res) => {
  const gatilhoId = req.params.id;

  try {
    const { appKey, event, ping, topic, author } = req.body;

    const gatilho = await Gatilho.findById(gatilhoId);

    if (!gatilho)
      return res.status(404).json({ error: "Gatilho não encontrado" });

    // Verificar se o webhook é um ping
    if (ping === "omie") return res.status(200).json({ message: "pong" });

    // Verificar se o tópico é "OrdemServico.EtapaAlterada"
    if (topic !== "OrdemServico.EtapaAlterada")
      return res.status(200).json({ message: "Tópico ignorado." });

    console.log("Etapa gerar:", gatilho.etapaGeracao);

    if (event.etapa !== gatilho.etapaGeracao)
      return res.status(200).json({ message: "Etapa ignorada." });

    if (!appKey || !event.idOrdemServico) {
      return res.status(400).json({
        error: "Faltam parâmetros: appKey ou dados do evento incompletos.",
      });
    }

    // Consultar o banco de dados para obter o appSecret
    const baseOmie = await BaseOmie.findOne({
      appKey: appKey,
      tenant: gatilho.tenant,
    });

    if (!baseOmie)
      return res.status(404).send({ error: "AppKey não encontrada" });

    // Estrutura esperada para gerar a fatura
    const authOmie = {
      appKey: appKey,
      appSecret: baseOmie.appSecret,
      email: author.email,
    };

    // Acionar o serviço de geração da fatura
    faturaService.gerar(
      authOmie,
      event.idOrdemServico,
      gatilho.tenant,
      gatilho
    );

    res.status(200).json({ message: "Webhook recebido. Fatura sendo gerada." });
  } catch (error) {
    console.error("Erro ao processar o webhook:", error);
    res.status(500).json({ error: "Erro ao processar o webhook." });
  }
});

module.exports = router;
