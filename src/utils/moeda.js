const axios = require("../config/axios");

exports.getCotacao = async (moeda) => {
  if (!moeda || typeof moeda !== "string") {
    throw new Error("Parâmetro 'moeda' é obrigatório e deve ser uma string.");
  }

  let date = new Date();
  const maxTentativas = 30; //equivalente a 30 dias
  let tentativas = 0;

  while (tentativas < maxTentativas) {
    try {
      let dataCotacao = date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });

      const response = await axios({}).get(
        `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='${moeda}'&@dataCotacao='${dataCotacao}'&$top=100&$format=json&$select=paridadeCompra,paridadeVenda,cotacaoCompra,cotacaoVenda,dataHoraCotacao,tipoBoletim`,
        { timeout: 5000 }
      );

      if (response) {
        cotacao = response.data.value.find(
          (cotacao) => cotacao.tipoBoletim === "Fechamento PTAX"
        );

        if (cotacao) {
          return cotacao;
        }
      }
    } catch (error) {
      console.error(`Erro ao buscar cotação para '${moeda}'.`, error.message);
      throw new Error(
        `Erro ao buscar cotação para '${moeda}'. Tente novamente mais tarde.`,
        error.message
      );
    }

    date.setDate(date.getDate() - 1);
    tentativas++;
  }

  throw new Error(
    `Cotação não encontrada para a moeda '${moeda}'. Tente novamente mais tarde..`
  );
};
