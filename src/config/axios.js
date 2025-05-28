const axios = require("axios");
const Log = require("../models/log");

function createAxiosInstanceComLogs(axiosConfig = {}) {
  const instance = axios.create(axiosConfig);

  instance.interceptors.request.use((config) => {
    config.metadata = {
      startTime: new Date(),
      contexto: config.contexto || {},
    };

    return config;
  });

  instance.interceptors.response.use(
    async (response) => {
      const { startTime, contexto } = response.config.metadata;
      const tempoResposta = new Date() - startTime;

      const log = new Log({
        usuario: contexto.usuario || null,
        tenant: contexto.tenant || null,
        endpoint: response.config.url,
        metodo: response.config.method.toUpperCase(),
        ip: contexto.ip || "servidor",
        dadosRequisicao: response.config.data || null,
        dadosResposta: response.data,
        statusResposta: response.status,
        tempoResposta,
      });

      try {
        await log.save();
        console.log("📤 Log de requisição externa salvo com sucesso");
      } catch (err) {
        console.error("❌ Erro ao salvar log externo:", err);
      }

      return response;
    },
    async (error) => {
      const { startTime, contexto } = error.config?.metadata || {};
      const tempoResposta = new Date() - (startTime || new Date());

      const log = new Log({
        usuario: contexto?.usuario || null,
        tenant: contexto?.tenant || null,
        endpoint: error.config?.url,
        metodo: error.config?.method?.toUpperCase(),
        ip: contexto?.ip || "servidor",
        dadosRequisicao: error.config?.data || null,
        dadosResposta: {
          erro: error?.message,
          dados: error?.response?.data,
        },
        statusResposta: error?.response?.status || 500,
        tempoResposta,
      });

      try {
        await log.save();
        console.log("📤 Log de erro externo salvo com sucesso");
      } catch (err) {
        console.error("❌ Erro ao salvar log de erro externo:", err);
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

module.exports = createAxiosInstanceComLogs;
