const Gatilho = require("../../models/gatilho");
const BaseOmie = require("../../models/baseOmie");
const CRMService = require("../../services/CRM");

exports.crm = async (req, res) => {
  try {
    const gatilho = await Gatilho.findById(req.params.id);

    if (!gatilho)
      return res.status(404).json({ error: "Gatilho não encontrado" });

    if (req.body.ping === "omie")
      return res.status(200).json({ message: "pong" });

    console.log("------------------------------------");
    console.log(`🔄 Recebendo webhook CRM`);

    const { appKey, event, topic, author } = req.body;

    if (topic !== "CRM.Oportunidade.Alterado")
      return res.status(200).json({ message: "Tópico ignorado." });

    if (!event.nCodOp || !appKey)
      return res.status(400).json({
        error: "Faltam parâmetros: nCodOp ou appKey.",
      });

    const baseOmie = await BaseOmie.findOne({
      appKey,
      tenant: gatilho?.tenant,
    });

    if (!baseOmie)
      return res.status(404).json({ error: "Base Omie não encontrada" });

    if (gatilho.etapaGeracao !== event.nCodFase?.toString())
      return res.status(200).json({ message: "Etapa ignorada." });

    CRMService.gerar({
      gatilho,
      baseOmie,
      autor: author,
      nCodOp: event.nCodOp,
    });
    return res
      .status(200)
      .json({ message: "Webhook recebido. Fatura sendo gerada." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
