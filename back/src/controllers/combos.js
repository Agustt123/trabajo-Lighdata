const pool = require('../db/connection');

async function listarCombos(req, res) {
    try {
        const [rows] = await pool.query(
            'SELECT combos.id, combos.nombre, ' +
            'GROUP_CONCAT(DISTINCT materiales.nombre SEPARATOR ", ") AS materiales, ' +
            'GROUP_CONCAT(DISTINCT clientes.nombre SEPARATOR ", ") AS clientes ' +
            'FROM combos ' +
            'LEFT JOIN materiales_combos ON combos.id = materiales_combos.combo_id ' +
            'LEFT JOIN materiales ON materiales.id = materiales_combos.material_id ' +
            'LEFT JOIN cliente_material ON materiales.id = cliente_material.material_id ' +
            'LEFT JOIN clientes ON cliente_material.cliente_id = clientes.id ' +
            'GROUP BY combos.id'
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar combos' });
    }
}


async function crearCombo(req, res) {
    try {
        const { nombre, materiales } = req.body; 
        const result = await pool.query('INSERT INTO combos (nombre) VALUES (?)', [nombre]);
        const comboId = result[0].insertId;

        for (const material of materiales) {
            await pool.query(
                'INSERT INTO materiales_combos (combo_id, material_id, cantidad) VALUES (?, ?, ?)',
                [comboId, material.materialId, material.cantidad]
            );
        }

        res.json({ id: comboId });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear combo' });
    }
}

module.exports = { listarCombos, crearCombo };
