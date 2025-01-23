const BaseOmie = require("../models/baseOmie");
const Configuracao = require("../models/configuracao");

class baseOmieController {
  // Criar um novo registro BaseOmie
  static async create(req, res) {
    const baseOmie = new BaseOmie({ ...req.body, tenant: req.tenant });
    try {
      await baseOmie.save();
      res.status(201).send(baseOmie);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  // Buscar todos os registros BaseOmie
  static async readAll(req, res) {
    try {
      const basesOmie = await BaseOmie.find({ tenant: req.tenant });
      res.status(200).send(basesOmie);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  // Buscar um registro BaseOmie por ID
  static async readOne(req, res) {
    try {
      const baseOmie = await BaseOmie.findOne({
        _id: req.params.id,
        tenant: req.tenant,
      });
      if (!baseOmie)
        return res.status(404).send("Registro BaseOmie não encontrado");
      res.status(200).send(baseOmie);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  // Atualizar um registro BaseOmie por ID
  static async update(req, res) {
    try {
      const baseOmie = await BaseOmie.findOneAndUpdate(
        { _id: req.params.id, tenant: req.tenant },
        req.body,
        { new: true }
      );
      if (!baseOmie)
        return res.status(404).send("Registro BaseOmie não encontrado");
      res.status(200).send(baseOmie);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  // Deletar um registro BaseOmie por ID
  static async delete(req, res) {
    try {
      const baseOmie = await BaseOmie.findById(req.params.id);

      if (!baseOmie)
        return res.status(404).send("Registro BaseOmie não encontrado");

      await Configuracao.deleteMany({
        baseOmie: req.params.id,
      });

      await BaseOmie.findOneAndDelete({
        _id: req.params.id,
        tenant: req.tenant,
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).send(error);
    }
  }
}

module.exports = baseOmieController;
