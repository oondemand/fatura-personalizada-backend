const Configuracoes = require("../models/configuracao");
const BaseOmie = require("../models/baseOmie");

async function getConfig(codigo, appKey, tenant) {
  try {
    let baseOmie = null;
    if (appKey) {
      baseOmie = await BaseOmie.findOne({ appKey, tenant });

      if (!baseOmie)
        throw new Error(`BaseOmie com appKey ${appKey} não encontrada`);
    }

    let configuracao = await Configuracoes.findOne({
      codigo,
      baseOmie: baseOmie ? baseOmie._id : null,
      tenant,
    });

    if (!configuracao)
      configuracao = await Configuracoes.findOne({
        codigo,
        baseOmie: null,
        tenant,
      });

    if (!configuracao) return null;

    return configuracao.valor;
  } catch (error) {
    console.error(`Erro ao buscar configuração: ${error.message}`);
    throw error;
  }
}

module.exports = { getConfig };
