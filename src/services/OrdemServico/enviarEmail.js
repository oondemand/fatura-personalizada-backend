const { getConfig } = require("../../utils/config");
const { sendEmail } = require("../../utils/emailSender");

const anexoService = require("../omie/anexoService");

const enviarEmail = async (
  authOmie,
  os,
  cliente,
  renderedAssunto,
  renderedCorpo,
  tenant,
  gatilho
) => {
  if (!gatilho.enviarEmail) {
    console.log("Envio de email desativado");
    return;
  }

  console.log("Enviando email");

  const emailFrom = {
    email: await getConfig("email-from", authOmie.appKey, tenant),
    nome: await getConfig("email-from-nome", authOmie.appKey, tenant),
  };

  const emailCopia = await getConfig("email-copia", authOmie.appKey, tenant);

  const emails = [
    cliente?.email,
    emailCopia,
    ...(os?.Email?.cEnviarPara?.split(",") || []),
  ];

  const anexos = await anexoService.listarAnexoBuffer(
    authOmie,
    os.Cabecalho.nCodOS
  );

  if (!emails?.length > 0) throw new Error("Email não informado");

  console.log(`Destinatários: ${emails}`);
  await sendEmail(emailFrom, emails, renderedAssunto, renderedCorpo, anexos);

  return emails.join(", ");
};

module.exports = {
  enviarEmail,
};
