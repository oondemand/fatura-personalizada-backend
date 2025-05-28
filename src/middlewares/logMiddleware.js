const Log = require("../models/log");

function rastreabilidadeMiddleware(req, res, next) {
  if (req.method === "GET") return next();

  const inicioRequisicao = Date.now();
  const { method, originalUrl, body, usuario, tenant } = req;
  const ip =
    req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  const originalJson = res.json;
  const originalSend = res.send;
  let responseBody;

  res.json = function (body) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  res.send = function (body) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.on("finish", async () => {
    const tempoResposta = Date.now() - inicioRequisicao;

    const log = new Log({
      usuario: usuario?._id || null,
      endpoint: originalUrl,
      metodo: method,
      ip,
      dadosRequisicao: body,
      tenant,
      statusResposta: res?.statusCode,
      dadosResposta: responseBody,
      tempoResposta: tempoResposta.toFixed(2), // tempo em milissegundos
    });

    log
      .save()
      .then(() => {
        console.log("📝 Log de rastreabilidade salvo com sucesso");
      })
      .catch(() => {
        console.error("❌ Erro ao salvar log de rastreabilidade");
      });
  });

  next();
}

module.exports = rastreabilidadeMiddleware;
