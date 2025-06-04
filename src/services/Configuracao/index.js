const Configuracao = require("../../models/configuracao");

const getConfiguracoes = async ({ baseOmie, tenant }) => {
  const configuracoes = await Configuracao.find({
    $or: [
      { baseOmie: baseOmie._id, tenant },
      { baseOmie: null, tenant },
    ],
  });
  return configuracoes;
};

module.exports = {
  getConfiguracoes,
};
