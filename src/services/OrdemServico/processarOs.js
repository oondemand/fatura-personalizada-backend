const osOmie = require("../omie/osService");
const ContaCorrenteService = require("../omie/contaCorrenteService");

const processarOS = async (
  authOmie,
  nCodOS,
  observacao,
  tenant,
  gatilho,
  os
) => {
  console.log("Processando OS", nCodOS);

  const etapaProcessado = gatilho.etapaProcessado;
  const gerarAdiantamento = gatilho.adiantamento;

  const ccAdiamentoCliente =
    await ContaCorrenteService.obterContaAdiamentoCliente({
      omieAuth: authOmie,
      tenant,
    });

  const novaOs = await osOmie.montarOsAlterada(
    authOmie,
    nCodOS,
    etapaProcessado,
    gerarAdiantamento,
    os.InformacoesAdicionais.cCodCateg,
    ccAdiamentoCliente,
    observacao
  );

  await osOmie.alterarOS(authOmie, novaOs);
};

module.exports = {
  processarOS,
};
