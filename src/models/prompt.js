const mongoose = require("mongoose");

const PromptSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
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
