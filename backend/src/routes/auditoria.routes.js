const { Router } = require('express');
const auditoriaController = require('../controllers/auditoria.controller');
const { autenticar, apenasAdmin } = require('../middlewares/auth.middleware');

const routes = Router();

routes.get('/auditoria', autenticar, apenasAdmin, auditoriaController.listar);

module.exports = routes;
