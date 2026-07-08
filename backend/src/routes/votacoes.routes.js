const { Router } = require('express');
const votacoesController = require('../controllers/votacoes.controller');
const votosController = require('../controllers/votos.controller');

const routes = Router();

// Sessões de votação (RF14, RF15)
routes.post('/votacoes', votacoesController.criar);
routes.get('/votacoes/ativa', votacoesController.buscarAtiva);
routes.get('/votacoes/:id', votacoesController.detalhar);
routes.patch('/votacoes/:id/status', votacoesController.atualizarStatus);

// Voto e apuração (RF12, RF18, RF19)
routes.post('/votacoes/votar', votosController.votar);
routes.get('/votacoes/:id/resultados', votosController.resultados);

module.exports = routes;
