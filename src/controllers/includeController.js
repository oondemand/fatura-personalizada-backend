const Include = require("../models/include");

class IncludeController {
  // Criar um novo Include
  static async create(req, res) {
    const include = new Include({ ...req.body, tenant: req.tenant });
    try {
      await include.save();
      res.status(201).send(include);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  // Buscar todos os Includes
  static async readAll(req, res) {
    try {
      const includes = await Include.find({ ...req.query, tenant: req.tenant });
      res.status(200).send(includes);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  // Buscar um Include por ID
  static async readOne(req, res) {
    try {
      const include = await Include.findOne({
        _id: req.params.id,
        tenant: req.tenant,
      });
      if (!include) return res.status(404).send("Include não encontrado");
      res.status(200).send(include);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  // Atualizar um Include por ID
  static async update(req, res) {
    try {
      const include = await Include.findOneAndUpdate(
        { _id: req.params.id, tenant: req.tenant },
        req.body,
        { new: true }
      );
      if (!include) return res.status(404).send("Include não encontrado");
      res.status(200).send(include);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  // Deletar um Include por ID
  static async delete(req, res) {
    try {
      const include = await Include.findOneAndDelete(req.params.id);
      if (!include) return res.status(404).send("Include não encontrado");
      res.status(200).send("Include deletado");
    } catch (error) {
      res.status(500).send(error);
    }
  }
}

module.exports = IncludeController;
