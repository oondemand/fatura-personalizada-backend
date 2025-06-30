const axios = require("../config/axios");
const mongoose = require("mongoose");
const { getCotacao } = require("../utils/moeda");

const MoedaSchema = new mongoose.Schema({
  simbolo: { type: String, unique: true, required: true },
  tipoCotacao: {
    type: String,
    enum: ["cotacao", "porcentagem", "valorFixo"],
    default: "cotacao",
  },
  valor: { type: Number },
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

MoedaSchema.methods.getValor = async function () {
  let valorFinal;
  const cotacao = await getCotacao(this.simbolo);

  switch (this.tipoCotacao) {
    case "cotacao":
      valorFinal = cotacao.cotacaoCompra;
      break;
    case "porcentagem":
      valorFinal = cotacao.cotacaoCompra * (this.valor / 100);
      break;
    case "valorFixo":
      valorFinal = this.valor;
      break;
  }

  valorFinal = valorFinal.toFixed(4);

  return { valorCotacao: cotacao.cotacaoVenda, valorFinal };
};

const Moeda = mongoose.models.Moeda || mongoose.model("Moeda", MoedaSchema);

module.exports = Moeda;
