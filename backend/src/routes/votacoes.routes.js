const { Router } = require('express');
const votacoesController = require('../controllers/votacoes.controller');
const votosController = require('../controllers/votos.controller');
const { autenticar, apenasAdmin, apenasVotante } = require('../middlewares/auth.middleware');

const routes = Router();

// Sessões de votação (RF14, RF15) — gerenciadas apenas pelo Admin
routes.post('/votacoes', autenticar, apenasAdmin, votacoesController.criar);
routes.patch('/votacoes/:id/status', autenticar, apenasAdmin, votacoesController.atualizarStatus);

// Consulta de votações — qualquer usuário autenticado
routes.get('/votacoes/ativa', autenticar, votacoesController.buscarAtiva);
routes.get('/votacoes/:id', autenticar, votacoesController.detalhar);
routes.get('/votacoes/:id/resultados', autenticar, votosController.resultados);

// Voto (RF12, RF18, RF19) — apenas Proprietário ou Procurador
routes.post('/votacoes/votar', autenticar, apenasVotante, votosController.votar);
routes.get('/votacoes/:id/meu-voto', autenticar, apenasVotante, votosController.meuVoto);

module.exports = routes;
