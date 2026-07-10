const { Router } = require('express');
const multer = require('multer');
const reunioesController = require('../controllers/reunioes.controller');
const { autenticar, apenasAdmin } = require('../middlewares/auth.middleware');

const routes = Router();

// Upload em memória, limitado a 10MB, apenas para o anexo de pauta (RF30).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Leitura: qualquer usuário autenticado (Admin, Proprietário ou Procurador)
routes.get('/reunioes', autenticar, reunioesController.listar);
routes.get('/reunioes/:id', autenticar, reunioesController.detalhar);
routes.get('/pautas/:id/anexo', autenticar, reunioesController.baixarAnexo);

// Escrita: restrito ao Administrador
routes.post('/pautas', autenticar, apenasAdmin, reunioesController.criarPauta);
routes.post('/pautas/:id/anexo', autenticar, apenasAdmin, upload.single('arquivo'), reunioesController.uploadAnexo);
routes.delete('/pautas/:id/anexo', autenticar, apenasAdmin, reunioesController.removerAnexo);
routes.patch('/reunioes/:id/status', autenticar, apenasAdmin, reunioesController.atualizarStatus);

module.exports = routes;
