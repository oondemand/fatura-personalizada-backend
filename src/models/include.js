const mongoose = require("mongoose");

const IncludeSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
  },
  tenant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Tenant", 
    required: true 
  },
  codigo: {
    type: String,
    required: true,
  },
  descricao: String,
  conteudo: {
    type: String,
    required: true,
  },
  contenType: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["ativo", "inativo", "arquivado"],
    default: "ativo",
  },
});

const Include = mongoose.models.Include || mongoose.model("Include", IncludeSchema);

module.exports = Include;