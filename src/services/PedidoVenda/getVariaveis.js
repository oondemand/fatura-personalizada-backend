const { PedidoVendaOmie } = require("../omie/pedidoVenda");
const clienteService = require("../omie/clienteService");
const paisesService = require("../omie/paisesService");

const getVariaveisOmie = async ({ baseOmie, nPedido }) => {
  const pedido = await PedidoVendaOmie.consultarPedidoVenda({
    baseOmie,
    nPedido,
  });

  const cliente = await clienteService.consultarCliente(
    baseOmie,
    pedido.pedido_venda_produto.cabecalho.codigo_cliente
  );

  const paises = await paisesService.consultarPais(
    baseOmie,
    cliente.codigo_pais
  );

  cliente.pais = paises.lista_paises[0].cDescricao;

  return { pedido, cliente };
};

module.exports = { getVariaveisOmie };
