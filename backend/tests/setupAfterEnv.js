const connection = require('../src/database/connection');

afterAll(async () => {
  await connection.destroy();
});
