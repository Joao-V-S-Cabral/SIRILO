const { Router } = require('express');
const debugController = require('../controllers/debug.controller');

const routes = Router();

routes.get('/status', debugController.getStatus);
routes.get('/debug-data', debugController.getDebugData);

module.exports = routes;
