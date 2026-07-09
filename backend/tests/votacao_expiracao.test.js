const { app, request, loginAdmin, loginProprietarioA } = require('./helpers');
const connection = require('../src/database/connection');

describe('Encerramento automático da votação por tempo esgotado (RF15/RF21)', () => {
  let adminToken;

  async function criarEAbrirVotacaoExpirada() {
    const pautaRes = await request(app)
      .post('/api/pautas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reuniao_id: 1, titulo: 'Pauta de Teste - Expiração', descricao: 'Fixture.' });

    const votacaoRes = await request(app)
      .post('/api/votacoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pauta_id: pautaRes.body.id, pergunta: 'Expira?', tipo_resposta: 'Sim_Nao', duracao_minutos: 1 });

    const votacaoId = votacaoRes.body.id;

    await request(app)
      .patch(`/api/votacoes/${votacaoId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Aberta' });

    // Simula o tempo ter se esgotado: retrocede aberta_em em 10 minutos
    // (a votação foi criada com duracao_minutos: 1).
    await connection('votacoes')
      .where({ id: votacaoId })
      .update({ aberta_em: connection.raw("datetime('now', 'localtime', '-10 minutes')") });

    return votacaoId;
  }

  beforeAll(async () => {
    adminToken = await loginAdmin();
  });

  test('GET /votacoes/ativa não retorna mais uma votação cujo tempo esgotou', async () => {
    const votacaoId = await criarEAbrirVotacaoExpirada();
    const votacao = await connection('votacoes').where({ id: votacaoId }).first();

    const res = await request(app)
      .get('/api/votacoes/ativa')
      .query({ reuniao_id: votacao.reuniao_id })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();

    const votacaoAtualizada = await connection('votacoes').where({ id: votacaoId }).first();
    expect(votacaoAtualizada.status).toBe('Encerrada');
  });

  test('GET /votacoes/:id reflete o encerramento automático', async () => {
    const votacaoId = await criarEAbrirVotacaoExpirada();

    const res = await request(app)
      .get(`/api/votacoes/${votacaoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Encerrada');
  });

  test('rejeita voto em votação cujo tempo já esgotou, mesmo que o status ainda não tivesse sido verificado antes', async () => {
    const votacaoId = await criarEAbrirVotacaoExpirada();
    const token = await loginProprietarioA();

    const res = await request(app)
      .post('/api/votacoes/votar')
      .set('Authorization', `Bearer ${token}`)
      .send({ votacao_id: votacaoId, opcao_escolhida: 'Sim' });

    expect(res.status).toBe(400);

    const votacaoAtualizada = await connection('votacoes').where({ id: votacaoId }).first();
    expect(votacaoAtualizada.status).toBe('Encerrada');
  });

  test('GET /votacoes/:id/resultados também encerra automaticamente ao ser consultado', async () => {
    const votacaoId = await criarEAbrirVotacaoExpirada();

    const res = await request(app)
      .get(`/api/votacoes/${votacaoId}/resultados`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Encerrada');
  });

  test('GET /reunioes/:id também reflete o encerramento automático das votações da pauta', async () => {
    const votacaoId = await criarEAbrirVotacaoExpirada();
    const votacao = await connection('votacoes').where({ id: votacaoId }).first();

    const res = await request(app)
      .get(`/api/reunioes/${votacao.reuniao_id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const pautaComVotacao = res.body.pautas.find(p => p.id === votacao.pauta_id);
    const votacaoNaResposta = pautaComVotacao.votacoes.find(v => v.id === votacaoId);
    expect(votacaoNaResposta.status).toBe('Encerrada');
  });

  test('não encerra uma votação aberta cujo tempo ainda não se esgotou', async () => {
    const pautaRes = await request(app)
      .post('/api/pautas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reuniao_id: 1, titulo: 'Pauta de Teste - Ainda no prazo', descricao: 'Fixture.' });

    const votacaoRes = await request(app)
      .post('/api/votacoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pauta_id: pautaRes.body.id, pergunta: 'Ainda no prazo?', tipo_resposta: 'Sim_Nao', duracao_minutos: 15 });

    await request(app)
      .patch(`/api/votacoes/${votacaoRes.body.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Aberta' });

    const res = await request(app)
      .get(`/api/votacoes/${votacaoRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.status).toBe('Aberta');
  });
});
