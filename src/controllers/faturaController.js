const ejs = require("ejs");
const BaseOmie = require("../models/baseOmie");
const Include = require("../models/include");
const Configuracao = require("../models/configuracao");

const osService = require("../services/omie/osService");
const clienteService = require("../services/omie/clienteService");
const paisesService = require("../services/omie/paisesService");

const faturaService = require("../services/faturaService");

const { generatePDF } = require("../utils/pdfGenerator");
const { getConfig } = require("../utils/config");
const { sendEmail } = require("../utils/emailSender");
const { listarMoedasComCotacao } = require("../services/Moeda");
const { getConfiguracoes } = require("../services/Configuracao");

const getVariaveisOmie = async (authOmie, numOs) => {
  const os = await osService.consultarOsPorNumero(authOmie, numOs);
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
};

exports.gerarPreview = async (req, res) => {
  try {
    const baseOmie = await BaseOmie.findOne({
      tenant: req.tenant,
      _id: req.body.baseOmie,
    });

    const [includes, moedas] = await Promise.all([
      Include.find({ tenant: req.tenant }),
      listarMoedasComCotacao({ tenant: req.tenant }),
    ]);

    const configuracoes = await Configuracao.find({
      $or: [
        { baseOmie: baseOmie._id, tenant: req.tenant },
        { baseOmie: null, tenant: req.tenant },
      ],
    });

    const variaveisTemplates = {
      ...JSON.parse(req.body.omieVar),
      includes,
      moedas,
      configuracoes,
      baseOmie,
    };

    const html = ejs.render(req.body.content, variaveisTemplates);

    return res.status(200).json({ data: html });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.toString() });
  }
};

exports.downloadPdf = async (req, res) => {
  try {
    const baseOmie = await BaseOmie.findOne({
      tenant: req.tenant,
      _id: req.body.baseOmie,
    });

    const [includes, moedas] = await Promise.all([
      Include.find({ tenant: req.tenant }),
      listarMoedasComCotacao({ tenant: req.tenant }),
    ]);

    const configuracoes = await Configuracao.find({
      $or: [
        { baseOmie: baseOmie._id, tenant: req.tenant },
        { baseOmie: null, tenant: req.tenant },
      ],
    });

    const variaveisTemplates = {
      ...JSON.parse(req.body.omieVar),
      includes,
      moedas,
      configuracoes,
      baseOmie,
    };

    const html = ejs.render(req.body.content, variaveisTemplates);
    const pdf = await generatePDF(html);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=fatura.pdf",
    });

    res.send(Buffer.from(pdf));
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.toString() });
  }
};

exports.listarVariaveisOmie = async (req, res) => {
  try {
    const { baseOmie, os: numOs } = req.body;
    const authOmie = await BaseOmie.findById(baseOmie);

    const { os, cliente } = await getVariaveisOmie(authOmie, numOs);

    return res.status(200).json({ data: { os, cliente } });
  } catch (error) {
    console.log(error.response.data);
    return res.status(500).json();
  }
};

exports.listarVariaveisSistema = async (req, res) => {
  try {
    const baseOmie = await BaseOmie.findOne({
      tenant: req.tenant,
      _id: req.body.baseOmie,
    });

    const [includes, moedas] = await Promise.all([
      Include.find({ tenant: req.tenant }),
      listarMoedasComCotacao({ tenant: req.tenant }),
    ]);

    const configuracoes = await Configuracao.find({
      $or: [
        { baseOmie: baseOmie._id, tenant: req.tenant },
        { baseOmie: null, tenant: req.tenant },
      ],
    });

    const variaveisTemplates = {
      includes,
      moedas,
      configuracoes,
      baseOmie,
    };

    return res.status(200).json({ data: { ...variaveisTemplates } });
  } catch (error) {
    console.log(error);

    return res.status(500).json();
  }
};

exports.enviarFatura = async (req, res) => {
  try {
    const tenant = req.tenant;

    const [baseOmie, includes, moedas] = await Promise.all([
      BaseOmie.findOne({ _id: req.body.baseOmie, tenant }),
      Include.find({ tenant }),
      listarMoedasComCotacao({ tenant }),
    ]);

    const configuracoes = await getConfiguracoes({ baseOmie, tenant });

    const { fatura, emailAssunto, emailCorpo } =
      await faturaService.getTemplates(baseOmie.appKey, tenant);

    const { os, cliente } = await getVariaveisOmie(baseOmie, req.body.os);

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

    const pdf = await faturaService.gerarPDFInvoice(fatura, variaveisTemplates);

    const emailFrom = {
      email: await getConfig("email-from", baseOmie.appKey, tenant),
      nome: await getConfig("email-from-nome", baseOmie.appKey, tenant),
    };

    const emails = [...req?.body?.emailList?.split(",")];

    const emailTo = emails
      .map((email) => email.trim())
      .filter((email) => email)
      .join(",");

    console.log(`Destinatários: ${emailTo}`);

    await sendEmail(emailFrom, emailTo, renderedAssunto, renderedCorpo, [
      { filename: "anexo.pdf", fileBuffer: Buffer.from(pdf) },
    ]);

    res.status(200).json({ message: "Ok" });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ error });
  }
};
