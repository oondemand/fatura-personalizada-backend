const Template = require("../../models/template");

const getTemplates = async ({ tenant, gatilho }) => {
  const { templateDocumento, templateAssuntoEmail, templateCorpoEmail } =
    gatilho;

  try {
    const [fatura, emailAssunto, emailCorpo] = await Promise.all([
      Template.findOne({ _id: templateDocumento, tenant }),
      Template.findOne({ _id: templateAssuntoEmail, tenant }),
      Template.findOne({ _id: templateCorpoEmail, tenant }),
    ]);

    if (!fatura || !emailAssunto || !emailCorpo) {
      throw new Error(
        "Um ou mais templates obrigatórios não foram encontrados."
      );
    }

    return {
      fatura: fatura.templateEjs,
      emailAssunto: emailAssunto.templateEjs,
      emailCorpo: emailCorpo.templateEjs,
    };
  } catch (error) {
    console.error("❌ Erro ao carregar templates:", error);
    throw new Error("Erro ao buscar templates do gatilho.");
  }
};

module.exports = {
  getTemplates,
};
