const Include = require("../../models/include");
const { getConfiguracoes } = require("../Configuracao");
const { listarMoedasComCotacao } = require("../Moeda");
const { CRMOmie } = require("../omie/crmService");
const anexoService = require("../omie/anexoService");
const { processarOportunidade } = require("./processarOportunidade");
const { enviarEmail } = require("./enviarEmail");
const { getVariaveisOmie } = require("./getVariaveis");
const Tracking = require("../Tracking/tracking");
const { generateEmailAndPdf } = require("../Template");

const gerar = async ({ gatilho, baseOmie, autor, nCodOp }) => {
  const tenant = baseOmie.tenant;
  const tracking = await Tracking({
    tenant,
    kanban: "CRM",
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
    const { oportunidade, conta, contato } = await getVariaveisOmie({
      baseOmie,
      nCodOp,
    });
    await tracking.carregarVariaveisOmie.finalizar();

    const variaveisDoTemplate = {
      baseOmie,
      includes,
      oportunidade,
      conta,
      contato,
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
    await anexoService.incluirAnexoCrmOportunidades({
      baseOmie,
      oportunidade,
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
        assunto,
        corpo,
        anexo: pdf,
      });
      await tracking.enviarEmail.finalizar({ emailsDestinatarios: emails });
      observacao = `Invoice enviada para ${emails} as ${new Date().toLocaleString()}`;
    }

    await processarOportunidade({
      baseOmie,
      gatilho,
      oportunidade,
      observacao,
    });

    await tracking.finalizarRastreamentoComSucesso();
  } catch (error) {
    if (tracking) {
      await tracking.finalizarRastreamentoComFalha({
        detalhesErro: error?.message ?? error,
      });
    }

    await CRMOmie.trocarEtapaOportunidade({
      baseOmie,
      nCodOp,
      etapa: gatilho.etapaErro,
      observacao: `${error?.message ?? error}`,
    });
  }
};

module.exports = {
  gerar,
};
