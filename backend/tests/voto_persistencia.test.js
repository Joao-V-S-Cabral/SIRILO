const { app, request, loginAdmin, loginProprietarioA } = require('./helpers');
const connection = require('../src/database/connection');

describe('Persistência de estado da votação (cronômetro e "meu voto")', () => {
  let adminToken;
  let votacaoId;

  beforeAll(async () => {
    adminToken = await loginAdmin();

    const pautaRes = await request(app)
      .post('/api/pautas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reuniao_id: 1, titulo: 'Pauta de Teste - Persistência', descricao: 'Fixture.' });

    const votacaoRes = await request(app)
      .post('/api/votacoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pauta_id: pautaRes.body.id, pergunta: 'Aprova?', tipo_resposta: 'Sim_Nao' });

    votacaoId = votacaoRes.body.id;
  });

  test('votação recém-criada não tem aberta_em preenchido', async () => {
    const votacao = await connection('votacoes').where({ id: votacaoId }).first();
    expect(votacao.aberta_em).toBeFalsy();
  });

  test('abrir a votação preenche aberta_em com o horário atual', async () => {
    await request(app)
      .patch(`/api/votacoes/${votacaoId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Aberta' });

    const votacao = await connection('votacoes').where({ id: votacaoId }).first();
    expect(votacao.aberta_em).toBeTruthy();

    const diferencaMs = Date.now() - new Date(votacao.aberta_em.replace(' ', 'T')).getTime();
    expect(Math.abs(diferencaMs)).toBeLessThan(10_000);
  });

  test('GET /votacoes/:id/meu-voto retorna null antes de votar', async () => {
    const token = await loginProprietarioA();
    const res = await request(app)
      .get(`/api/votacoes/${votacaoId}/meu-voto`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.voto).toBeNull();
  });

  test('GET /votacoes/:id/meu-voto retorna o voto depois de votar', async () => {
    const token = await loginProprietarioA();
    await request(app)
      .post('/api/votacoes/votar')
      .set('Authorization', `Bearer ${token}`)
      .send({ votacao_id: votacaoId, opcao_escolhida: 'Sim' });

    const res = await request(app)
      .get(`/api/votacoes/${votacaoId}/meu-voto`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.voto).not.toBeNull();
    expect(res.body.voto.opcao_escolhida).toBe('Sim');
  });

  test('bloqueia Admin de consultar meu-voto (rota exclusiva de votante)', async () => {
    const res = await request(app)
      .get(`/api/votacoes/${votacaoId}/meu-voto`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
  });
});
