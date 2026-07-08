const { Router } = require('express');
const reunioesController = require('../controllers/reunioes.controller');

const routes = Router();

routes.get('/reunioes', reunioesController.listar);
routes.get('/reunioes/:id', reunioesController.detalhar);
routes.patch('/reunioes/:id/status', reunioesController.atualizarStatus);
routes.get('/pautas/:id/anexo', reunioesController.baixarAnexo);

module.exports = routes;
