const express = require('express');
const { listarClientes, filtroClientes,actualizarCliente } = require('../controllers/clientes');
const router = express.Router();

router.get('/', listarClientes);
router.post('/filtro', filtroClientes);
router.put ("/:id",actualizarCliente)

module.exports = router;
