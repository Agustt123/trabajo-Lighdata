const pool = require('../db/connection');

async function listarMateriales(req, res) {
    try {
        // Realizamos la consulta para obtener los materiales con los clientes asociados
        const [rows] = await pool.query(`
            SELECT 
                materiales.id AS material_id, 
                materiales.nombre AS material_nombre, 
                materiales.sku, 
                materiales.ean, 
                materiales.descripcion, 
                materiales.foto, 
                clientes.id AS cliente_id, 
                clientes.nombre AS cliente_nombre
            FROM 
                materiales
            LEFT JOIN 
                cliente_material ON materiales.id = cliente_material.material_id
            LEFT JOIN 
                clientes ON cliente_material.cliente_id = clientes.id
        `);

        // Devolvemos los resultados en formato JSON
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar materiales con clientes' });
    }
}

async function crearMaterial(req, res) {
    const connection = await pool.getConnection();
    try {
        // Extraemos los datos del cuerpo de la solicitud
        const { nombre, sku, ean, descripcion, foto, tipo, ids } = req.body;

        // Comenzamos la transacción
        await connection.beginTransaction();

        // Insertamos el nuevo material en la tabla 'materiales'
        const [result] = await connection.query(
            'INSERT INTO materiales (nombre, sku, ean, descripcion, foto) VALUES (?, ?, ?, ?, ?)',
            [nombre, sku, ean, descripcion, foto]
        );

        const materialId = result.insertId;

 
        if (!ids || ids.length === 0) {
            throw new Error('Debe proporcionar al menos un ID de cliente');
        }

        const clienteMaterialValues = ids.map(clienteId => [clienteId, materialId]);
        await connection.query(
            'INSERT INTO cliente_material (cliente_id, material_id) VALUES ?',
            [clienteMaterialValues]
        );

       
        await connection.commit();

        res.json({ id: materialId });
    } catch (error) {
        
        await connection.rollback();
        res.status(500).json({ error: `Error al crear material: ${error.message}` });
    } finally {
       
        connection.release();
    }
}



async function actualizarMaterial(req, res) {
    try {
        const { id } = req.params;
        const { nombre, sku, ean, descripcion, foto } = req.body;
        await pool.query(
            'UPDATE materiales SET nombre = ?, sku = ?, ean = ?, descripcion = ?, foto = ? WHERE id = ?',
            [nombre, sku, ean, descripcion, foto, id]
        );
        res.json({ message: 'Material actualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar material' });
    }
}

async function eliminarMaterial(req, res) {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM materiales WHERE id = ?', [id]);
        res.json({ message: 'Material eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar material' });
    }
}

module.exports = { listarMateriales, crearMaterial, actualizarMaterial, eliminarMaterial };
