const ejs = require("ejs");
const BaseOmie = require("../models/baseOmie");
const Include = require("../models/include");
const Gatilho = require("../models/gatilho");
const Configuracao = require("../models/configuracao");

const OrdemServicoService = require("../services/OrdemServico");

const { generatePDF } = require("../utils/pdfGenerator");
const { getConfig } = require("../utils/config");
const { sendEmail } = require("../utils/emailSender");
const { listarMoedasComCotacao } = require("../services/Moeda");
const { getConfiguracoes } = require("../services/Configuracao");

const PedidoVendaService = require("../services/PedidoVenda");
const { getTemplates } = require("../services/Template");

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
    const { baseOmie, numero, gatilho: gatilhoId } = req.body;

    const authOmie = await BaseOmie.findById(baseOmie);
    const gatilho = await Gatilho.findById(gatilhoId);

    let data;

    if (gatilho?.kanbanOmie === "PedidoVenda") {
      data = await PedidoVendaService.getVariaveisOmie({
        baseOmie: authOmie,
        nPedido: numero,
      });
    }

    if (gatilho?.kanbanOmie === "OrdemServico") {
      data = await OrdemServicoService.getVariaveisOmiePorNumero(
        authOmie,
        numero
      );
    }

    return res.status(200).json({ data });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error?.response?.data?.faultstring });
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

    const gatilho = await Gatilho.findById(req.body.gatilho);
    const configuracoes = await getConfiguracoes({ baseOmie, tenant });

    const { fatura, emailAssunto, emailCorpo } = await getTemplates({
      gatilho,
      tenant,
    });

    const variaveisTemplates = {
      ...JSON.parse(req.body.omieVar),
      includes,
      moedas,
      configuracoes,
      baseOmie,
    };

    const renderedAssunto = ejs.render(emailAssunto, variaveisTemplates);
    const renderedCorpo = ejs.render(emailCorpo, variaveisTemplates);
    const renderedHtml = ejs.render(fatura, variaveisTemplates);

    const pdf = await generatePDF(renderedHtml);

    const emailFrom = {
      email: await getConfig("email-from", baseOmie.appKey, tenant),
      nome: await getConfig("email-from-nome", baseOmie.appKey, tenant),
    };

    const emails = [...req?.body?.emailList?.split(",")];

    console.log(`Destinatários: ${emails}`);

    await sendEmail(emailFrom, emails, renderedAssunto, renderedCorpo, [
      { filename: "anexo.pdf", fileBuffer: Buffer.from(pdf) },
    ]);

    res.status(200).json({ message: "Ok" });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ error });
  }
};
