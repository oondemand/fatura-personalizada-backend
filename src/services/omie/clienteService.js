const { apiOmie } = require("../../config/apiOmie");
const logger = require("../../config/logger");

const clienteService = {
  consultarCliente: async (omieAuth, codCliente) => {
    const body = {
      call: "ConsultarCliente",
      app_key: omieAuth.appKey,
      app_secret: omieAuth.appSecret,
      param: [{ codigo_cliente_omie: codCliente }],
    };

    try {
      const response = await apiOmie.post("geral/clientes/", body);
      return response.data;
    } catch (error) {
      logger.error(`Erro ao consultar cliente ${codCliente}: ${error.message}`);
      console.error(`Erro ao consultar cliente ${codCliente}: ${error.message}`);
      throw error;
    }
  },
};

module.exports = clienteService;
