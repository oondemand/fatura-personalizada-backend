const TrackingService = require("../Tracking/index");
const Include = require("../../models/include");
const { getConfiguracoes } = require("../Configuracao");
const { listarMoedasComCotacao } = require("../Moeda");
const { CRMOmie } = require("../omie/crmService");
const { generatePDF } = require("../../utils/pdfGenerator");
const ejs = require("ejs");
const anexoService = require("../omie/anexoService");
const { getTemplates } = require("../Template");
const { processarOportunidade } = require("./processarOportunidade");
const { enviarEmail } = require("./enviarEmail");
const { getVariaveisOmie } = require("./getVariaveis");

const gerar = async ({ gatilho, baseOmie, autor, nCodOp }) => {
  let tracking;
  const tenant = baseOmie.tenant;

  try {
    tracking = await TrackingService.iniciarRastreamento({
      tenant,
      kanban: "CRM",
      template: gatilho.templateDocumento,
      emailUsuarioOmie: autor?.email,
    });

    const [includes, moedas] = await Promise.all([
      Include.find({ tenant }),
      listarMoedasComCotacao({ tenant }),
    ]);

    const configuracoes = await getConfiguracoes({ baseOmie, tenant });
    const { fatura, emailAssunto, emailCorpo } = await getTemplates({
      tenant,
      gatilho,
    });

    const { oportunidade, conta, contato } = await getVariaveisOmie({
      baseOmie,
      nCodOp,
    });

    await TrackingService.atualizarRastreamento({
      id: tracking._id,
      variaveisOmieCarregadas: true,
    });

    const variaveisTemplates = {
      baseOmie,
      includes,
      oportunidade,
      conta,
      contato,
      moedas,
      configuracoes,
    };

    const renderedAssunto = ejs.render(emailAssunto, variaveisTemplates);
    const renderedCorpo = ejs.render(emailCorpo, variaveisTemplates);
    const renderedHtml = ejs.render(fatura, variaveisTemplates);

    const pdf = await generatePDF(renderedHtml);

    await TrackingService.atualizarRastreamento({
      id: tracking._id,
      documentoGerado: true,
    });

    await anexoService.incluirAnexoCrmOportunidades({
      baseOmie,
      oportunidade,
      arquivo: pdf,
    });

    await TrackingService.atualizarRastreamento({
      id: tracking._id,
      documentoAnexadoOmie: true,
    });

    let observacao;
    if (!gatilho.enviarEmail) console.log("Envio de email desativado");
    if (gatilho.enviarEmail) {
      const emails = await enviarEmail({
        baseOmie,
        tenant,
        assunto: renderedAssunto,
        corpo: renderedCorpo,
        anexo: pdf,
      });

      await TrackingService.atualizarRastreamento({
        id: tracking._id,
        emailEnviado: true,
        emailsDestinatarios: emails,
      });

      observacao = `Invoice enviada para ${emails} as ${new Date().toLocaleString()}`;
    }

    await processarOportunidade({
      baseOmie,
      gatilho,
      oportunidade,
      observacao,
    });

    await TrackingService.concluirRastreamento({
      id: tracking._id,
      status: "sucesso",
    });
  } catch (error) {
    console.log(`❌ Erro ao gerar CRM: ${error.message ?? error}`);

    if (tracking) {
      await TrackingService.concluirRastreamento({
        id: tracking._id,
        status: "falha",
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
