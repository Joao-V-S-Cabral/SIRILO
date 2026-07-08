const { Router } = require('express');
const adminRoutes = require('./admin.routes');
const debugRoutes = require('./debug.routes');

const routes = Router();

// Agrupa todas as rotas de API sob o prefixo /api
routes.use('/api', adminRoutes);
routes.use('/api', debugRoutes);

module.exports = routes;
