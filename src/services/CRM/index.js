const TrackingService = require("../Tracking/index");
const Include = require("../../models/include");
const { getConfiguracoes } = require("../Configuracao");
const { listarMoedasComCotacao } = require("../Moeda");
const { CRMOmie } = require("../omie/crmService");
const Template = require("../../models/template");
const clienteService = require("../omie/clienteService");
const paisesService = require("../omie/paisesService");
const { generatePDF } = require("../../utils/pdfGenerator");
const ejs = require("ejs");
const { getConfig } = require("../../utils/config");
const anexoService = require("../omie/anexoService");
const EmailSender = require("../../utils/emailSender");
const { getTemplates } = require("../Template");

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

    await TrackingService.atualizarRastreamento({
      id: tracking._id,
      variaveisOmieCarregadas: false,
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
        cliente,
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

const getVariaveisOmie = async ({ baseOmie, nCodOp }) => {
  const oportunidade = await CRMOmie.consultarOportunidade({
    baseOmie,
    nCodOp,
  });

  const conta = await CRMOmie.consultarConta({
    baseOmie,
    nCod: oportunidade.identificacao.nCodConta,
  });

  const contato = await CRMOmie.consultarContato({
    baseOmie,
    nCod: oportunidade.identificacao.nCodContato,
  });

  return { oportunidade, conta, contato };
};

const enviarEmail = async ({
  baseOmie,
  tenant,
  cliente,
  anexo,
  assunto,
  corpo,
}) => {
  const emailFrom = {
    email: await getConfig("email-from", baseOmie.appKey, tenant),
    nome: await getConfig("email-from-nome", baseOmie.appKey, tenant),
  };

  const emailCopia = await getConfig("email-copia", baseOmie.appKey, tenant);

  // const emails = [cliente?.email, emailCopia];
  const emails = ["maikonalexandre574@gmail.com"];
  if (!emails?.length > 0) throw new Error("Email não informado");

  console.log(`🛩️ Enviando email! Destinatários: ${emails}`);

  const anexos = [{ filename: "invoice.pdf", fileBuffer: Buffer.from(anexo) }];
  await EmailSender.sendEmail(emailFrom, emails, assunto, corpo, anexos);

  return emails.join(", ");
};

const processarOportunidade = async ({
  baseOmie,
  gatilho,
  oportunidade,
  observacao,
}) => {
  console.log("🔄 Processando oportunidade");
  const etapaProcessado = gatilho.etapaProcessado;

  const oportunidadeAlterada = await CRMOmie.montarOportunidadeAlterado({
    etapa: etapaProcessado,
    observacao,
    oportunidade,
  });

  await CRMOmie.alterarOportunidade({
    baseOmie,
    oportunidade: oportunidadeAlterada,
  });
};

module.exports = {
  gerar,
};
