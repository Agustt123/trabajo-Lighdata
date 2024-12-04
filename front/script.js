document.addEventListener('DOMContentLoaded', () => {
    // Función para alternar la visibilidad del contenedor de materiales del combo
    document.getElementById('esCombo').addEventListener('change', (e) => {
        const materialesContainer = document.getElementById('materialesContainer');
        if (e.target.checked) {
            materialesContainer.style.display = 'block';
        } else {
            materialesContainer.style.display = 'none';
        }
    });

    // Función para agregar un nuevo campo de material
    document.getElementById('agregarMaterial').addEventListener('click', () => {
        const materialDiv = document.createElement('div');
        materialDiv.className = 'material';
        materialDiv.innerHTML = `
            <label>Nombre:</label>
            <input type="text" name="comboNombre[]" placeholder="Nombre del material" required>
            <label>SKU:</label>
            <input type="text" name="comboSku[]" placeholder="SKU del material" required>
            <label>EAN:</label>
            <input type="text" name="comboEan[]" placeholder="EAN del material" required>
            <label>Descripción:</label>
            <input type="text" name="comboDescripcion[]" placeholder="Descripción del material" required>
            <label>Foto URL:</label>
            <input type="text" name="comboFoto[]" placeholder="URL de la foto" required>
            <label>Cantidad:</label>
            <input type="number" name="comboCantidad[]" min="1" required>
        `;
        document.getElementById('materialesContainer').insertBefore(materialDiv, document.getElementById('agregarMaterial'));
    });

    // Función para manejar el envío del formulario
    document.getElementById('materialForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const nombre = document.getElementById('nombre').value;
        const sku = document.getElementById('sku').value;
        const ean = document.getElementById('ean').value;
        const descripcion = document.getElementById('descripcion').value;
        const foto = document.getElementById('foto').value;
        const esCombo = document.getElementById('esCombo').checked;
        const tipo = document.getElementById('tipo').value;

        let materialResponse;
        let materiales = [];

        // Crear material
        try {
            materialResponse = await fetch('http://localhost:3000/api/materiales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nombre, sku, ean, descripcion, foto,tipo })
            });

            if (!materialResponse.ok) {
                console.error('Error al crear el material');
                return;
            }

            const materialData = await materialResponse.json();
            materiales.push({ materialId: materialData.id, cantidad: 1 });

        } catch (error) {
            console.error('Error en la petición:', error);
            return;
        }

        // Si es combo, crear los materiales adicionales y luego el combo
        if (esCombo) {
            const comboNombres = document.getElementsByName('comboNombre[]');
            const comboSkus = document.getElementsByName('comboSku[]');
            const comboEans = document.getElementsByName('comboEan[]');
            const comboDescripciones = document.getElementsByName('comboDescripcion[]');
            const comboFotos = document.getElementsByName('comboFoto[]');
            const comboCantidades = document.getElementsByName('comboCantidad[]');

            for (let i = 0; i < comboNombres.length; i++) {
                try {
                    const comboMaterialResponse = await fetch('http://localhost:3000/api/materiales', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            
                            sku: comboSkus[i].value,
                            ean: comboEans[i].value,
                            descripcion: comboDescripciones[i].value,
                            foto: comboFotos[i].value
                        })
                    });

                    if (!comboMaterialResponse.ok) {
                        console.error('Error al crear el material del combo');
                        return;
                    }

                    const comboMaterialData = await comboMaterialResponse.json();
                    materiales.push({ materialId: comboMaterialData.id, cantidad: comboCantidades[i].value });
                } catch (error) {
                    console.error('Error en la petición:', error);
                    return;
                }
            }

            try {
                const comboResponse = await fetch('http://localhost:3000/api/combos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nombre, materiales })
                });

                if (!comboResponse.ok) {
                    console.error('Error al crear el combo');
                }
            } catch (error) {
                console.error('Error en la petición:', error);
            }
        }

        // Resetear formulario
        document.getElementById('materialForm').reset();
        document.getElementById('materialesContainer').style.display = 'none';

        fetchMateriales();
    });

    fetchClientes();
    fetchMateriales();
    async function fetchClientes() {
        const response = await fetch('http://localhost:3000/api/clientes');
        const clientes = await response.json();
        const clientesContainer = document.getElementById('clientes-container');
        clientesContainer.innerHTML = ''; // Limpiar el contenedor

        clientes.forEach(cliente => {
            const clienteBox = document.createElement('div');
            clienteBox.classList.add('cliente-box');

            const clienteNombre = document.createElement('h3');
            clienteNombre.textContent = cliente.cliente_nombre;
            clienteBox.appendChild(clienteNombre);

            const tiendaMercadoLibre = document.createElement('input');
            tiendaMercadoLibre.value = cliente.tienda_mercadolibre || '';
            tiendaMercadoLibre.placeholder = 'Nombre de tienda Mercadolibre';
            clienteBox.appendChild(tiendaMercadoLibre);

            cliente.ecommerces.forEach(ecommerce => {
                const linkInput = document.createElement('input');
                linkInput.value = ecommerce.url;
                linkInput.placeholder = 'Link: ' + ecommerce.sku;
                clienteBox.appendChild(linkInput);

                const skuInput = document.createElement('input');
                skuInput.value = ecommerce.sku;
                skuInput.placeholder = 'SKU';
                clienteBox.appendChild(skuInput);

                const eanInput = document.createElement('input');
                eanInput.value = ecommerce.ean;
                eanInput.placeholder = 'EAN';
                clienteBox.appendChild(eanInput);

                const linkAdditionalInput = document.createElement('input');
                linkAdditionalInput.value = ecommerce.link || '';
                linkAdditionalInput.placeholder = 'Link adicional';
                clienteBox.appendChild(linkAdditionalInput);

                const updateStockInput = document.createElement('input');
                updateStockInput.type = 'checkbox';
                updateStockInput.checked = ecommerce.actualizastock === 1;
                const stockLabel = document.createElement('label');
                stockLabel.textContent = 'Actualizar stock';
                clienteBox.appendChild(updateStockInput);
                clienteBox.appendChild(stockLabel);

                const updateButton = document.createElement('button');
                updateButton.textContent = 'Actualizar';
                updateButton.onclick = async () => {
                    if (!linkInput.value || !skuInput.value || !eanInput.value) {
                        alert("Todos los campos son obligatorios.");
                        return;
                    }
                  
                    const updatedEcommerce = {
                        id: ecommerce.ecommerce_id, 
                        cliente_id: cliente.cliente_id, 
                        url: linkInput.value, 
                        sku: skuInput.value, 
                        ean: eanInput.value, 
                        link: linkAdditionalInput.value || null, 
                        actualizastock: updateStockInput.checked ? 1 : 0, 
                    };

                    const updatedCliente = {
                        ecommerces: [updatedEcommerce],
                    };

                    try {
                        const response = await fetch(`http://localhost:3000/api/clientes/${cliente.cliente_id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(updatedCliente),
                        });

                        if (response.ok) {
                            alert('Cliente actualizado con éxito');
                        } else {
                            const errorData = await response.json();
                            alert(`Error: ${errorData.error}`);
                        }
                    } catch (error) {
                        console.error('Error al actualizar cliente:', error);
                    }
                };

                clienteBox.appendChild(updateButton);
            });

            clientesContainer.appendChild(clienteBox);
        });
    }
});
async function fetchMateriales() {
    const response = await fetch('http://localhost:3000/api/materiales');
    const materiales = await response.json();
    const materialesContainer = document.getElementById('materiales-container');
    materialesContainer.innerHTML = ''; // Limpiar el contenedor

    const materialesMap = {};

    materiales.forEach(material => {
        if (!materialesMap[material.material_nombre]) {
            materialesMap[material.material_nombre] = {
                material_nombre: material.material_nombre,
                detalles: [],
                clientes: []
            };
        }

        const exists = materialesMap[material.material_nombre].detalles.some(
            detalle =>
                detalle.sku === material.sku &&
                detalle.ean === material.ean &&
                detalle.descripcion === material.descripcion
        );

        if (!exists) {
            materialesMap[material.material_nombre].detalles.push({
                sku: material.sku,
                ean: material.ean,
                descripcion: material.descripcion,
                foto: material.foto,
            });
        }

        if (material.cliente_nombre) {
            if (!materialesMap[material.material_nombre].clientes.includes(material.cliente_nombre)) {
                materialesMap[material.material_nombre].clientes.push(material.cliente_nombre);
            }
        }
    });

    Object.values(materialesMap).forEach(material => {
        const materialBox = document.createElement('div');
        materialBox.classList.add('material-box');

        const materialNombre = document.createElement('h3');
        materialNombre.textContent = material.material_nombre;
        materialBox.appendChild(materialNombre);

        const clientesDiv = document.createElement('div');
        clientesDiv.classList.add('cliente-names');
        if (material.clientes.length > 0) {
            material.clientes.forEach(cliente => {
                const clienteName = document.createElement('span');
                clienteName.textContent = cliente;
                clientesDiv.appendChild(clienteName);
            });
        } else {
            const noCliente = document.createElement('span');
            noCliente.textContent = 'Sin cliente asignado';
            clientesDiv.appendChild(noCliente);
        }
        materialBox.appendChild(clientesDiv);

        material.detalles.forEach(detalle => {
            const materialInfo = document.createElement('div');
            materialInfo.classList.add('material-info');
            materialInfo.innerHTML = `
                <span><strong>SKU:</strong> ${detalle.sku}</span>
                <span><strong>EAN:</strong> ${detalle.ean}</span>
                <span><strong>Descripción:</strong> ${detalle.descripcion}</span>
                <img src="${detalle.foto}" alt="Foto del material" style="width:100%;max-height:100px;object-fit:cover;">
            `;
            materialBox.appendChild(materialInfo);
        });

        materialesContainer.appendChild(materialBox);
    });
}

// Llamar a la función para cargar los materiales cuando se cargue la página
window.onload = fetchMateriales;
