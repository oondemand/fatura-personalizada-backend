const { apiOmie } = require("../../config/apiOmie");

const ContaCorrenteService = {
  obterContaAdiamentoCliente: async ({ omieAuth, tenant }) => {
    try {
      const body = {
        call: "ListarContasCorrentes",
        app_key: omieAuth.appKey,
        app_secret: omieAuth.appSecret,
        param: [
          {
            pagina: 1,
            registros_por_pagina: 900,
            apenas_importado_api: "N",
          },
        ],
      };

      const { data } = await apiOmie.post("geral/contacorrente/", body);

      const ccAdiamentoCliente = data.ListarContasCorrentes.find(
        (e) => e.codigo_banco === "ADC"
      );

      if (ccAdiamentoCliente.inativo !== "N")
        throw new Error(
          "A conta corrente adiantamento do cliente esta inativa!"
        );

      return ccAdiamentoCliente.nCodCC;
    } catch (error) {
      console.error(
        `Ouve um erro ao obter conta corrente [Adiamento do Cliente], erro: ${error}`
      );

      throw error;
    }
  },
};

module.exports = ContaCorrenteService;
