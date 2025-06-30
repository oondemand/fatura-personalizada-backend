const { PedidoVendaOmie } = require("../omie/pedidoVenda");

const processarPedido = async ({ baseOmie, gatilho, pedido, observacao }) => {
  console.log("🔄 Processando pedido");
  const etapaProcessado = gatilho.etapaProcessado;

  const pedidoAlterado = await PedidoVendaOmie.montarPedidoVendaAlterado({
    etapa: etapaProcessado,
    observacao,
    pedido,
  });

  await PedidoVendaOmie.alterarPedidoVenda({
    baseOmie,
    pedido: pedidoAlterado,
  });
};

module.exports = {
  processarPedido,
};
