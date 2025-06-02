const Gatilho = require("../models/gatilho");

exports.createGatilho = async (req, res) => {
  try {
    const gatilho = new Gatilho({ ...req.body, tenant: req.tenant });
    const savedGatilho = await gatilho.save();
    res.status(201).json(savedGatilho);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllGatilhos = async (req, res) => {
  try {
    const gatilhos = await Gatilho.find({ tenant: req.tenant });
    res.status(200).json(gatilhos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGatilhoById = async (req, res) => {
  try {
    const gatilho = await Gatilho.findById(req.params.id);
    if (!gatilho) {
      return res.status(404).json({ message: "Gatilho não encontrado" });
    }
    res.status(200).json(gatilho);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateGatilho = async (req, res) => {
  try {
    const updatedGatilho = await Gatilho.findByIdAndUpdate(
      req.params.id,
      { ...req.body, tenant: req.tenant },
      { new: true }
    );
    if (!updatedGatilho) {
      return res.status(404).json({ message: "Gatilho não encontrado" });
    }
    res.status(200).json(updatedGatilho);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteGatilho = async (req, res) => {
  try {
    const deletedGatilho = await Gatilho.findByIdAndDelete(req.params.id);
    if (!deletedGatilho) {
      return res.status(404).json({ message: "Gatilho não encontrado" });
    }
    res.status(200).json({ message: "Gatilho deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
