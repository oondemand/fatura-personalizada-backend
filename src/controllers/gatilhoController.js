const Gatilho = require("../models/gatilho");
const { sendPaginatedResponse } = require("../utils/helpers");

exports.createGatilho = async (req, res) => {
  try {
    const gatilho = new Gatilho({ ...req.body, tenant: req.tenant });
    const savedGatilho = await gatilho.save();
    res.status(201).json(savedGatilho);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllGatilhosComPaginacao = async (req, res) => {
  try {
    const { sortBy, pageIndex, pageSize, searchTerm, tipo, ...rest } =
      req.query;

    const page = parseInt(pageIndex) || 0;
    const limite = parseInt(pageSize) || 10;
    const skip = page * limite;

    const queryResult = {
      tenant: req.tenant,
    };

    const [gatilhos, totalDeGatilhos] = await Promise.all([
      Gatilho.find(queryResult)
        .skip(skip)
        .limit(limite)
        .sort({ createdAt: -1 }),
      Gatilho.countDocuments(queryResult),
    ]);

    sendPaginatedResponse({
      res,
      statusCode: 200,
      results: gatilhos,
      pagination: {
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limite),
        totalItems: totalDeGatilhos,
        totalPages: Math.ceil(totalDeGatilhos / limite),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
