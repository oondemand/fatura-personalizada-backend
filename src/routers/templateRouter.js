const express = require('express');
const templateController = require('../controllers/templateController');

const router = express.Router();

// Rotas para Template
router.post('/', templateController.create);
router.get('/', templateController.readAll);
router.get('/:id', templateController.readOne);
router.patch('/:id', templateController.update);
router.delete('/:id', templateController.delete);

module.exports = router;