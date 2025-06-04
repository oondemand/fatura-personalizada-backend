const faturaService = require("../../services/faturaService");
const BaseOmie = require("../../models/baseOmie");
const Gatilho = require("../../models/gatilho");

exports.ordemServico = async (req, res) => {
  try {
    const gatilho = await Gatilho.findById(req.params.id);

    if (!gatilho)
      return res.status(404).json({ error: "Gatilho não encontrado" });

    const { appKey, event, ping, topic, author } = req.body;

    if (ping === "omie") return res.status(200).json({ message: "pong" });

    console.log("------------------------------------");
    console.log(`🔄 Recebendo webhook Ordem de Serviço`);

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

    const baseOmie = await BaseOmie.findOne({
      appKey: appKey,
      tenant: gatilho.tenant,
    });

    if (!baseOmie)
      return res.status(404).send({ error: "AppKey não encontrada" });

    const authOmie = {
      appKey: appKey,
      appSecret: baseOmie.appSecret,
      email: author.email,
    };

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
};
