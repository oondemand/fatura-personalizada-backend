// backend/controllers/UsuarioController.js

const Usuario = require("../models/usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const emailUtils = require("../utils/emailSender");

// exports.registrarUsuario = async (req, res) => {
//   const { nome, email, senha, status, permissoes, tenants } = req.body;
//   try {
//     // Verifica se há algum usuário ativo no banco de dados
//     const usuarioAtivo = await Usuario.findOne({ status: "ativo" });

//     if (usuarioAtivo) {
//       return res
//         .status(400)
//         .json({ error: "Já existe um usuário ativo no sistema" });
//     }

//     // Cria um novo usuário se não houver nenhum usuário ativo
//     const novoUsuario = new Usuario(req.body);
//     await novoUsuario.save();
//     res.status(201).json(novoUsuario);
//   } catch (error) {
//     res.status(400).json({ error: "Erro ao registrar usuário" });
//   }
// };

exports.registrarPrimeiroUsuario = async (req, res) => {
  const { nome, email, senha, status, permissoes, tenants } = req.body;
  try {
    // Verificar se existe algum usuário ativo
    const usuarioAtivo = await Usuario.findOne({ status: "ativo" });
    if (usuarioAtivo) {
      return res.status(400).json({ error: "Já existe um usuário ativo" });
    }

    // Criar e salvar o novo usuário
    const novoUsuario = new Usuario(req.body);
    await novoUsuario.save();
    res.status(201).json(novoUsuario);
  } catch (error) {
    res.status(400).json({ error: "Erro ao registrar usuário" });
  }
};

exports.registrarUsuario = async (req, res) => {
  const { nome, email, senha, status, permissoes } = req.body;

  const tenants = req.tenant ? [{ tenant: req.tenant }] : [];

  try {
    const usuario = await Usuario.findOne({ email });

    if (usuario) {
      return res
        .status(400)
        .json({ error: "Já existe um usuário cadastrado com esse email." });
    }

    const novoUsuario = new Usuario({
      ...req.body,
      ...tenants,
    });
    await novoUsuario.save();
    res.status(201).json(novoUsuario);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Erro ao registrar usuário" });
  }
};

exports.loginUsuario = async (req, res) => {
  const { email, senha } = req.body;
  try {
    const usuario = await Usuario.findOne({
      email,
    }).populate("tenants.tenant");
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    if (!usuario.status === "ativo") {
      return res.status(403).json({ error: "Usuário inativo" });
    }
    const token = usuario.gerarToken();
    res.json({ token, usuario });
  } catch (error) {
    res.status(400).json({ error: "Erro ao fazer login" });
  }
};

exports.listarUsuarios = async (req, res) => {
  const filter =
    req.usuario.tipo === "master" && !req.tenant
      ? {}
      : {
          "tenants.tenant": { $in: [req.tenant] },
          tipo: { $in: ["padrao", "admin"] },
        };

  try {
    const usuarios = await Usuario.find(filter).select("-senha");
    res.json(usuarios);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Erro ao listar usuários" });
  }
};

exports.obterUsuario = async (req, res) => {
  const filter =
    req.usuario.tipo === "master" && !req.tenant
      ? {}
      : { "tenants.tenant": { $in: [req.tenant] } };

  try {
    const usuario = await Usuario.findOne({
      ...filter,
      _id: req.params.id,
    }).select("-senha");
    if (!usuario)
      return res.status(404).json({ error: "Usuário não encontrado" });
    res.json(usuario);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Erro ao obter usuário" });
  }
};

exports.atualizarUsuario = async (req, res) => {
  const filter =
    req.usuario.tipo === "master" && !req.tenant
      ? {}
      : { "tenants.tenant": { $in: [req.tenant] } };

  try {
    const { senha, ...rest } = req.body;

    // Se a senha foi passada, criptografá-la antes de atualizar
    const updatedFiles = { rest };

    if (senha) {
      const salt = await bcrypt.genSalt(10);
      updatedFiles.senha = await bcrypt.hash(senha, salt);
    }

    const usuario = await Usuario.findOneAndUpdate(
      { ...filter, _id: req.params.id },
      updatedFiles,
      {
        new: true,
      }
    );
    if (!usuario)
      return res.status(404).json({ error: "Usuário não encontrado" });

    res.json(usuario);
  } catch (error) {
    res.status(400).json({ error: "Erro ao atualizar usuário" });
  }
};

exports.excluirUsuario = async (req, res) => {
  const filter =
    req.usuario.tipo === "master" && !req.tenant
      ? {}
      : { "tenants.tenant": { $in: [req.tenant] } };

  try {
    if (req.usuario.tipo === "master" && !req.tenant) {
      await Usuario.findOneAndDelete({
        ...filter,
        _id: req.params.id,
      });

      return res.status(204).send();
    }

    const usuario = await Usuario.findOne({
      ...filter,
      _id: req.params.id,
    });

    if (!usuario)
      return res.status(404).json({ error: "Usuário não encontrado" });

    usuario.tenants = usuario.tenants.filter((e) => e.tenant != req.tenant);
    await usuario.save();

    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Erro ao excluir usuário" });
  }
};

exports.enviarConvite = async (req, res) => {
  try {
    const { email } = req.body;
    const usuario = await Usuario.findOne({ email });

    console.log(usuario);

    if (!usuario) {
      const usuario = new Usuario({
        nome: email,
        email,
        senha: "123456",
        tenants: [{ tenant: req.tenant }],
        status: "processando",
      });

      const token = usuario.gerarToken();

      await usuario.save();

      emailUtils.emailConvidarUsuario({
        email,
        nome: usuario.nome,
        url:
          process.env.FATURA_PERSONALIZADA_CLIENT +
          "/primeiro-acesso?code=" +
          token,
      });

      return res.status(200).send(usuario);
    }

    const usuarioComTenant = usuario.tenants.some(
      (e) => e.tenant == req.tenant
    );

    if (!usuarioComTenant) {
      usuario.tenants = [...usuario.tenants, { tenant: req.tenant }];
      await usuario.save();
    }

    emailUtils.emailConvidarUsuario({
      email,
      nome: usuario.nome,
      url: process.env.FATURA_PERSONALIZADA_CLIENT + "/login",
    });

    res.status(200).send(usuario);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Erro ao convidar usuário" });
  }
};

exports.primeiroAcesso = async (req, res) => {
  const { novaSenha, confirmacao, code, nome } = req.body;

  if (!code || !novaSenha || !confirmacao || !nome) {
    return res.status(404).json({ message: "Dados incompletos" });
  }

  if (novaSenha !== confirmacao) {
    return res
      .status(400)
      .json({ message: "A senha precisa ser igual a confirmação" });
  }

  try {
    const decoded = jwt.verify(code, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id).populate(
      "tenants.tenant"
    );

    usuario.nome = nome;
    usuario.senha = novaSenha;
    usuario.status = "ativo";

    await usuario.save();

    const token = usuario.gerarToken();
    return res.status(200).json({ token, usuario });
  } catch (error) {
    res.status(500);
  }
};

// Função para validar o token e retornar os dados do usuário
exports.validarToken = async (req, res) => {
  try {
    // Se o middleware `protect` passou, `req.user` já está preenchido
    res.json(req.usuario);
  } catch (error) {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
};
