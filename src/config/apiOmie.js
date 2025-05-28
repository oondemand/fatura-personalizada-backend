const axios = require("../config/axios");

const apiOmie = axios({
  baseURL: process.env.OMIE_API_URL,
  timeout: 30000, // tempo limite em milissegundos
  headers: {
    "Content-Type": "application/json",
  },
});

module.exports = { apiOmie };
