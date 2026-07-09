const request = require('supertest');
const app = require('../src/app');

async function loginAdmin() {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@sirilo.com', senha: 'admin123' });
  return res.body.token;
}

async function loginProprietarioA() {
  // Adimplente, peso 4.0
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'proprietario_a@sirilo.com', senha: 'senha123' });
  return res.body.token;
}

async function loginProprietarioB() {
  // Adimplente, peso 1.0
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'proprietario_b@sirilo.com', senha: 'senha123' });
  return res.body.token;
}

async function loginProprietarioC() {
  // Inadimplente, peso 2.0 (deve votar com peso 0)
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'proprietario_c@sirilo.com', senha: 'senha123' });
  return res.body.token;
}

async function loginProcuradorD() {
  // Representa o Proprietário D (peso 1.0)
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'procurador_d@sirilo.com', token_reuniao: 'PROCURADOR_DEMO' });
  return res.body.token;
}

module.exports = {
  app,
  request,
  loginAdmin,
  loginProprietarioA,
  loginProprietarioB,
  loginProprietarioC,
  loginProcuradorD
};
