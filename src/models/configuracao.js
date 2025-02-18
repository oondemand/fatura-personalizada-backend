const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ConfiguracaoSchema = new Schema(
  {
    nome: {
      type: String,
    },
    codigo: {
      type: String,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
    },
    valor: {
      type: mongoose.Schema.Types.Mixed,
    },
    baseOmie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseOmie",
    },
  },
  {
    timestamps: true,
  }
);

const Configuracoes = mongoose.model("Configuracoes", ConfiguracaoSchema);

module.exports = Configuracoes;
