const Configuracao = require("../models/configuracao");
const BaseOmie = require("../models/baseOmie");
const categoriasService = require("../services/omie/categoriasService");
const EtapasService = require("../services/omie/etapasService");
const FasesService = require("../services/omie/fasesService");

// Criar uma nova configuração
const criarConfiguracao = async (req, res) => {
  const body = {};
  for (const key in req.body) {
    if (req.body[key] !== "") {
      body[key] = req.body[key];
    }
  }

  try {
    const novaConfiguracao = new Configuracao({
      ...body,
      tenant: req.tenant,
    });
    const configuracaoSalva = await novaConfiguracao.save();
    res.status(201).json(configuracaoSalva);
  } catch (error) {
    console.log(error);

    res.status(400).json({ error: error.message });
  }
};

// Obter todas as configurações
const obterConfiguracao = async (req, res) => {
  try {
    const configuracoes = await Configuracao.find({
      tenant: req.tenant,
    }).populate("baseOmie");
    res.status(200).json(configuracoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obter uma configuração por ID
const obterConfiguracaoPorId = async (req, res) => {
  try {
    const configuracao = await Configuracao.findOne({
      _id: req.params.id,
      tenant: req.tenant,
    });
    if (!configuracao) {
      return res.status(404).json({ message: "Configuração não encontrada" });
    }
    res.status(200).json(configuracao);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Atualizar uma configuração por ID
const atualizarConfiguracao = async (req, res) => {
  const fieldsToUpdate = {};
  for (const key in req.body) {
    if (req.body[key] !== "") {
      fieldsToUpdate[key] = req.body[key];
    }
  }

  try {
    const configuracaoAtualizada = await Configuracao.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant },
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!configuracaoAtualizada) {
      return res.status(404).json({ message: "Configuração não encontrada" });
    }
    res.status(200).json(configuracaoAtualizada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Excluir uma configuração por ID
const excluirConfiguracao = async (req, res) => {
  try {
    const configuracaoExcluida = await Configuracao.findOneAndDelete({
      _id: req.params.id,
      tenant: req.tenant,
    });
    if (!configuracaoExcluida) {
      return res.status(404).json({ message: "Configuração não encontrada" });
    }
    res.status(200).json({ message: "Configuração excluída com sucesso" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listarConfiguracoesUnicas = async (req, res) => {
  try {
    const todasConfiguracoes = await Configuracao.find({ tenant: req.tenant });

    const configuracoesMap = new Map();

    todasConfiguracoes.forEach((config) => {
      if (!configuracoesMap.has(config.codigo)) {
        configuracoesMap.set(config.codigo, config);
      }
    });

    const configuracoesUnicas = Array.from(configuracoesMap.values());

    return res.status(200).json(configuracoesUnicas);
  } catch (error) {
    console.error("Erro ao listar configurações únicas:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const listarCategoriasOmie = async (req, res) => {
  try {
    const baseOmie = await BaseOmie.findOne({
      _id: req.params.baseOmieId,
      tenant: req.tenant,
    });

    const data = await categoriasService.listarCategorias({ baseOmie });

    return res
      .status(200)
      .json(data?.categoria_cadastro.filter((e) => e.nao_exibir != "S"));
  } catch (error) {
    console.error("Erro ao listar categorias:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const listarEtapasOmie = async (req, res) => {
  try {
    const bases = await BaseOmie.find({
      tenant: req.tenant,
    });

    // No kanban CRM etapas são chamadas de fases e tem um corpo diferente 😄
    // Dispara as promessas ao mesmo tempo
    // ------------------------------------------------------------------------
    const [results, resultsFases] = await Promise.all([
      Promise.all(
        bases.map((base) =>
          EtapasService.listarEtapasFaturamento({ baseOmie: base })
        )
      ),
      Promise.all(
        bases.map((base) => FasesService.listarFases({ baseOmie: base }))
      ),
    ]);

    const conjuntoEtapasOmie = results.flatMap((data) => data?.cadastros || []);
    const conjuntoFasesOmie = resultsFases.flatMap(
      (data) => data?.cadastros || []
    );

    const etapas = EtapasService.agruparEtapasFormatadasPorKanban({
      etapas: conjuntoEtapasOmie.filter((item) => "etapas" in item),
    });

    const fases = FasesService.formatarFasesOmie({ fases: conjuntoFasesOmie });

    /** RESPONSE =>
     *  {CRM: [{descricao: "Etapa 1", codigo: "1"}, ...]}
     *  {PedidoVenda: [{descricao: "Etapa 1", codigo: "1"}, ...]}
     *  {OrdemServico: [{descricao: "Etapa 1", codigo: "1"}, ...]}
     */

    return res.status(200).json(Object.assign({}, ...[fases, ...etapas]));
  } catch (error) {
    console.log("Erro ao listar categorias:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  criarConfiguracao,
  obterConfiguracao,
  obterConfiguracaoPorId,
  atualizarConfiguracao,
  excluirConfiguracao,
  listarConfiguracoesUnicas,
  listarCategoriasOmie,
  listarEtapasOmie,
};
