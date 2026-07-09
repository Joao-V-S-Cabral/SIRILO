const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());

// Registra o centralizador de rotas
app.use(routes);

module.exports = app;
