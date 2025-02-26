const Moeda = require("../models/moeda");

class MoedaController {
  // Criar uma nova Moeda
  static async create(req, res) {
    const moeda = new Moeda({ ...req.body, tenant: req.tenant });
    try {
      await moeda.save();
      res.status(201).send(moeda);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  // Buscar todas as Moedas
  static async readAll(req, res) {
    try {
      const moedas = await Moeda.find({ ...req.query, tenant: req.tenant });

      const valores = await Promise.all(
        moedas.map((moeda) => moeda.getValor())
      );
      const moedasComValores = moedas.map((moeda, i) => ({
        ...moeda._doc,
        cotacao: valores[i],
      }));
      res.status(200).send(moedasComValores);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  // Buscar uma Moeda por ID
  static async readOne(req, res) {
    try {
      const moeda = await Moeda.findOne({
        _id: req.params.id,
        tenant: req.tenant,
      });
      if (!moeda) return res.status(404).send("Moeda não encontrada");
      const valorCotacao = await moeda.getValor();
      res.status(200).send({ ...moeda._doc, valorCotacao });
    } catch (error) {
      res.status(500).send(error);
    }
  }

  // Atualizar uma Moeda por ID
  static async update(req, res) {
    try {
      const moeda = await Moeda.findOneAndUpdate(
        { _id: req.params.id, tenant: req.tenant },
        req.body,
        {
          new: true,
        }
      );
      if (!moeda) return res.status(404).send("Moeda não encontrada");
      res.status(200).send(moeda);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  // Deletar uma Moeda por ID
  static async delete(req, res) {
    try {
      const moeda = await Moeda.findOneAndDelete({
        _id: req.params.id,
        tenant: req.tenant,
      });
      if (!moeda) return res.status(404).send("Moeda não encontrada");
      res.status(204).send();
    } catch (error) {
      res.status(500).send(error);
    }
  }
}

module.exports = MoedaController;
