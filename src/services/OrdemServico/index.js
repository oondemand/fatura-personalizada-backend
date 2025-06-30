const osOmie = require("../omie/osService");
const anexoService = require("../omie/anexoService");

const BaseOmie = require("../../models/baseOmie");
const Include = require("../../models/include");
const Tracking = require("../Tracking/tracking");
const { listarMoedasComCotacao } = require("../Moeda");
const { getConfiguracoes } = require("../Configuracao");
const { generateEmailAndPdf } = require("../Template");
const { processarOS } = require("./processarOs");
const { enviarEmail } = require("./enviarEmail");
const { getVariaveisOmie } = require("./getVariaveis");

const gerar = async (baseOmie, nCodOS, tenant, gatilho) => {
  const tracking = await Tracking({
    tenant,
    kanban: "OrdemServico",
    template: gatilho.templateDocumento,
    emailUsuarioOmie: baseOmie.email,
  });

  try {
    const [includes, moedas] = await Promise.all([
      Include.find({ tenant }),
      listarMoedasComCotacao({ tenant }),
    ]);

    const configuracoes = await getConfiguracoes({ baseOmie, tenant });

    await tracking.carregarVariaveisOmie.iniciar();
    const { os, cliente } = await getVariaveisOmie(baseOmie, nCodOS);
    await tracking.carregarVariaveisOmie.finalizar();

    const variaveisDoTemplate = {
      baseOmie,
      includes,
      cliente,
      os,
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
    await anexoService.incluirAnexoInvoiceOS(baseOmie, os, pdf);
    await tracking.anexarDocumentoOmie.finalizar();

    let observacao;

    if (!gatilho.enviarEmail) console.log("Envio de email desativado");
    if (gatilho.enviarEmail) {
      await tracking.enviarEmail.iniciar();
      const emailTo = await enviarEmail(
        baseOmie,
        os,
        cliente,
        assunto,
        corpo,
        tenant,
        gatilho
      );
      await tracking.enviarEmail.finalizar();

      observacao = `Invoice enviada para ${emailTo} as ${new Date().toLocaleString()}`;
    }

    await processarOS(baseOmie, nCodOS, observacao, tenant, gatilho, os);
    if (gatilho.adiantamento) await tracking.gerarAdiantamento.finalizar();

    await tracking.finalizarRastreamentoComSucesso();
  } catch (error) {
    await tracking.finalizarRastreamentoComFalha({
      detalhesErro: error?.message ?? error,
    });

    await osOmie.trocarEtapaOS(baseOmie, nCodOS, gatilho.etapaErro, `${error}`);
  }
};

module.exports = { gerar };
