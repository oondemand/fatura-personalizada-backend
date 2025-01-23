const express = require("express");
const router = express.Router();

const usuarioController = require("../controllers/usuarioController");
const tenantController = require("../controllers/tenantController");

const authMiddleware = require("../middlewares/authMiddleware");

router.post("/registrar-usuario", usuarioController.registrarPrimeiroUsuario);
router.post("/login", usuarioController.loginUsuario);
router.get("/validar-token", authMiddleware, usuarioController.validarToken);

router.post("/registrar-tenant", tenantController.createTenant);
router.post("/primeiro-acesso", usuarioController.primeiroAcesso);

module.exports = router;
