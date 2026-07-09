const { app, request, loginAdmin, loginProprietarioA } = require('./helpers');

describe('GET /api/auditoria', () => {
  test('Admin consegue listar os logs de auditoria, incluindo o próprio login', async () => {
    const token = await loginAdmin();
    const res = await request(app)
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(log => log.acao.includes('Login (Admin)'))).toBe(true);
  });

  test('cada voto registrado gera uma entrada de log com IP e navegador', async () => {
    const adminToken = await loginAdmin();

    const pautaRes = await request(app)
      .post('/api/pautas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reuniao_id: 1, titulo: 'Pauta auditoria', descricao: 'Fixture.' });

    const votacaoRes = await request(app)
      .post('/api/votacoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pauta_id: pautaRes.body.id, pergunta: 'Teste?', tipo_resposta: 'Sim_Nao' });

    await request(app)
      .patch(`/api/votacoes/${votacaoRes.body.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Aberta' });

    const proprietarioToken = await loginProprietarioA();
    await request(app)
      .post('/api/votacoes/votar')
      .set('Authorization', `Bearer ${proprietarioToken}`)
      .send({ votacao_id: votacaoRes.body.id, opcao_escolhida: 'Sim' });

    const logsRes = await request(app)
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${adminToken}`);

    const logDoVoto = logsRes.body.find(log => log.acao.includes(`votacao_id=${votacaoRes.body.id}`));
    expect(logDoVoto).toBeDefined();
    expect(logDoVoto.ip).toBeTruthy();
    expect(logDoVoto.navegador).toBeTruthy();
  });
});
