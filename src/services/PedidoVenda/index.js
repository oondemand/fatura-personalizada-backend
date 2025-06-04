const TrackingService = require("../Tracking/index");
const Include = require("../../models/include");
const { getConfiguracoes } = require("../Configuracao");
const { listarMoedasComCotacao } = require("../Moeda");

const gerar = async ({ gatilho, baseOmie, autor }) => {
  let tracking;

  try {
    tracking = await TrackingService.iniciarRastreamento({
      tenant,
      kanban: "PedidoVenda",
      template: gatilho.templateDocumento,
      emailUsuarioOmie: autor?.email,
    });

    const [includes, moedas] = await Promise.all([
      Include.find({ tenant }),
      listarMoedasComCotacao({ tenant }),
    ]);

    const configuracoes = await getConfiguracoes({ baseOmie, tenant });
  } catch (error) {
    if (tracking) {
      await TrackingService.concluirRastreamento({
        id: tracking._id,
        status: "falha",
        detalhesErro: error.message,
      });
    }
  }
};

module.exports = {
  gerar,
};
