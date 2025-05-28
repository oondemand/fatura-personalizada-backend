const axios = require("../../config/axios");
const { promisify } = require("util");
const { format } = require("date-fns");

const { compactFile } = require("../../utils/fileHandler");
const { apiOmie } = require("../../config/apiOmie");
const logger = require("../../config/logger");
const sleep = promisify(setTimeout);

const anexoService = {
  incluirAnexoInvoiceOS: async (omieAuth, os, arquivo) => {
    try {
      console.log("Incluindo anexo na OS ", os.Cabecalho.nCodOS);
      const dataAtual = format(new Date(), "yyyy-MM-dd_HHmm");
      const nomeArquivo = `invoice-${os.Cabecalho.cNumOS}_${dataAtual}.pdf`;

      return await anexoService.incluirAnexo(
        omieAuth,
        "ordem-servico",
        os.Cabecalho.nCodOS,
        nomeArquivo,
        "pdf",
        arquivo
      );
    } catch (error) {
      logger.error(
        `Erro ao incluir anexo na OS ${os.Cabecalho.cNumOS}: ${error.message}`
      );
      console.error(
        `Erro ao incluir anexo na OS ${os.Cabecalho.cNumOS}: ${error.message}`
      );
      throw error;
    }
  },

  incluirAnexo: async (
    omieAuth,
    tabela,
    id,
    nomeArquivo,
    tipoArquivo,
    arquivo
  ) => {
    try {
      const arquivoCompactado = await compactFile(arquivo, nomeArquivo);

      const param = {
        cCodIntAnexo: "",
        cTabela: tabela,
        nId: id,
        cNomeArquivo: nomeArquivo,
        cTipoArquivo: tipoArquivo,
        cArquivo: arquivoCompactado.base64File,
        cMd5: arquivoCompactado.md5,
      };

      const body = {
        call: "IncluirAnexo",
        app_key: omieAuth.appKey,
        app_secret: omieAuth.appSecret,
        param: [param],
      };

      const response = await apiOmie.post("geral/anexo/", body);

      console.log("...");
      await sleep(3000);

      console.log("Anexo incluído com sucesso!");

      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao incluir anexo na tabela ${tabela} com ID ${id}: ${error.message}`
      );
      console.error(
        `Erro ao incluir anexo na tabela ${tabela} com ID ${id}: ${error.message}`
      );
      console.error(`URL: ${error.config?.url}`);
      console.error(
        `Corpo da Requisição: ${JSON.stringify(error.config?.data)}`
      );
      console.error(
        `Corpo da Resposta: ${JSON.stringify(error.response?.data)}`
      );
      console.error(`Código do Erro: ${error.code}`);
      throw error;
    }
  },

  listarAnexo: async (omieAuth, tabela, id) => {
    try {
      const param = {
        nPagina: 1,
        nRegPorPagina: 50,
        nId: id,
        cTabela: tabela,
      };

      const body = {
        call: "ListarAnexo",
        app_key: omieAuth.appKey,
        app_secret: omieAuth.appSecret,
        param: [param],
      };

      const response = await apiOmie.post("geral/anexo/", body);
      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao listar anexos na tabela ${tabela} com ID ${id}: ${error.message}`
      );
      console.error(
        `Erro ao listar anexos na tabela ${tabela} com ID ${id}: ${error.message}`
      );
      // throw error;
    }
  },

  obterAnexo: async (omieAuth, cTabela, nId, nIdAnexo) => {
    try {
      const param = {
        cTabela: cTabela,
        nId: nId,
        nIdAnexo: nIdAnexo,
      };

      const body = {
        call: "ObterAnexo",
        app_key: omieAuth.appKey,
        app_secret: omieAuth.appSecret,
        param: [param],
      };

      const response = await apiOmie.post("geral/anexo/", body);
      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao obter anexo na tabela ${cTabela} com ID ${nId} e ID do anexo ${nIdAnexo}: ${error.message}`
      );
      console.error(
        `Erro ao obter anexo na tabela ${cTabela} com ID ${nId} e ID do anexo ${nIdAnexo}: ${error.message}`
      );
      // throw error;
    }
  },

  listarAnexoBuffer: async (omieAuth, id) => {
    try {
      const anexos = await anexoService.listarAnexo(
        omieAuth,
        "ordem-servico",
        id
      );
      if (!anexos || !anexos.listaAnexos) return [];

      const listaAnexos = anexos.listaAnexos;

      const listaAnexosBuffer = await Promise.all(
        listaAnexos.map(async (anexo) => {
          try {
            const anexoOmie = await anexoService.obterAnexo(
              omieAuth,
              anexo.cTabela,
              anexo.nId,
              anexo.nIdAnexo
            );

            const { cNomeArquivo, cLinkDownload } = anexoOmie;

            const resposta = await axios.get(cLinkDownload, {
              responseType: "arraybuffer",
            });
            const fileBuffer = Buffer.from(resposta.data);

            return {
              filename: cNomeArquivo,
              fileBuffer: fileBuffer,
            };
          } catch (error) {
            logger.error(
              `Erro ao obter buffer do anexo ${anexo.nIdAnexo} da OS ${id}: ${error.message}`
            );
            console.error(
              `Erro ao obter buffer do anexo ${anexo.nIdAnexo} da OS ${id}: ${error.message}`
            );
            throw error;
          }
        })
      );

      return listaAnexosBuffer;
    } catch (error) {
      console.error(
        `Erro ao listar buffers de anexos da OS ${id}: ${error.message}`
      );
      throw error;
    }
  },
};

module.exports = anexoService;
