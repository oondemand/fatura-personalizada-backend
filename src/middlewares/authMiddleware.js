const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario");

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Acesso não autorizado. Token ausente." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = await Usuario.findById(decoded.id)
      .select("-senha")
      .populate("tenants.tenant");

    if (!req.usuario) {
      return res.status(401).json({ error: "Usuário não encontrado." });
    }

    req.tenant = req.headers?.tenant;

    next();
  } catch (error) {
    console.log("Erro ao verificar o token:", error);
    return res.status(401).json({ error: "Token inválido." });
  }
};

module.exports = authMiddleware;
