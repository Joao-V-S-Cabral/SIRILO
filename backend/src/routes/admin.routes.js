const { Router } = require('express');
const adminController = require('../controllers/admin.controller');

const routes = Router();

routes.post('/admin/reset-db', adminController.resetDb);

module.exports = routes;
