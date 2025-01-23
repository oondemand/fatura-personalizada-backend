const express = require('express');
const logController = require('../controllers/logController');
const router = express.Router();

// Rota para buscar os logs de rastreabilidade
router.get('/rastreabilidade', logController.getRastreabilidadeLogs);
router.delete('/limpar', logController.limparLogs);

module.exports = router;
