const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GatilhosSchema = new Schema(
  {
    kanbanOmie: {
      type: String,
      enum: ["OrdemServiço", "PedidoVenda"],
      required: true,
    },
    baseOmie: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "BaseOmie",
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
    },
    etapaGeracao: {
      type: String,
    },
    etapaProcessado: {
      type: String,
    },
    etapaErro: {
      type: String,
    },
    enviarEmail: {
      type: Boolean,
      default: false,
    },
    templateAssuntoEmail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
    },
    templateCorpoEmail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
    },
    templateDocumento: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
    },
    adiantamento: {
      type: Boolean,
      default: false,
    },
    categoria: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Gatilhos = mongoose.model("Gatilhos", GatilhosSchema);

module.exports = Gatilhos;
