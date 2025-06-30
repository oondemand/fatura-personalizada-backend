const { apiOmie } = require("../../config/apiOmie");

const formatarFasesOmie = ({ fases }) => {
  if (!fases || !Array.isArray(fases)) return [];

  const map = new Map();

  fases?.forEach((item) => {
    // Concatena a descrição caso o código seja igual, mas descricao seja diferente
    if (map.has(item.nCodigo?.toString())) {
      const descricao = item?.cDescrUsuario || item?.cDescrPadrao;
      const existente = map.get(item.nCodigo?.toString());

      if (descricao === existente?.descricao) return;
      if (existente?.descricao.includes(descricao)) return;

      map.set(item.nCodigo?.toString(), {
        codigo: item.nCodigo?.toString(),
        descricao: `${existente?.descricao} - ${descricao}`,
      });

      return;
    }

    map.set(item.nCodigo?.toString(), {
      codigo: item.nCodigo?.toString(),
      descricao: item?.cDescrUsuario || item?.cDescrPadrao,
    });
  });

  return { CRM: Array.from(map.values()) };
};

const listarFases = async ({ baseOmie }) => {
  const body = {
    call: "ListarFases",
    app_key: baseOmie.appKey,
    app_secret: baseOmie.appSecret,
    param: [{ pagina: 1, registros_por_pagina: 900 }],
  };

  try {
    const response = await apiOmie.post("crm/fases/", body);
    return response.data;
  } catch (error) {
    console.error(`Erro ao listar fases: ${error}`);
    throw error;
  }
};

module.exports = { listarFases, formatarFasesOmie };
