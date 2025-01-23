const mongoose = require("mongoose");

const TenantSchema = new mongoose.Schema({
  nome: { type: String, required: true },
});

module.exports = mongoose.model("Tenant", TenantSchema);
