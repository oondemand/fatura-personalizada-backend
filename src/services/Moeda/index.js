const Moeda = require("../../models/moeda");

const listarMoedasComCotacao = async ({ tenant }) => {
  const moedas = await Moeda.find({ tenant });

  const moedasComCotacao = await Promise.all(
    moedas.map(async (moeda) => {
      const cotacao = await moeda.getValor();
      return {
        simbolo: moeda.simbolo,
        tipoCotacao: moeda.tipoCotacao,
        valor: moeda.valor,
        status: moeda.status,
        cotacao: cotacao.valorCotacao,
        valorFinal: cotacao.valorFinal,
      };
    })
  );

  return moedasComCotacao;
};

module.exports = {
  listarMoedasComCotacao,
};
