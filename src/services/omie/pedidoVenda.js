const { apiOmie } = require("../../config/apiOmie");

exports.PedidoVendaOmie = {
  consultarPedidoVenda: async ({ baseOmie, nPedido }) => {
    const body = {
      call: "ConsultarPedido",
      app_key: baseOmie.appKey,
      app_secret: baseOmie.appSecret,
      param: [{ numero_pedido: nPedido }],
    };

    try {
      const response = await apiOmie.post("produtos/pedido/", body);
      return response.data;
    } catch (error) {
      console.error(`Erro ao consultar pedido: ${error}`);
      throw error;
    }
  },

  trocarEtapaPedidoVenda: async ({ baseOmie, nPedido, etapa, observacao }) => {
    try {
      const body = {
        call: "AlterarPedidoVenda",
        app_key: baseOmie.appKey,
        app_secret: baseOmie.appSecret,
        param: [
          {
            Cabecalho: {
              numero_pedido: nPedido,
              etapa: etapa,
            },
            Observacoes: {
              obs_venda: observacao,
            },
          },
        ],
      };

      const response = await apiOmie.post("produtos/pedido/", body);
      return response.data;
    } catch (error) {
      //falhar silenciosamente
      // console.log("Error ao trocar etapa do pedido.", error);
    }
  },

  alterarPedidoVenda: async ({ baseOmie, pedido }) => {
    try {
      const body = {
        call: "AlterarPedidoVenda",
        app_key: baseOmie.appKey,
        app_secret: baseOmie.appSecret,
        param: [pedido],
      };

      console.log("--- Alterando pedido:", body);

      const response = await apiOmie.post("produtos/pedido/", body);
      return response.data;
    } catch (error) {
      console.log(`Erro ao alterar pedido: ${error}`);
      throw `Erro ao alterar pedido: ${error}`;
    }
  },

  montarPedidoVendaAlterado: async ({ pedido, etapa, observacao }) => {
    const pedidoAlterado = {
      Cabecalho: {
        codigo_pedido: pedido.pedido_venda_produto?.cabecalho?.codigo_pedido,
        etapa: etapa,
      },
      Observacoes: {
        obs_venda: observacao,
      },
    };

    return pedidoAlterado;
  },
};
