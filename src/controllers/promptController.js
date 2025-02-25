const Prompt = require("../models/prompt");

exports.readAll = async (req, res) => {
  try {
    const prompts = await Prompt.find({
      assistente: req.query.assistente,
    }).sort({ ordem: 1 });
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { nome, codigo, descricao, conteudo, tipo, ordem } = req.body;

  const updateFields = {};

  if (nome !== "") updateFields.nome = nome;
  if (tipo !== "") updateFields.tipo = tipo;
  if (ordem !== "") updateFields.ordem = ordem;
  updateFields.codigo = codigo;

  updateFields.conteudo = conteudo;
  updateFields.descricao = descricao;

  console.log(updateFields, req.body, req.codigo ? "tem codigo" : "não tem");

  try {
    const prompt = await Prompt.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!prompt) {
      return res.status(404).json({ message: "Registro não encontrado" });
    }

    res.json(prompt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nome, codigo, descricao, conteudo, tipo, ordem, assistente } =
      req.body;

    if (!nome) {
      return res.status(400).json({ message: "Nome é obrigatório." });
    }

    const ultimoPrompt = await Prompt.findOne({ assistente })
      .sort({ ordem: -1 })
      .limit(1);

    const newPrompt = new Prompt({
      nome,
      codigo,
      descricao,
      conteudo,
      tipo,
      ordem: ultimoPrompt?.ordem ? ultimoPrompt.ordem + 10 : 10,
      assistente,
    });

    const savedPrompt = await newPrompt.save();
    res.status(201).json(savedPrompt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.readOne = async (req, res) => {
  const { id } = req.params;

  try {
    const prompt = await Prompt.findById(id);
    if (!prompt) {
      return res.status(404).json({ message: "Registro não encontrado" });
    }
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPrompt = await Prompt.findByIdAndDelete(id);
    if (!deletedPrompt) {
      return res.status(404).json({ message: "Registro não encontrado" });
    }

    const prompts = await Prompt.find({
      assistente: deletedPrompt.assistente,
    }).sort({
      ordem: 1,
    });

    let proximaOrdem = 10;
    for (const prompt of prompts) {
      prompt.ordem = proximaOrdem;
      proximaOrdem += 10;
      await prompt.save();
    }

    res.json({ message: "Registro deletado com sucesso!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
