const express = require('express');
const includeController = require('../controllers/includeController');

const router = express.Router();

// Rotas para Include
router.post('/', includeController.create);
router.get('/', includeController.readAll);
router.get('/:id', includeController.readOne);
router.patch('/:id', includeController.update);
router.delete('/:id', includeController.delete);

module.exports = router;