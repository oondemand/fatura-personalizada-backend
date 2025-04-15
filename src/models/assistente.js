const mongoose = require("mongoose");

const assistenteSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    descricao: {
      type: String,
      trim: true,
    },
    modelo: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assistente", assistenteSchema);
