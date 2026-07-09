const { Router } = require('express');
const authController = require('../controllers/auth.controller');

const routes = Router();

routes.post('/auth/login', authController.login);

module.exports = routes;
