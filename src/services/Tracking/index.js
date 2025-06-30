const DocumentoTracking = require("../../models/documentoTracking");

async function iniciarRastreamento({ tenant, kanban, ...rest }) {
  const tracking = new DocumentoTracking({
    tenant,
    kanban,
    dataInicioProcessamento: new Date(),
    status: "processando",
    ...rest,
  });

  return await tracking.save();
}

async function atualizarRastreamento({
  id,
  template,
  emailUsuarioOmie,
  variaveisOmieCarregadas,
  documentoGerado,
  documentoAnexadoOmie,
  emailEnviado,
  emailsDestinatarios,
  adiantamentoGerado,
  ...rest
}) {
  return await DocumentoTracking.findByIdAndUpdate(
    id,
    {
      template,
      emailUsuarioOmie,
      variaveisOmieCarregadas,
      documentoGerado,
      documentoAnexadoOmie,
      emailEnviado,
      emailsDestinatarios,
      adiantamentoGerado,
      ...rest,
    },
    { new: true }
  );
}

async function concluirRastreamento({ id, status, detalhesErro, ...rest }) {
  const dataConclusao = new Date();
  const tracking = await DocumentoTracking.findById(id);
  const tempoProcessamento = dataConclusao - tracking.dataInicioProcessamento;

  tracking.status = status;
  tracking.dataConclusao = dataConclusao;
  tracking.tempoProcessamento = tempoProcessamento;
  if (status === "sucesso") tracking.processamentoConcluido = true;
  if (detalhesErro) tracking.detalhesErro = detalhesErro;

  return await tracking.save();
}

module.exports = {
  iniciarRastreamento,
  atualizarRastreamento,
  concluirRastreamento,
};
