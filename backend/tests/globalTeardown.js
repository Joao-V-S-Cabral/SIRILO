const fs = require('fs');
const configuration = require('../knexfile');

module.exports = async function globalTeardown() {
  const dbPath = configuration.test.connection.filename;
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
};
