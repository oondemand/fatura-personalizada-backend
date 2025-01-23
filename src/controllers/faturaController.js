const ejs = require("ejs");
const BaseOmie = require("../models/baseOmie");
const Include = require("../models/include");
const Moeda = require("../models/moeda");
const Configuracao = require("../models/configuracao");

const osService = require("../services/omie/osService");
const clienteService = require("../services/omie/clienteService");
const paisesService = require("../services/omie/paisesService");

const listarMoedasComCotacao = async ({ tenantId }) => {
  const moedas = await Moeda.find({ tenant: tenantId });
  const moedasComCotacao = await Promise.all(
    moedas.map(async (moeda) => {
      const cotacao = await moeda.getValor();
      return {
        nome: moeda.nome,
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
};

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
      listarMoedasComCotacao({ tenantId: req.tenant }),
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
      listarMoedasComCotacao({ tenantId: req.tenant }),
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
