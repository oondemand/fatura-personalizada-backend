const { apiOmie } = require("../../config/apiOmie");

const formatarEtapasOmie = ({ etapas }) => {
  if (!etapas || !Array.isArray(etapas)) return [];

  const map = new Map();

  etapas?.forEach((element) => {
    element?.etapas?.forEach((item) => {
      if (item?.cInativo === "S") return;

      // Concatena a descrição caso o código seja igual, mas descricao seja diferente
      if (map.has(item.cCodigo)) {
        const descricao = item?.cDescricao || item?.cDescrPadrao;
        const existente = map.get(item.cCodigo);

        if (descricao === existente?.descricao) return;
        if (existente?.descricao.includes(descricao)) return;

        map.set(item.cCodigo, {
          codigo: item.cCodigo,
          descricao: `${existente?.descricao} - ${descricao}`,
        });

        return;
      }

      map.set(item.cCodigo, {
        codigo: item.cCodigo,
        descricao: item?.cDescricao || item?.cDescrPadrao,
      });
    });
  });

  return Array.from(map.values());
};

const agruparEtapasFormatadasPorKanban = ({ etapas }) => {
  if (!etapas || !Array.isArray(etapas)) return [];

  const ETAPA_KEY_KANBAN_MAP = {
    OrdemServico: "Venda de Serviço",
    PedidoVenda: "Venda de Produto",
  };

  const result = Object.entries(ETAPA_KEY_KANBAN_MAP).map(
    ([kanban, cDescOperacao]) => {
      return {
        [kanban]: formatarEtapasOmie({
          etapas: etapas.filter((e) => e.cDescOperacao === cDescOperacao),
        }),
      };
    }
  );

  return result;
};

const listarEtapasFaturamento = async ({ baseOmie }) => {
  const body = {
    call: "ListarEtapasFaturamento",
    app_key: baseOmie.appKey,
    app_secret: baseOmie.appSecret,
    param: [{ pagina: 1, registros_por_pagina: 900 }],
  };

  try {
    const response = await apiOmie.post("produtos/etapafat/", body);
    return response.data;
  } catch (error) {
    console.error(`Erro ao listar etapas: ${error}`);
    throw error;
  }
};

module.exports = { listarEtapasFaturamento, agruparEtapasFormatadasPorKanban };
