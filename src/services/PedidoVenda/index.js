const TrackingService = require("../Tracking/index");
const Include = require("../../models/include");
const { getConfiguracoes } = require("../Configuracao");
const { listarMoedasComCotacao } = require("../Moeda");
const { PedidoVendaOmie } = require("../omie/pedidoVenda");
const Template = require("../../models/template");
const clienteService = require("../omie/clienteService");
const paisesService = require("../omie/paisesService");
const { generatePDF } = require("../../utils/pdfGenerator");
const ejs = require("ejs");
const { getConfig } = require("../../utils/config");
const anexoService = require("../omie/anexoService");
const EmailSender = require("../../utils/emailSender");

const gerar = async ({ gatilho, baseOmie, autor, idPedido }) => {
  let tracking;
  const tenant = baseOmie.tenant;

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
    const { fatura, emailAssunto, emailCorpo } = await getTemplates({
      tenant,
      gatilho,
    });

    const { pedido, cliente } = await getVariaveisOmie({
      baseOmie,
      codPedido: idPedido,
    });

    await TrackingService.atualizarRastreamento({
      id: tracking._id,
      variaveisOmieCarregadas: true,
    });

    const variaveisTemplates = {
      baseOmie,
      includes,
      cliente,
      os: pedido,
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

    await anexoService.incluirAnexoPedidoVenda({
      baseOmie,
      pedido,
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
        pedido,
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

    await processarPedido({ baseOmie, gatilho, pedido, observacao });

    await TrackingService.concluirRastreamento({
      id: tracking._id,
      status: "sucesso",
    });
  } catch (error) {
    console.log(`❌ Erro ao processar pedido ${idPedido}`, error.message);
    await PedidoVendaOmie.trocarEtapaPedidoVenda({
      baseOmie,
      codPedido: idPedido,
      etapa: gatilho.etapaErro,
      observacao: `${error.message}`,
    });

    if (tracking) {
      await TrackingService.concluirRastreamento({
        id: tracking._id,
        status: "falha",
        detalhesErro: error.message,
      });
    }
  }
};

const getTemplates = async ({ tenant, gatilho }) => {
  const { templateDocumento, templateAssuntoEmail, templateCorpoEmail } =
    gatilho;

  try {
    const [fatura, emailAssunto, emailCorpo] = await Promise.all([
      Template.findOne({ _id: templateDocumento, tenant }),
      Template.findOne({ _id: templateAssuntoEmail, tenant }),
      Template.findOne({ _id: templateCorpoEmail, tenant }),
    ]);

    if (!fatura || !emailAssunto || !emailCorpo) {
      throw new Error(
        "Um ou mais templates obrigatórios não foram encontrados."
      );
    }

    return {
      fatura: fatura.templateEjs,
      emailAssunto: emailAssunto.templateEjs,
      emailCorpo: emailCorpo.templateEjs,
    };
  } catch (error) {
    console.error("❌ Erro ao carregar templates:", error);
    throw new Error("Erro ao buscar templates do gatilho.");
  }
};

const getVariaveisOmie = async ({ baseOmie, codPedido }) => {
  const pedido = await PedidoVendaOmie.consultarPedidoVenda({
    baseOmie,
    codPedido,
  });

  const cliente = await clienteService.consultarCliente(
    baseOmie,
    pedido.pedido_venda_produto.cabecalho.codigo_cliente
  );

  const paises = await paisesService.consultarPais(
    baseOmie,
    cliente.codigo_pais
  );

  cliente.pais = paises.lista_paises[0].cDescricao;

  return { pedido, cliente };
};

const enviarEmail = async ({
  baseOmie,
  tenant,
  pedido,
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

  const emails = [
    cliente?.email,
    emailCopia,
    ...(pedido?.informacoes_adicionais?.utilizar_emails?.split(",") || []),
  ];

  if (!emails?.length > 0) throw new Error("Email não informado");

  console.log(`🛩️ Enviando email! Destinatários: ${emails}`);

  const anexos = [{ filename: "invoice.pdf", fileBuffer: Buffer.from(anexo) }];
  await EmailSender.sendEmail(emailFrom, emails, assunto, corpo, anexos);

  return emails.join(", ");
};

const processarPedido = async ({ baseOmie, gatilho, pedido, observacao }) => {
  console.log("🔄 Processando pedido");
  const etapaProcessado = gatilho.etapaProcessado;

  const pedidoAlterado = await PedidoVendaOmie.montarPedidoVendaAlterado({
    etapa: etapaProcessado,
    observacao,
    pedido,
  });

  await PedidoVendaOmie.alterarPedidoVenda({
    baseOmie,
    pedido: pedidoAlterado,
  });
};

module.exports = {
  gerar,
};
