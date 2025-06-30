const osOmie = require("../omie/osService");
const clienteService = require("../omie/clienteService");
const paisesService = require("../omie/paisesService");

const getVariaveisOmie = async (authOmie, nCodOS) => {
  const os = await osOmie.consultarOS(authOmie, nCodOS);
  const cliente = await clienteService.consultarCliente(
    authOmie,
    os.Cabecalho.nCodCli
  );
  const paises = await paisesService.consultarPais(
    authOmie,
    cliente.codigo_pais
  );
  cliente.pais = paises.lista_paises[0].cDescricao;

  return { os, cliente };
};

const getVariaveisOmiePorNumero = async (authOmie, numeroOS) => {
  const os = await osOmie.consultarOsPorNumero(authOmie, numeroOS);
  const cliente = await clienteService.consultarCliente(
    authOmie,
    os.Cabecalho.nCodCli
  );
  const paises = await paisesService.consultarPais(
    authOmie,
    cliente.codigo_pais
  );
  cliente.pais = paises.lista_paises[0].cDescricao;

  return { os, cliente };
};

module.exports = {
  getVariaveisOmie,
  getVariaveisOmiePorNumero,
};
