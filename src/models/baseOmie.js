const mongoose = require("mongoose");

const BaseOmieSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cnpj: { type: String, required: true },
  appKey: { type: String, required: true },
  appSecret: { type: String, required: true },
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
});

module.exports = mongoose.model("BaseOmie", BaseOmieSchema);
