require("dotenv").config();
const client = require("@sendgrid/mail");

const sendgridAppKey = process.env.SENDGRID_API_KEY;
client.setApiKey(sendgridAppKey);

const sendEmail = async (emailFrom, emailTo, subject, body, attachments) => {
  //verificar e remover emails duplicados
  emailTo = emailTo
    .split(",")
    .map((email) => email.trim())
    .filter((email, index, self) => email && self.indexOf(email) === index)
    .join(",");

  const message = {
    personalizations: [
      {
        to: emailTo.split(",").map((email) => ({
          email: email.trim(),
        })),
      },
    ],
    from: {
      email: emailFrom.email,
      name: emailFrom.nome,
    },
    subject: subject,
    content: [
      {
        type: "text/html",
        value: body,
      },
    ],
    attachments: attachments.map(({ filename, fileBuffer }) => ({
      content: fileBuffer.toString("base64"),
      filename: filename,
      disposition: "attachment",
    })),
  };

  try {
    return await client.send(message);
  } catch (error) {
    console.log(error);
    throw new Error("Erro ao enviar e-mail");
  }
};

const enviarEmail = async (emailFrom, emailTo, assunto, corpo, anexos = []) => {
  const message = {
    from: {
      email: emailFrom.email,
      name: emailFrom.nome,
    },
    personalizations: [
      {
        to: [
          {
            email: emailTo.email,
            name: emailTo.nome,
          },
        ],
        subject: assunto,
      },
    ],
    content: [
      {
        type: "text/html",
        value: corpo,
      },
    ],
    attachments: anexos.map(({ filename, fileBuffer }) => ({
      content: fileBuffer.toString("base64"),
      filename: filename,
      disposition: "attachment",
    })),
  };

  try {
    const retorno = await client.send(message);
    return retorno;
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    throw new Error("Erro ao enviar e-mail");
  }
};

const emailConvidarUsuario = async ({ email, nome, url }) => {
  try {
    const emailFrom = {
      email: process.env.EMAIL_REMETENTE,
      nome: "OonDemand",
    };

    const emailTo = {
      email,
      nome,
    };

    const assunto = "Acesso Liberado";

    const corpo = `<h1>Olá, ${nome}!</h1>
    <p>Segue o link para acessar o app doc custom:</p>
    <a href="${url}">Acessar doc custom</a>`;

    return await enviarEmail(emailFrom, emailTo, assunto, corpo);
  } catch (error) {
    console.error("Erro ao enviar e-mail de convite", error);
    throw new Error("Erro ao enviar e-mail de convite");
  }
};

module.exports = { sendEmail, emailConvidarUsuario };
