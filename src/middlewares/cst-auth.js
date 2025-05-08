const jwt = require("jsonwebtoken");

const authCstMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Acesso não autorizado. Token ausente." });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    console.log("Erro ao verificar o token:", error);
    return res.status(401).json({ error: "Token inválido." });
  }
};

module.exports = authCstMiddleware;
