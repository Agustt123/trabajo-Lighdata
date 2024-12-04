const express = require('express');
const { listarCombos, crearCombo } = require('../controllers/combos');
const router = express.Router();

router.get('/', listarCombos);
router.post('/', crearCombo);

module.exports = router;
