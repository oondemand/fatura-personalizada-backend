const tenant = require("../models/tenant");
const Tenant = require("../models/tenant");
const Usuario = require("../models/usuario");

const { seedUtils } = require("../utils/seed");

exports.createTenant = async (req, res) => {
  const { nome } = req.body;
  try {
    const tenant = await Tenant.findOne({ nome });
    if (tenant) {
      return res
        .status(400)
        .json({ error: "Já existe uma tenant com esse nome." });
    }
    const newTenant = new Tenant(req.body);

    await newTenant.save();

    const adminUsers = await Usuario.find({ tipo: "admin" });

    for (const usuario of adminUsers) {
      usuario.tenants = [...usuario.tenants, { tenant: newTenant._id }];
      await usuario.save();
    }

    seedUtils.gerarConfiguracoesPadrao({ tenantId: newTenant._id });

    return res.status(201).json(newTenant);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Não foi possível criar tenant" });
  }
};

exports.listTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find();
    return res.status(200).json(tenants);
  } catch (error) {
    return res.status(400).json({ message: "Não foi possível listar tenants" });
  }
};

exports.atualizarTenant = async (req, res) => {
  const { nome } = req.body;
  try {
    const updatedFiles = {};
    if (nome) updatedFiles.nome = nome;

    const tenant = await Tenant.findByIdAndUpdate(req.params.id, updatedFiles);
    if (!tenant)
      return res.status(404).json({ error: "Tenant não encontrada" });
    res.status(200).json(tenant);
  } catch (error) {
    res.status(400).json({ error: "Erro ao atualizar tenant" });
  }
};

exports.excluirTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);
    if (!tenant)
      return res.status(404).json({ error: "Tenant não encontrada" });
    res.status(200).json(tenant);
  } catch (error) {
    res.status(400).json({ error: "Erro ao excluir tenant" });
  }
};

exports.readOne = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant)
      return res.status(404).json({ error: "Tenant não encontrada" });
    res.status(200).json(tenant);
  } catch (error) {
    res.status(400).json({ error: "Erro ao buscar tenant" });
  }
};
