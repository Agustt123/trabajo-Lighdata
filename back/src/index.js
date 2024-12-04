const express = require('express');
const pool = require('./db/connection');
require('dotenv').config();
const cors = require('cors'); 


const clientesRouter = require('./routes/clientes');
const materialesRouter = require('./routes/materiales');
const combosRouter = require('./routes/combos');


const loadData = require('../src/db/data_loader');

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/clientes', clientesRouter);  
app.use('/api/materiales', materialesRouter);  
app.use('/api/combos', combosRouter);  


pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.stack);
        return;
    }
    console.log('Conectado a la base de datos con ID', connection.threadId);
    connection.release();
    
 
    loadData();  
});
loadData();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
