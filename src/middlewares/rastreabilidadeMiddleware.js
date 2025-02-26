const Log = require("../models/log");

const rastreabilidadeMiddleware = async (req, res, next) => {
  // Verifica se o método da requisição é GET e ignora se for
  if (req.method === "GET") {
    return next();
  }

  // Extrair informações da requisição
  const usuarioId = req.usuario ? req.usuario._id : null; // Pega o ID do usuário autenticado pelo token
  const endpoint = req.originalUrl; // A URL completa
  const metodo = req.method; // O método HTTP (GET, POST, etc.)
  const ip =
    req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress; // IP do cliente
  const dadosRequisicao = req.body; // O corpo da requisição

  // Capturar as informações da resposta usando `res.on()`
  const log = new Log({
    usuario: usuarioId,
    endpoint: endpoint,
    metodo: metodo,
    ip: ip,
    dadosRequisicao: dadosRequisicao,
    tenant: req.tenant,
  });

  // Interceptar o status e o corpo da resposta
  const originalSend = res.send;

  res.send = function (body) {
    log.statusResposta = res.statusCode; // Captura o status da resposta
    log.dadosResposta = body; // Captura o corpo da resposta

    // Salva o log no banco de dados
    log
      .save()
      .then(() => console.log("Log de rastreabilidade salvo com sucesso"))
      .catch((error) =>
        console.error("Erro ao salvar log de rastreabilidade:", error)
      );

    // Retorna a resposta original
    originalSend.apply(res, arguments);
  };

  // Continua para o próximo middleware ou controlador
  next();
};

module.exports = rastreabilidadeMiddleware;
