const DocumentoTracking = require("../../models/documentoTracking");
const { atualizarRastreamento, concluirRastreamento } = require("./index");

const TrackingService = async ({ tenant, kanban, ...rest }) => {
  const tracking = new DocumentoTracking({
    tenant,
    kanban,
    dataInicioProcessamento: new Date(),
    status: "processando",
    ...rest,
  });

  await tracking.save();

  console.log(`🔄 Iniciando rastreamento: ${tracking._id}`);

  const finalizarRastreamentoComSucesso = async () => {
    await concluirRastreamento({
      id: tracking._id,
      status: "sucesso",
    });
  };

  const finalizarRastreamentoComFalha = async ({ detalhesErro }) => {
    await concluirRastreamento({
      id: tracking._id,
      status: "falha",
      detalhesErro,
    });
  };

  const carregarVariaveisOmie = {
    iniciar: () => {
      return atualizarRastreamento({
        id: tracking._id,
        variaveisOmieCarregadas: false,
      });
    },
    finalizar: () => {
      return atualizarRastreamento({
        id: tracking._id,
        variaveisOmieCarregadas: true,
      });
    },
  };

  const gerarDocumento = {
    iniciar: () => {
      return atualizarRastreamento({
        id: tracking._id,
        documentoGerado: false,
      });
    },
    finalizar: () => {
      return atualizarRastreamento({
        id: tracking._id,
        documentoGerado: true,
      });
    },
  };

  const anexarDocumentoOmie = {
    iniciar: () => {
      return atualizarRastreamento({
        id: tracking._id,
        documentoAnexadoOmie: false,
      });
    },
    finalizar: () => {
      return atualizarRastreamento({
        id: tracking._id,
        documentoAnexadoOmie: true,
      });
    },
  };

  const enviarEmail = {
    iniciar: () => {
      return atualizarRastreamento({
        id: tracking._id,
        emailEnviado: false,
      });
    },
    finalizar: ({ emailsDestinatarios }) => {
      return atualizarRastreamento({
        id: tracking._id,
        emailEnviado: true,
        emailsDestinatarios,
      });
    },
  };

  const gerarAdiantamento = {
    iniciar: () => {
      return atualizarRastreamento({
        id: tracking._id,
        adiantamentoGerado: true,
      });
    },
    finalizar: () => {
      return atualizarRastreamento({
        id: tracking._id,
        adiantamentoGerado: false,
      });
    },
  };

  return {
    finalizarRastreamentoComSucesso,
    finalizarRastreamentoComFalha,
    carregarVariaveisOmie,
    gerarDocumento,
    anexarDocumentoOmie,
    enviarEmail,
    gerarAdiantamento,
  };
};

module.exports = TrackingService;
