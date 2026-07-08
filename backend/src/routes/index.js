const { Router } = require('express');
const adminRoutes = require('./admin.routes');
const debugRoutes = require('./debug.routes');
const authRoutes = require('./auth.routes');
const reunioesRoutes = require('./reunioes.routes');
const votacoesRoutes = require('./votacoes.routes');
const auditoriaRoutes = require('./auditoria.routes');

const routes = Router();

// Agrupa todas as rotas de API sob o prefixo /api
routes.use('/api', adminRoutes);
routes.use('/api', debugRoutes);
routes.use('/api', authRoutes);
routes.use('/api', reunioesRoutes);
routes.use('/api', votacoesRoutes);
routes.use('/api', auditoriaRoutes);

module.exports = routes;
