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
const { getTemplates } = require("../Template");

const gerar = async ({ gatilho, baseOmie, autor, nPedido }) => {
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
      nPedido: nPedido,
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
    console.log(`❌ Erro ao processar pedido ${nPedido}`, error.message);

    if (tracking) {
      await TrackingService.concluirRastreamento({
        id: tracking._id,
        status: "falha",
        detalhesErro: error.message,
      });
    }

    await PedidoVendaOmie.trocarEtapaPedidoVenda({
      baseOmie,
      nPedido: nPedido,
      etapa: gatilho.etapaErro,
      observacao: `${error.message}`,
    });
  }
};

const getVariaveisOmie = async ({ baseOmie, nPedido }) => {
  const pedido = await PedidoVendaOmie.consultarPedidoVenda({
    baseOmie,
    nPedido,
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
  getVariaveisOmie,
};
