const { default: axios } = require("axios");
const mongoose = require("mongoose");

const getCotacao = async (moeda) => {
  let date = new Date();
  let cotacao = null;

  while (!cotacao) {
    let dataCotacao = date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    const response = await axios.get(
      `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='${moeda}'&@dataCotacao='${dataCotacao}'&$top=100&$format=json&$select=paridadeCompra,paridadeVenda,cotacaoCompra,cotacaoVenda,dataHoraCotacao,tipoBoletim`
    );

    cotacao = response.data.value.find((cotacao) => cotacao.tipoBoletim === "Fechamento PTAX");

    // Se a cotação ainda for nula, reduza a data em 1 dia
    if (!cotacao) {
      date.setDate(date.getDate() - 1);
    }
  }

  return cotacao;
};

const MoedaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  simbolo: { type: String, required: true },
  tipoCotacao: {
    type: String,
    enum: ["cotacao", "porcentagem", "valorFixo"],
    required: true,
  },
  valor: { type: Number, required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
  status: {
    type: String,
    enum: ["ativo", "inativo", "arquivado"],
    default: "ativo",
  },
});

MoedaSchema.methods.getValor = async function () {
  let valorFinal;
  const cotacao = await getCotacao(this.simbolo);

  switch (this.tipoCotacao) {
    case "cotacao":
      valorFinal = cotacao.cotacaoCompra;
      break;
    case "porcentagem":
      valorFinal = cotacao.cotacaoCompra * (this.valor / 100);
      break;
    case "valorFixo":
      valorFinal = this.valor;
      break;
  }

  valorFinal = valorFinal.toFixed(4);

  return { valorCotacao: cotacao.cotacaoVenda, valorFinal };
};

const Moeda = mongoose.models.Moeda || mongoose.model("Moeda", MoedaSchema);

module.exports = Moeda;