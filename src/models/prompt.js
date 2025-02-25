const mongoose = require("mongoose");

const PromptSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
  },
  codigo: {
    type: String,
  },
  descricao: { type: String },
  conteudo: {
    type: String,
  },
  tipo: {
    type: String,
    enum: ["assistant", "function", "system", "tool", "user"],
    default: "user",
  },
  assistente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assistente",
    required: true,
  },
  ordem: { type: Number },
});

const Prompt = mongoose.model("Prompt", PromptSchema);

module.exports = Prompt;
