const { CRMOmie } = require("../omie/crmService");

const processarOportunidade = async ({
  baseOmie,
  gatilho,
  oportunidade,
  observacao,
}) => {
  console.log("🔄 Processando oportunidade");
  const etapaProcessado = gatilho.etapaProcessado;

  const oportunidadeAlterada = await CRMOmie.montarOportunidadeAlterado({
    etapa: etapaProcessado,
    observacao,
    oportunidade,
  });

  await CRMOmie.alterarOportunidade({
    baseOmie,
    oportunidade: oportunidadeAlterada,
  });
};

module.exports = { processarOportunidade };
