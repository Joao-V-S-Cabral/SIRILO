const fs = require('fs');
const knex = require('knex');
const configuration = require('../knexfile');

module.exports = async function globalSetup() {
  const dbPath = configuration.test.connection.filename;

  // Garante um banco de teste totalmente limpo, isolado do banco de desenvolvimento/demo.
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const testConnection = knex(configuration.test);
  await testConnection.migrate.latest();
  await testConnection.seed.run();
  await testConnection.destroy();
};
