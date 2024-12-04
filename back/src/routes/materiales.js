const express = require('express');
const { listarMateriales, crearMaterial, actualizarMaterial, eliminarMaterial } = require('../controllers/materiales');
const router = express.Router();

router.get('/', listarMateriales);
router.post('/', crearMaterial);
router.put('/:id', actualizarMaterial);
router.delete('/:id', eliminarMaterial);

module.exports = router;
