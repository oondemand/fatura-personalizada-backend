const ejs = require("ejs");

const { getConfig } = require("../../utils/config");
const { generatePDF } = require("../../utils/pdfGenerator");
const { sendEmail } = require("../../utils/emailSender");

const osOmie = require("../omie/osService");
const clienteService = require("../omie/clienteService");
const anexoService = require("../omie/anexoService");
const paisesService = require("../omie/paisesService");

const BaseOmie = require("../../models/baseOmie");
const Include = require("../../models/include");
const Template = require("../../models/template");
const ContaCorrenteService = require("../omie/contaCorrenteService");
const trackingService = require("../Tracking");
const { listarMoedasComCotacao } = require("../Moeda");
const { getConfiguracoes } = require("../Configuracao");
const { getTemplates } = require("../Template");

const ordemServicoService = {
  gerar: async (authOmie, nCodOS, tenant, gatilho) => {
    const chalk = await import("chalk").then((mod) => mod.default);
    console.log("");
    console.log(chalk.green("Gerando fatura para OS"), nCodOS);

    const tracking = await trackingService.iniciarRastreamento({
      tenant,
      kanban: "OrdemServiço",
      template: gatilho.templateDocumento,
      emailUsuarioOmie: authOmie.email,
    });

    try {
      const [baseOmie, includes, moedas] = await Promise.all([
        BaseOmie.findOne({ appKey: authOmie.appKey, tenant }),
        Include.find({ tenant }),
        listarMoedasComCotacao({ tenant }),
      ]);

      const configuracoes = await getConfiguracoes({ baseOmie, tenant });

      const { fatura, emailAssunto, emailCorpo } = await getTemplates({
        tenant,
        gatilho,
      });

      const { os, cliente } = await ordemServicoService.getVariaveisOmie(
        authOmie,
        nCodOS
      );

      await trackingService.atualizarRastreamento({
        id: tracking._id,
        variaveisOmieCarregadas: true,
      });

      const variaveisTemplates = {
        baseOmie,
        includes,
        cliente,
        os,
        moedas,
        configuracoes,
      };

      const renderedAssunto = ejs.render(emailAssunto, variaveisTemplates);
      const renderedCorpo = ejs.render(emailCorpo, variaveisTemplates);

      const pdfBuffer = await ordemServicoService.gerarPDFInvoice(
        fatura,
        variaveisTemplates
      );

      await trackingService.atualizarRastreamento({
        id: tracking._id,
        documentoGerado: true,
      });

      await anexoService.incluirAnexoInvoiceOS(authOmie, os, pdfBuffer);

      await trackingService.atualizarRastreamento({
        id: tracking._id,
        documentoAnexadoOmie: true,
      });

      let observacao;

      if (!gatilho.enviarEmail) console.log("Envio de email desativado");
      if (gatilho.enviarEmail) {
        const emailTo = await ordemServicoService.enviarEmail(
          authOmie,
          os,
          cliente,
          renderedAssunto,
          renderedCorpo,
          tenant,
          gatilho
        );

        await trackingService.atualizarRastreamento({
          id: tracking._id,
          emailEnviado: true,
          emailsDestinatarios: emailTo,
        });

        observacao = `Invoice enviada para ${emailTo} as ${new Date().toLocaleString()}`;
      }

      await ordemServicoService.processarOS(
        authOmie,
        nCodOS,
        observacao,
        tenant,
        gatilho,
        os
      );

      if (gatilho.adiantamento) {
        await trackingService.atualizarRastreamento({
          id: tracking._id,
          adiantamentoGerado: gatilho.adiantamento,
        });
      }

      await trackingService.concluirRastreamento({
        id: tracking._id,
        status: "sucesso",
      });

      console.log(JSON.stringify(os.Cabecalho));
      console.log(chalk.green(`OS ${os.Cabecalho.cNumOS} processada!`));
    } catch (error) {
      console.log(chalk.red(`Erro processamento OS ${nCodOS}`));
      console.error(error);

      await trackingService.concluirRastreamento({
        id: tracking._id,
        status: "falha",
        detalhesErro: error?.message ?? error,
      });

      await osOmie.trocarEtapaOS(
        authOmie,
        nCodOS,
        gatilho.etapaErro,
        `${error}`
      );

      console.log(`OS ${nCodOS} movida para a etapa de erro`);
    }
  },

  // getTemplates: async (appKey, tenant, gatilho) => {
  //   try {
  //     const fatura = await Template.findOne({
  //       _id: gatilho.templateDocumento,
  //       tenant,
  //     });

  //     const emailAssunto = await Template.findOne({
  //       _id: gatilho.templateAssuntoEmail,
  //       tenant,
  //     });

  //     const emailCorpo = await Template.findOne({
  //       _id: gatilho.templateCorpoEmail,
  //       tenant,
  //     });

  //     if (!fatura || !emailAssunto || !emailCorpo) {
  //       throw new Error("Um ou mais templates não foram encontrados.");
  //     }

  //     return {
  //       fatura: fatura.templateEjs,
  //       emailAssunto: emailAssunto.templateEjs,
  //       emailCorpo: emailCorpo.templateEjs,
  //     };
  //   } catch (error) {
  //     console.error("Erro ao carregar templates:", error.message);
  //     throw error;
  //   }
  // },

  getVariaveisOmie: async (authOmie, nCodOS) => {
    const os = await osOmie.consultarOS(authOmie, nCodOS);
    const cliente = await clienteService.consultarCliente(
      authOmie,
      os.Cabecalho.nCodCli
    );
    const paises = await paisesService.consultarPais(
      authOmie,
      cliente.codigo_pais
    );
    cliente.pais = paises.lista_paises[0].cDescricao;

    return { os, cliente };
  },

  getVariaveisOmiePorNumero: async (authOmie, numeroOS) => {
    const os = await osOmie.consultarOsPorNumero(authOmie, numeroOS);
    const cliente = await clienteService.consultarCliente(
      authOmie,
      os.Cabecalho.nCodCli
    );
    const paises = await paisesService.consultarPais(
      authOmie,
      cliente.codigo_pais
    );
    cliente.pais = paises.lista_paises[0].cDescricao;

    return { os, cliente };
  },

  processarOS: async (authOmie, nCodOS, observacao, tenant, gatilho, os) => {
    console.log("Processando OS", nCodOS);

    const etapaProcessado = gatilho.etapaProcessado;
    const gerarAdiantamento = gatilho.adiantamento;

    const ccAdiamentoCliente =
      await ContaCorrenteService.obterContaAdiamentoCliente({
        omieAuth: authOmie,
        tenant,
      });

    const novaOs = await osOmie.montarOsAlterada(
      authOmie,
      nCodOS,
      etapaProcessado,
      gerarAdiantamento,
      os.InformacoesAdicionais.cCodCateg,
      ccAdiamentoCliente,
      observacao
    );

    await osOmie.alterarOS(authOmie, novaOs);
  },

  enviarEmail: async (
    authOmie,
    os,
    cliente,
    renderedAssunto,
    renderedCorpo,
    tenant,
    gatilho
  ) => {
    if (!gatilho.enviarEmail) {
      console.log("Envio de email desativado");
      return;
    }

    console.log("Enviando email");

    const emailFrom = {
      email: await getConfig("email-from", authOmie.appKey, tenant),
      nome: await getConfig("email-from-nome", authOmie.appKey, tenant),
    };

    const emailCopia = await getConfig("email-copia", authOmie.appKey, tenant);

    const emails = [
      cliente?.email,
      emailCopia,
      ...(os?.Email?.cEnviarPara?.split(",") || []),
    ];

    const anexos = await anexoService.listarAnexoBuffer(
      authOmie,
      os.Cabecalho.nCodOS
    );

    if (!emails?.length > 0) throw new Error("Email não informado");

    console.log(`Destinatários: ${emails}`);
    await sendEmail(emailFrom, emails, renderedAssunto, renderedCorpo, anexos);

    return emails.join(", ");
  },

  gerarPDFInvoice: async (template, variaveis) => {
    console.log("Gerando PDF Invoice");

    const renderedHtml = ejs.render(template, variaveis);
    return await generatePDF(renderedHtml);
  },
};

module.exports = ordemServicoService;
