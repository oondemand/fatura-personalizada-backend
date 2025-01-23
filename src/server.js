require("dotenv").config();


const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 4000;
const SERVICE_NAME = process.env.SERVICE_NAME || "MeuServico";

// Inicia o servidor
app.listen(PORT, async () => {
  const chalk = await import("chalk").then(mod => mod.default);
  console.log("");
  
  console.log(chalk.yellow(`******** Iniciando serviço ${SERVICE_NAME} ********`));
  console.log("");

  try {
    await connectDB(); // Conecta ao banco de dados

    console.log(`Serviço iniciado`);
    console.log("");
    console.log(chalk.green(`****** ${SERVICE_NAME} rodando na porta ${PORT} ******`));
  } catch (err) {
    console.error("Erro ao iniciar o serviço:", err);
  }
});