const pool = require('../db/connection');

async function listarClientes(req, res) {
    try {
        // Realizar una consulta JOIN para obtener clientes junto con sus ecommerce asociados
        const [rows] = await pool.query(`
            SELECT clientes.id AS cliente_id, clientes.nombre AS cliente_nombre,
                ecommerces.id AS ecommerce_id, ecommerces.tipo_ecommerce, ecommerces.url, 
                ecommerces.sku, ecommerces.ean, ecommerces.actualizastock
            FROM clientes
            LEFT JOIN ecommerces ON clientes.id = ecommerces.cliente_id
        `);

        // Organizar los datos para que cada cliente tenga su lista de ecommerce
        const clientesConEcommerces = rows.reduce((acc, row) => {
            // Si el cliente ya está en el acumulador, agregamos el ecommerce
            let cliente = acc.find(c => c.cliente_id === row.cliente_id);
            
            if (!cliente) {
                // Si el cliente no existe, lo agregamos con sus ecommerces
                cliente = {
                    cliente_id: row.cliente_id,
                    cliente_nombre: row.cliente_nombre,
                    ecommerces: []
                };
                acc.push(cliente);
            }

            // Si hay un ecommerce para este cliente, lo agregamos
            if (row.ecommerce_id) {
                cliente.ecommerces.push({
                    ecommerce_id: row.ecommerce_id,
                    tipo_ecommerce: row.tipo_ecommerce,
                    url: row.url,
                    sku: row.sku,
                    ean: row.ean,
                    actualizastock: row.actualizastock
                });
            }

            return acc;
        }, []);

        // Devolver la respuesta con los clientes y sus ecommerce
        res.json(clientesConEcommerces);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar clientes' });
    }
}


async function filtroClientes(req, res) {
    try {
        console.log("holaaaaaa");
        const { tipo, ids } = req.body;  
        let query = 'SELECT * FROM clientes';  
    
        if (tipo === 'todos_menos') {
            query += ` WHERE id NOT IN (${ids.join(',')})`;  
        } else if (tipo === 'solo_estos') {
            query += ` WHERE id IN (${ids.join(',')})`; 
        }

        const [rows] = await pool.query(query);  
        res.json(rows); 
    } catch (error) {
        res.status(500).json({ error: 'Error al filtrar clientes' }); 
    }
}
async function actualizarCliente(req, res) {
    const { ecommerces } = req.body;

    // Verificamos que se haya pasado un array de ecommerces
    if (!Array.isArray(ecommerces) || ecommerces.length === 0) {
        return res.status(400).json({ error: 'Se debe proporcionar un array de ecommerces' });
    }

    // Obtenemos una conexión del pool
    const connection = await pool.getConnection();

    try {
        // Iniciar transacción
        await connection.beginTransaction();

        for (const ecommerce of ecommerces) {
            const { id, cliente_id, url, sku, ean, link } = ecommerce;

            // Aseguramos que los datos del ecommerce sean válidos
            if (!id || !url || !sku || !ean || link === undefined || !cliente_id) {
                return res.status(400).json({ error: 'Faltan datos para uno de los ecommerces' });
            }

            // Realizamos la actualización de los datos del ecommerce, incluyendo el link
            const [result] = await connection.query(`
                UPDATE ecommerces
                SET url = ?, sku = ?, ean = ?, link = ?
                WHERE id = ? AND cliente_id = ?
            `, [url, sku, ean, link, id, cliente_id]);

            // Si no se actualizó ninguna fila, indicamos que no se encontró el ecommerce
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: `Ecommerce con ID ${id} no encontrado o cliente_id incorrecto` });
            }
        }

        // Confirmar la transacción
        await connection.commit();
        res.json({ message: 'Ecommerces actualizados correctamente' });

    } catch (error) {
        // Si ocurre un error, revertir la transacción
        await connection.rollback();
        res.status(500).json({ error: 'Error al actualizar los ecommerces', details: error.message });
    } finally {
        // Liberar la conexión para que vuelva al pool
        connection.release();
    }
}




module.exports = { listarClientes, filtroClientes,actualizarCliente};
