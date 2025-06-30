const mongoose = require("mongoose");

const DocumentoTrackingSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["processando", "sucesso", "falha"],
      default: "processando",
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
    },
    kanban: {
      type: String,
      enum: ["OrdemServico", "PedidoVenda", "CRM"],
      required: true,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
    },
    emailUsuarioOmie: String,
    variaveisOmieCarregadas: { type: Boolean },
    documentoGerado: { type: Boolean },
    documentoAnexadoOmie: { type: Boolean },
    emailEnviado: { type: Boolean },
    processamentoConcluido: { type: Boolean },
    emailsDestinatarios: [String],
    adiantamentoGerado: { type: Boolean },
    dataInicioProcessamento: { type: Date, default: Date.now },
    dataConclusao: Date,
    tempoProcessamento: Number, // em milissegundos
    detalhesErro: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("DocumentTracking", DocumentoTrackingSchema);
