const { app, request } = require('./helpers');

describe('POST /api/auth/login', () => {
  test('autentica o Admin e retorna um token JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@sirilo.com', senha: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.perfil).toBe('Admin');
    expect(typeof res.body.token).toBe('string');
  });

  test('autentica um Proprietário e retorna seus dados de peso/adimplência', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'proprietario_a@sirilo.com', senha: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body.perfil).toBe('Proprietario');
    expect(res.body.peso_voto).toBe(4);
    expect(res.body.inadimplente).toBe(false);
    expect(typeof res.body.token).toBe('string');
  });

  test('autentica um Procurador via token_reuniao e retorna o proprietário representado', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'procurador_d@sirilo.com', token_reuniao: 'PROCURADOR_DEMO' });

    expect(res.status).toBe(200);
    expect(res.body.perfil).toBe('Procurador');
    expect(res.body.proprietario_representado.id).toBe(5);
    expect(typeof res.body.token).toBe('string');
  });

  test('rejeita senha incorreta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@sirilo.com', senha: 'senha_errada' });

    expect(res.status).toBe(401);
  });

  test('rejeita token_reuniao incorreto', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'procurador_d@sirilo.com', token_reuniao: 'TOKEN_INVALIDO' });

    expect(res.status).toBe(401);
  });

  test('rejeita corpo de requisição incompleto', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@sirilo.com' });
    expect(res.status).toBe(400);
  });
});
