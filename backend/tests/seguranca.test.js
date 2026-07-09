const { app, request, loginAdmin, loginProprietarioA } = require('./helpers');

describe('Proteção de rotas (autenticação e autorização)', () => {
  test('bloqueia acesso sem token (401)', async () => {
    const res = await request(app).get('/api/reunioes');
    expect(res.status).toBe(401);
  });

  test('bloqueia token inválido/adulterado (401)', async () => {
    const res = await request(app)
      .get('/api/reunioes')
      .set('Authorization', 'Bearer token.invalido.aqui');
    expect(res.status).toBe(401);
  });

  test('permite acesso com token válido', async () => {
    const token = await loginAdmin();
    const res = await request(app)
      .get('/api/reunioes')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('bloqueia Proprietário de acessar rota exclusiva de Admin (criar pauta)', async () => {
    const token = await loginProprietarioA();
    const res = await request(app)
      .post('/api/pautas')
      .set('Authorization', `Bearer ${token}`)
      .send({ reuniao_id: 1, titulo: 'Teste', descricao: 'Teste' });

    expect(res.status).toBe(403);
  });

  test('bloqueia Proprietário de acessar o log de auditoria (exclusivo do Admin)', async () => {
    const token = await loginProprietarioA();
    const res = await request(app)
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('bloqueia o Admin de votar (rota exclusiva de Proprietário/Procurador)', async () => {
    const token = await loginAdmin();
    const res = await request(app)
      .post('/api/votacoes/votar')
      .set('Authorization', `Bearer ${token}`)
      .send({ votacao_id: 1, opcao_escolhida: 'Sim' });

    expect(res.status).toBe(403);
  });
});
