const mongoose = require("mongoose");

// Verificar o ambiente atual
const isProduction = process.env.NODE_ENV === "production";

// Selecionar a configuração correta
const config = {
  dbServer: process.env.DB_SERVER,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  dbAuthSource: process.env.DB_AUTH_SOURCE,
  dbReplicaSet: process.env.DB_REPLICA_SET,
  dbTls: process.env.DB_TLS,
};

let mongoUri = `${config.dbServer}/${config.dbName}?`;
if (config.dbAuthSource) mongoUri += `authSource=${config.dbAuthSource}&`;
if (config.dbTls) mongoUri += `tls=true&`;
if (config.dbReplicaSet) mongoUri += `replicaSet=${config.dbReplicaSet}&`;

// Remove o último '&' se existir
mongoUri = mongoUri.endsWith("&") ? mongoUri.slice(0, -1) : mongoUri;

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri, {
      user: config.dbUser,
      pass: config.dbPassword,
    });
    console.log(`Conectado ao MongoDB`);
    console.log(` - Server: ${config.dbServer}`);
    console.log(` - Database: ${config.dbName}`);
  } catch (err) {
    console.error(`Erro ao conectar ao MongoDB ${config.dbName}`, err);
    process.exit(1); // Encerra o processo com falha
  }
};

module.exports = connectDB;
