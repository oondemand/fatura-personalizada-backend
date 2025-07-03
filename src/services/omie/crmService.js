const { apiOmie } = require("../../config/apiOmie");

exports.CRMOmie = {
  consultarOportunidade: async ({ baseOmie, nCodOp }) => {
    const body = {
      call: "ConsultarOportunidade",
      app_key: baseOmie.appKey,
      app_secret: baseOmie.appSecret,
      param: [{ nCodOp: nCodOp, cCodIntOp: "" }],
    };
    try {
      const response = await apiOmie.post("crm/oportunidades/", body);
      return response.data;
    } catch (error) {
      console.error(`Erro ao consultar oportunidade: ${error}`);
      throw error;
    }
  },

  consultarConta: async ({ baseOmie, nCod }) => {
    const body = {
      call: "ConsultarConta",
      app_key: baseOmie.appKey,
      app_secret: baseOmie.appSecret,
      param: [{ nCod }],
    };
    try {
      const response = await apiOmie.post("crm/contas/", body);
      return response.data;
    } catch (error) {
      console.log(`Erro ao consultar conta: ${error}`);
      throw error;
    }
  },

  consultarContato: async ({ baseOmie, nCod }) => {
    const body = {
      call: "ConsultarContato",
      app_key: baseOmie.appKey,
      app_secret: baseOmie.appSecret,
      param: [{ nCod, cCodInt: "" }],
    };
    try {
      const response = await apiOmie.post("crm/contatos/", body);
      return response.data;
    } catch (error) {
      console.log(`Erro ao consultar contato: ${error}`);
      throw error;
    }
  },

  listarSolucoes: async ({ baseOmie }) => {
    const body = {
      call: "ListarSolucoes",
      app_key: baseOmie.appKey,
      app_secret: baseOmie.appSecret,
      param: [{ pagina: 1, registros_por_pagina: 1000 }],
    };
    try {
      const response = await apiOmie.post("crm/solucoes/", body);
      return response.data;
    } catch (error) {
      console.log(`Erro ao listar soluções: ${error}`);
      throw error;
    }
  },

  trocarEtapaOportunidade: async ({ baseOmie, nCodOp, etapa, observacao }) => {
    try {
      const body = {
        call: "AlterarOportunidade",
        app_key: baseOmie.appKey,
        app_secret: baseOmie.appSecret,
        param: [
          {
            identificacao: {
              nCodOp: nCodOp,
              cCodIntOp: "",
            },
            fasesStatus: {
              nCodFase: etapa,
            },
          },
        ],
      };

      const response = await apiOmie.post("crm/oportunidades/", body);
      console.log("Etapa do oportunidade alterada com sucesso,");
      return response.data;
    } catch (error) {
      console.log("ERROR:", error);
      //falhar silenciosamente
      // console.log("Error ao trocar etapa do oportunidade.", error);
    }
  },

  alterarOportunidade: async ({ baseOmie, oportunidade }) => {
    try {
      const body = {
        call: "AlterarOportunidade",
        app_key: baseOmie.appKey,
        app_secret: baseOmie.appSecret,
        param: [oportunidade],
      };

      const response = await apiOmie.post("crm/oportunidades/", body);
      return response.data;
    } catch (error) {
      console.log(`Erro ao alterar oportunidade: ${error}`);
      throw `Erro ao alterar oportunidade: ${error}`;
    }
  },

  montarOportunidadeAlterado: async ({ oportunidade, etapa, observacao }) => {
    const oportunidadeAlterado = {
      identificacao: {
        nCodOp: oportunidade.identificacao.nCodOp,
        cCodIntOp: "",
      },
      fasesStatus: {
        nCodFase: etapa,
      },
    };

    return oportunidadeAlterado;
  },
};
