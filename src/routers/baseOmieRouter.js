const express = require('express');
const baseOmieController = require('../controllers/baseOmieController');

const router = express.Router();

// Rotas para BaseOmie
router.post('/', baseOmieController.create);
router.get('/', baseOmieController.readAll);
router.get('/:id', baseOmieController.readOne);
router.patch('/:id', baseOmieController.update);
router.delete('/:id', baseOmieController.delete);

module.exports = router;
