const knex = require('knex');
const configuration = require('../../knexfile');

const ambiente = process.env.NODE_ENV || 'development';
const connection = knex(configuration[ambiente]);

module.exports = connection;
