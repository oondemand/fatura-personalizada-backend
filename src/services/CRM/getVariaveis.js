const { CRMOmie } = require("../omie/crmService");

const getVariaveisOmie = async ({ baseOmie, nCodOp }) => {
  const oportunidade = await CRMOmie.consultarOportunidade({
    baseOmie,
    nCodOp,
  });

  const conta = await CRMOmie.consultarConta({
    baseOmie,
    nCod: oportunidade.identificacao.nCodConta,
  });

  const contato = await CRMOmie.consultarContato({
    baseOmie,
    nCod: oportunidade.identificacao.nCodContato,
  });

  const solucoes = await CRMOmie.listarSolucoes({
    baseOmie,
  });

  return { oportunidade, conta, contato, solucoes };
};

module.exports = {
  getVariaveisOmie,
};
