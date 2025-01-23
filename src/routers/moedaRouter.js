const express = require('express');
const moedaController = require('../controllers/moedaController');

const router = express.Router();

// Rotas para Moeda
router.post('/', moedaController.create);
router.get('/', moedaController.readAll);
router.get('/:id', moedaController.readOne);
router.patch('/:id', moedaController.update);
router.delete('/:id', moedaController.delete);

module.exports = router;