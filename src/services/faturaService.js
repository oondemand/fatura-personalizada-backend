const ejs = require("ejs");

const { getConfig } = require("../utils/config");
const { generatePDF } = require("../utils/pdfGenerator");
const { sendEmail } = require("../utils/emailSender");

const osService = require("./omie/osService");
const clienteService = require("./omie/clienteService");
const anexoService = require("./omie/anexoService");
const paisesService = require("./omie/paisesService");

const BaseOmie = require("../models/baseOmie");
const Include = require("../models/include");
const Template = require("../models/template");
const Moeda = require("../models/moeda");
const Configuracao = require("../models/configuracao");
const ContaCorrenteService = require("./omie/contaCorrenteService");

const faturaService = {
  gerar: async (authOmie, nCodOS, tenant) => {
    const chalk = await import("chalk").then((mod) => mod.default);
    console.log("");
    console.log(chalk.green("Gerando fatura para OS"), nCodOS);

    try {
      const [baseOmie, includes, moedas] = await Promise.all([
        BaseOmie.findOne({ appKey: authOmie.appKey, tenant }),
        Include.find({ tenant }),
        faturaService.listarMoedasComCotacao(tenant),
      ]);

      const configuracoes = await faturaService.getConfiguracoes(
        baseOmie,
        tenant
      );

      const { fatura, emailAssunto, emailCorpo } =
        await faturaService.getTemplates(authOmie.appKey, tenant);

      const { os, cliente } = await faturaService.getVariaveisOmie(
        authOmie,
        nCodOS,
        tenant
      );

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

      const pdfBuffer = await faturaService.gerarPDFInvoice(
        fatura,
        variaveisTemplates
      );

      await anexoService.incluirAnexoInvoiceOS(authOmie, os, pdfBuffer);

      const observacao = await faturaService.enviarEmail(
        authOmie,
        os,
        cliente,
        renderedAssunto,
        renderedCorpo,
        tenant
      );

      await faturaService.processarOS(authOmie, nCodOS, observacao, tenant);

      console.log(JSON.stringify(os.Cabecalho));
      console.log(chalk.green(`OS ${os.Cabecalho.cNumOS} processada!`));
    } catch (error) {
      // console.log(`Erro processamento OS ${nCodOS}: ${error}`);
      console.log(chalk.red(`Erro processamento OS ${nCodOS}`));
      console.error(error);

      const etapaErro = await getConfig(
        "omie-etapa-erro",
        authOmie.appKey,
        tenant
      );
      await osService.trocarEtapaOS(authOmie, nCodOS, etapaErro, `${error}`);
      console.log(`OS ${nCodOS} movida para a etapa de erro`);
    }
  },

  listarMoedasComCotacao: async (tenant) => {
    const moedas = await Moeda.find({ tenant });
    const moedasComCotacao = await Promise.all(
      moedas.map(async (moeda) => {
        const cotacao = await moeda.getValor();
        return {
          simbolo: moeda.simbolo,
          tipoCotacao: moeda.tipoCotacao,
          valor: moeda.valor,
          status: moeda.status,
          cotacao: cotacao.valorCotacao,
          valorFinal: cotacao.valorFinal,
        };
      })
    );
    return moedasComCotacao;
  },

  getConfiguracoes: async (baseOmie, tenant) => {
    const configuracoes = await Configuracao.find({
      $or: [
        { baseOmie: baseOmie._id, tenant },
        { baseOmie: null, tenant },
      ],
    }).exec();

    return configuracoes;
  },

  getTemplates: async (appKey, tenant) => {
    const defaultTemplates = {
      fatura: "fatura",
      emailAssunto: "email-assunto",
      emailCorpo: "email-corpo",
    };

    try {
      const faturaTemplate =
        (await getConfig("template-fatura", appKey, tenant)) ||
        defaultTemplates.fatura;
      const emailAssuntoTemplate =
        (await getConfig("template-email-assunto", appKey, tenant)) ||
        defaultTemplates.emailAssunto;
      const emailCorpoTemplate =
        (await getConfig("template-email-corpo", appKey, tenant)) ||
        defaultTemplates.emailCorpo;

      const fatura = await Template.findOne({
        codigo: faturaTemplate,
        tenant,
      }).exec();
      const emailAssunto = await Template.findOne({
        codigo: emailAssuntoTemplate,
        tenant,
      }).exec();
      const emailCorpo = await Template.findOne({
        codigo: emailCorpoTemplate,
        tenant,
      }).exec();

      if (!fatura || !emailAssunto || !emailCorpo) {
        throw new Error("Um ou mais templates não foram encontrados.");
      }

      return {
        fatura: fatura.templateEjs,
        emailAssunto: emailAssunto.templateEjs,
        emailCorpo: emailCorpo.templateEjs,
      };
    } catch (error) {
      console.error("Erro ao carregar templates:", error.message);
      // Retornar um objeto vazio ou valores padrão em caso de erro
      throw error;
    }
  },

  getVariaveisOmie: async (authOmie, nCodOS) => {
    const os = await osService.consultarOS(authOmie, nCodOS);
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

  processarOS: async (authOmie, nCodOS, observacao, tenant) => {
    console.log("Processando OS", nCodOS);

    const etapaProcessado = await getConfig(
      "omie-etapa-processado",
      authOmie.appKey,
      tenant
    );

    const gerarAdiantamento = await getConfig(
      "omie-adiantamento-gerar",
      authOmie.appKey,
      tenant
    );

    const categoriaAdiantamento = await getConfig(
      "omie-adiantamento-categoria",
      authOmie.appKey,
      tenant
    );

    // const contaCorrenteAdiantamento = await getConfig(
    //   "omie-adiantamento-conta-corrente",
    //   authOmie.appKey,
    //   tenant
    // );

    const ccAdiamentoCliente =
      await ContaCorrenteService.obterContaAdiamentoCliente({
        omieAuth: authOmie,
        tenant,
      });

    const novaOs = await osService.montarOsAlterada(
      authOmie,
      nCodOS,
      etapaProcessado,
      gerarAdiantamento,
      categoriaAdiantamento,
      ccAdiamentoCliente,
      observacao
    );

    await osService.alterarOS(authOmie, novaOs);
  },

  enviarEmail: async (
    authOmie,
    os,
    cliente,
    renderedAssunto,
    renderedCorpo,
    tenant
  ) => {
    console.log("Enviando email");

    const emailFrom = {
      email: await getConfig("email-from", authOmie.appKey, tenant),
      nome: await getConfig("email-from-nome", authOmie.appKey, tenant),
    };

    const emailCopia = await getConfig("email-copia", authOmie.appKey, tenant);

    let emailToArray = [];

    if (os.Email.cEnviarPara?.length > 0)
      emailToArray.push(os.Email.cEnviarPara);
    if (cliente.email?.length > 0) emailToArray.push(cliente.email);
    if (emailCopia?.length > 0) emailToArray.push(emailCopia);

    let emailTo = emailToArray
      .map((email) => email.trim())
      .filter((email) => email)
      .join(",");

    const anexos = await anexoService.listarAnexoBuffer(
      authOmie,
      os.Cabecalho.nCodOS
    );

    if (!emailTo?.length > 0) throw new Error("Email não informado");

    console.log(`Destinatários: ${emailTo}`);
    await sendEmail(emailFrom, emailTo, renderedAssunto, renderedCorpo, anexos);

    return `Invoice enviada para ${emailTo} as ${new Date().toLocaleString()}`;
  },

  gerarPDFInvoice: async (template, variaveis) => {
    console.log("Gerando PDF Invoice");

    const renderedHtml = ejs.render(template, variaveis);
    return await generatePDF(renderedHtml);
  },
};

module.exports = faturaService;
