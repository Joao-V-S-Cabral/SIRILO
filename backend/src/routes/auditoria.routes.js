const { Router } = require('express');
const auditoriaController = require('../controllers/auditoria.controller');

const routes = Router();

routes.get('/auditoria', auditoriaController.listar);

module.exports = routes;
