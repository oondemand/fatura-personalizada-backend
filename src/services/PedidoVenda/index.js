const Tracking = require("../Tracking/tracking");
const Include = require("../../models/include");
const { getConfiguracoes } = require("../Configuracao");
const { listarMoedasComCotacao } = require("../Moeda");
const { PedidoVendaOmie } = require("../omie/pedidoVenda");
const anexoService = require("../omie/anexoService");
const { generateEmailAndPdf } = require("../Template");
const { enviarEmail } = require("./enviarEmail");
const { getVariaveisOmie } = require("./getVariaveis");
const { processarPedido } = require("./processarPedido");

const gerar = async ({ gatilho, baseOmie, autor, nPedido, idPedido }) => {
  const tenant = baseOmie.tenant;
  const tracking = await Tracking({
    tenant,
    kanban: "PedidoVenda",
    template: gatilho.templateDocumento,
    emailUsuarioOmie: autor?.email,
  });

  try {
    const [includes, moedas] = await Promise.all([
      Include.find({ tenant }),
      listarMoedasComCotacao({ tenant }),
    ]);

    const configuracoes = await getConfiguracoes({ baseOmie, tenant });

    await tracking.carregarVariaveisOmie.iniciar();
    const { pedido, cliente } = await getVariaveisOmie({
      baseOmie,
      nPedido: nPedido,
    });
    await tracking.carregarVariaveisOmie.finalizar();

    const variaveisDoTemplate = {
      baseOmie,
      includes,
      cliente,
      pedido,
      moedas,
      configuracoes,
    };

    await tracking.gerarDocumento.iniciar();
    const { assunto, corpo, pdf } = await generateEmailAndPdf({
      gatilho,
      tenant,
      variaveisDoTemplate,
    });
    await tracking.gerarDocumento.finalizar();

    await tracking.anexarDocumentoOmie.iniciar();
    await anexoService.incluirAnexoPedidoVenda({
      baseOmie,
      pedido,
      arquivo: pdf,
    });
    await tracking.anexarDocumentoOmie.finalizar();

    let observacao;

    if (!gatilho.enviarEmail) console.log("Envio de email desativado");
    if (gatilho.enviarEmail) {
      await tracking.enviarEmail.iniciar();
      const emails = await enviarEmail({
        baseOmie,
        tenant,
        pedido,
        cliente,
        assunto,
        corpo,
        anexo: pdf,
      });

      await tracking.enviarEmail.finalizar({
        emailsDestinatarios: emails,
      });

      observacao = `Invoice enviada para ${emails} as ${new Date().toLocaleString()}`;
    }

    await processarPedido({ baseOmie, gatilho, pedido, observacao });

    await tracking.finalizarRastreamentoComSucesso();
  } catch (error) {
    if (tracking) {
      await tracking.finalizarRastreamentoComFalha({
        detalhesErro: error?.message || error,
      });
    }

    await PedidoVendaOmie.trocarEtapaPedidoVenda({
      baseOmie,
      idPedido,
      etapa: gatilho.etapaErro,
      observacao: `${error?.message ?? error}`,
    });
  }
};

module.exports = {
  gerar,
  getVariaveisOmie,
};
