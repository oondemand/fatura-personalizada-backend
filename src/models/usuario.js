// backend/models/Usuario.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const tenantSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
  permissoes: { type: [String], default: [] },
});

const UsuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  tipo: {
    type: String,
    enum: ["admin", "admin-tenant", "usuario"],
    default: "usuario",
  },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  tenants: { type: [tenantSchema] },
  status: {
    type: String,
    enum: ["ativo", "inativo", "arquivado", "processando"],
    default: "ativo",
  },
});

UsuarioSchema.pre("save", async function (next) {
  if (!this.isModified("senha")) return next();
  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
  next();
});

UsuarioSchema.methods.gerarToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

module.exports = mongoose.model("Usuario", UsuarioSchema);
