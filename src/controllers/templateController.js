const Template = require("../models/template");

class TemplateController {
  // Criar um novo Template
  static async create(req, res) {
    const { nome, codigo, descricao, templateEjs, status, omieVar } = req.body;

    // Validação básica dos campos obrigatórios
    if (!nome || !codigo || !templateEjs || !status) {
      return res.status(400).json({
        message: "Nome, Código, TemplateEJS e Status são obrigatórios.",
      });
    }

    const template = new Template({
      nome,
      codigo,
      descricao,
      templateEjs,
      status,
      tenant: req.tenant,
      omieVar,
    });

    try {
      const savedTemplate = await template.save();
      res.status(201).json({
        message: "Template criado com sucesso!",
        template: savedTemplate,
      });
    } catch (error) {
      console.error("Erro ao salvar o template:", error);
      res.status(500).json({
        message: "Erro ao salvar o template.",
        error: error.message,
      });
    }
  }

  // Buscar todos os Templates
  static async readAll(req, res) {
    try {
      const templates = await Template.find({
        ...req.query,
        tenant: req.tenant,
      });
      res.status(200).send(templates);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  // Buscar um Template por ID
  static async readOne(req, res) {
    try {
      const template = await Template.findOne({
        _id: req.params.id,
        tenant: req.tenant,
      });
      if (!template) return res.status(404).send("Template not found");
      res.status(200).send(template);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  // Atualizar um Template por ID
  static async update(req, res) {
    const { nome, codigo, descricao, templateEjs, status, omieVar } = req.body;

    // Validação básica dos campos obrigatórios
    if (!nome && !codigo && !templateEjs && !status) {
      return res.status(400).json({
        message:
          "Pelo menos um dos campos Nome, Código, TemplateEJS ou Status deve ser fornecido.",
      });
    }

    const updateFields = {};
    if (nome) updateFields.nome = nome;
    if (codigo) updateFields.codigo = codigo;
    if (descricao) updateFields.descricao = descricao;
    if (templateEjs) updateFields.templateEjs = templateEjs;
    if (status) updateFields.status = status;
    if (omieVar) updateFields.omieVar = omieVar;

    try {
      const template = await Template.findOneAndUpdate(
        { _id: req.params.id, tenant: req.tenant },
        updateFields,
        { new: true }
      );
      if (!template) {
        return res.status(404).json({
          message: "Template não encontrado.",
        });
      }
      res.status(200).json({
        message: "Template atualizado com sucesso!",
        template: template,
      });
    } catch (error) {
      console.error("Erro ao atualizar o template:", error);
      res.status(500).json({
        message: "Erro ao atualizar o template.",
        error: error.message,
      });
    }
  }

  // Deletar um Template por ID
  static async delete(req, res) {
    try {
      const template = await Template.findOneAndDelete({
        _id: req.params.id,
        tenant: req.tenant,
      });
      if (!template) return res.status(404).send("Template not found");
      res.status(204).send();
    } catch (error) {
      res.status(500).send(error);
    }
  }
}

module.exports = TemplateController;
