const mongoose = require("mongoose");

const TemplateSchema = new mongoose.Schema({
  codigo: String,
  descricao: String,
  templateEjs: String,
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  status: {
    type: String,
    enum: ["ativo", "inativo", "arquivado"],
    default: "ativo",
  },
  omieVar: {
    type: JSON,
  },
});

const Template =
  mongoose.models.Template ||
  mongoose.model("Template", TemplateSchema, "templates");

module.exports = Template;
