const { getConfig } = require("../../utils/config");
const EmailSender = require("../../utils/emailSender");
const AnexoService = require("../../services/omie/anexoService");
const anexoService = require("../../services/omie/anexoService");

const enviarEmail = async ({
  baseOmie,
  tenant,
  pedido,
  cliente,
  anexo,
  assunto,
  corpo,
}) => {
  const emailFrom = {
    email: await getConfig("email-from", baseOmie.appKey, tenant),
    nome: await getConfig("email-from-nome", baseOmie.appKey, tenant),
  };

  const emailCopia = await getConfig("email-copia", baseOmie.appKey, tenant);

  const emails = [
    cliente?.email,
    emailCopia,
    ...(pedido?.informacoes_adicionais?.utilizar_emails?.split(",") || []),
  ];

  if (!emails?.length > 0) throw new Error("Email não informado");

  console.log(`🛩️ Enviando email! Destinatários: ${emails}`);

  const anexos = await anexoService.listarAnexoBuffer(
    authOmie,
    os.Cabecalho.nCodOS
  );

  await EmailSender.sendEmail(emailFrom, emails, assunto, corpo, anexos);
  return emails.join(", ");
};

module.exports = {
  enviarEmail,
};


