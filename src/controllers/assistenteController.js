const Assistente = require("../models/assistente");
const Prompt = require("../models/prompt");

exports.create = async (req, res) => {
  try {
    const assistente = await Assistente.findOne({ nome: req.body.nome });

    if (assistente) {
      return res
        .status(404)
        .json({ message: "Já existe um assistente com esse nome." });
    }

    const assistenteNovo = new Assistente({ ...req.body });
    const savedAssistente = await assistenteNovo.save();
    res.status(201).json(savedAssistente);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.readAll = async (req, res) => {
  try {
    const assistentes = await Assistente.find();
    res.json(assistentes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.readOne = async (req, res) => {
  try {
    const assistente = await Assistente.findById(req.params.id);
    if (!assistente)
      return res.status(404).json({ message: "Assistente não encontrado" });
    res.json(assistente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updatedAssistente = await Assistente.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedAssistente)
      return res.status(404).json({ message: "Assistente não encontrado" });

    res.json(updatedAssistente);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const deletedAssistente = await Assistente.findByIdAndDelete(req.params.id);
    await Prompt.deleteMany({ assistente: req.params.id });

    if (!deletedAssistente)
      return res.status(404).json({ message: "Assistente não encontrado" });
    res.json({ message: "Assistente deletado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.clone = async (req, res) => {
  const { id } = req.params;
  try {
    const assistente = await Assistente.findById(id);
    const prompts = await Prompt.find({ assistente: id });

    const novoAssistente = new Assistente({
      descricao: assistente.descricao,
      nome: assistente.nome + " (copia)",
    });

    await novoAssistente.save();

    prompts.forEach((prompt) => {
      const newPrompt = new Prompt({
        assistente: novoAssistente.id,
        codigo: prompt.codigo,
        tipo: prompt.tipo,
        conteudo: prompt.conteudo,
        descricao: prompt.descricao,
        ordem: prompt.ordem,
      });

      newPrompt.save();
    });

    res.status(200).json({ message: "Prompt clonado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.readAllCST = async (req, res) => {
  try {
    const assistentes = await Assistente.find({
      nome: { $regex: "CST", $options: "i" },
    });

    res.json(assistentes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
