const fs = require('fs');
const path = require('path');
const pool = require('./connection');

async function loadData() {
  try {
    // Ruta de los archivos JSON
    const clientesPath = path.join(__dirname, '../../data/clientes.json');
    const formularioPath = path.join(__dirname, '../../data/formulario_estructura.json');
    
    // Leer los archivos JSON
    const clientesData = JSON.parse(fs.readFileSync(clientesPath, 'utf-8'));
    const formularioData = JSON.parse(fs.readFileSync(formularioPath, 'utf-8'));

    console.log('Contenido de clientes.json:', clientesData);
    console.log('Contenido de formulario_estructura.json:', formularioData);

    // Verificación de que el archivo es un array
    if (!Array.isArray(clientesData.clientes)) {
      throw new Error('El archivo clientes.json no contiene un array válido.');
    }
    if (!Array.isArray(formularioData.clientes)) {
      throw new Error('El archivo formulario_estructura.json no tiene la estructura correcta.');
    }

    // Eliminar datos existentes en las tablas
    await pool.query('DELETE FROM clientes');
    await pool.query('DELETE FROM ecommerces');

    // Procesar cada cliente en clientes.json
    for (const cliente of clientesData.clientes) {
      // Insertar cliente
      const [clienteResult] = await pool.query(
        'INSERT INTO clientes (id, nombre) VALUES (?, ?)',
        [cliente.id, cliente.nombre]  // Aquí se usa 'id' y 'nombre' del archivo clientes.json
      );

      const clienteId = clienteResult.insertId || cliente.id;

      // Buscar los ecommerces del cliente en formulario_estructura.json
      const clienteEcommerces = formularioData.clientes.find(c => c.didcliente === cliente.id);

      if (clienteEcommerces && Array.isArray(clienteEcommerces.ecommerces)) {
        // Procesar ecommerces del cliente
        for (const ecommerce of clienteEcommerces.ecommerces) {
          const tipo_ecommerce = ecommerce.tienda || 'Sin especificar'; // Usamos 'tienda' como tipo de ecommerce
          const url = ecommerce.link || ''; // Usamos 'link' como url
          const sku = ecommerce.sku || ''; // 'sku'
          const ean = ecommerce.ean || ''; // 'ean'
          const actualizastock = ecommerce.actualizastock !== undefined ? ecommerce.actualizastock : false; // 'actualizastock'

          // Asegurarse de que los valores necesarios no sean nulos o vacíos
          if (tipo_ecommerce && url) {
            // Insertar ecommerces en la tabla
            const [ecommerceResult] = await pool.query(
              'INSERT INTO ecommerces (cliente_id, tipo_ecommerce, url, sku, ean, actualizastock) VALUES (?, ?, ?, ?, ?, ?)',
              [
                clienteId,
                tipo_ecommerce,  // Usamos 'tienda' para tipo_ecommerce
                url,
                sku,
                ean,
                actualizastock
              ]
            );

            const ecommerceId = ecommerceResult.insertId || ecommerce.id;

            // Aquí puedes asociar cada ecommerce con el cliente en la tabla 'clientes'
            await pool.query(
              'UPDATE clientes SET ecommerce_id = ? WHERE id = ?',
              [ecommerceId, clienteId]
            );
          } else {
            console.warn(`Ecommerce incompleto para cliente ${clienteId}: tipo_ecommerce o url faltantes.`);
          }
        }
      }
    }

    console.log('Clientes y ecommerces cargados con éxito.');
  } catch (error) {
    console.error('Error al cargar los datos:', error);
  }
}

module.exports = loadData;
