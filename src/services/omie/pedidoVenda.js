const { apiOmie } = require("../../config/apiOmie");

exports.PedidoVendaOmie = {
  consultarPedidoVenda: async ({ baseOmie, codPedido }) => {
    const body = {
      call: "ConsultarPedido",
      app_key: baseOmie.appKey,
      app_secret: baseOmie.appSecret,
      param: [{ codigo_pedido: codPedido }],
    };

    try {
      const response = await apiOmie.post("produtos/pedido/", body);
      return response.data;
    } catch (error) {
      console.error(`Erro ao consultar pedido: ${error}`);
      throw error;
    }
  },

  trocarEtapaPedidoVenda: async ({
    baseOmie,
    codPedido,
    etapa,
    observacao,
  }) => {
    const body = {
      call: "AlterarPedidoVenda",
      app_key: baseOmie.appKey,
      app_secret: baseOmie.appSecret,
      param: [
        {
          Cabecalho: {
            codigo_pedido: codPedido,
            etapa: etapa,
          },
          Observacoes: {
            obs_venda: observacao,
          },
        },
      ],
    };

    try {
      const response = await apiOmie.post("produtos/pedido/", body);
      return response.data;
    } catch (error) {
      console.error(`Erro ao trocar etapa do pedido ${error}`);
      throw error;
    }
  },

  alterarPedidoVenda: async ({ baseOmie, pedido }) => {
    const body = {
      call: "AlterarPedidoVenda",
      app_key: baseOmie.appKey,
      app_secret: baseOmie.appSecret,
      param: [pedido],
    };

    try {
      const response = await apiOmie.post("produtos/pedido/", body);
      return response.data;
    } catch (error) {
      console.error(`Erro ao alterar pedido : ${error}`);
      throw error;
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
