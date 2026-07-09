const { app, request, loginAdmin } = require('./helpers');
const connection = require('../src/database/connection');

describe('Regras de negócio: reunião encerrada', () => {
  let adminToken;
  let reuniaoId;
  let pautaId;
  let votacaoAbertaId;
  let votacaoAguardandoId;

  beforeAll(async () => {
    adminToken = await loginAdmin();

    // Reunião isolada (própria para este arquivo), para não interferir
    // com a reuniao_id=1 usada pelas demais suítes de teste.
    [reuniaoId] = await connection('reunioes').insert({
      condominio_id: 1,
      nome_assembleia: 'Assembleia de Teste - Encerramento',
      data: '2026-08-01',
      hora: '19:00',
      status: 'Em_Andamento'
    });

    const pautaRes = await request(app)
      .post('/api/pautas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reuniao_id: reuniaoId, titulo: 'Pauta de Teste', descricao: 'Fixture.' });
    pautaId = pautaRes.body.id;

    const votacaoAbertaRes = await request(app)
      .post('/api/votacoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pauta_id: pautaId, pergunta: 'Vota aberta?', tipo_resposta: 'Sim_Nao' });
    votacaoAbertaId = votacaoAbertaRes.body.id;
    await request(app)
      .patch(`/api/votacoes/${votacaoAbertaId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Aberta' });

    const votacaoAguardandoRes = await request(app)
      .post('/api/votacoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pauta_id: pautaId, pergunta: 'Vota aguardando?', tipo_resposta: 'Sim_Nao' });
    votacaoAguardandoId = votacaoAguardandoRes.body.id;

    // Encerra a reunião com uma votação Aberta e outra Aguardando pendentes.
    await request(app)
      .patch(`/api/reunioes/${reuniaoId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Encerrada' });
  });

  test('encerrar a reunião encerra em cascata as votações que ainda estavam abertas/aguardando', async () => {
    const aberta = await connection('votacoes').where({ id: votacaoAbertaId }).first();
    const aguardando = await connection('votacoes').where({ id: votacaoAguardandoId }).first();

    expect(aberta.status).toBe('Encerrada');
    expect(aguardando.status).toBe('Encerrada');
  });

  test('rejeita upload de anexo em pauta de reunião encerrada', async () => {
    const pdfFake = Buffer.from('%PDF-1.4\nConteudo\n%%EOF');
    const res = await request(app)
      .post(`/api/pautas/${pautaId}/anexo`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('arquivo', pdfFake, { filename: 'documento.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
  });

  test('rejeita criação de nova votação em pauta de reunião encerrada', async () => {
    const res = await request(app)
      .post('/api/votacoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pauta_id: pautaId, pergunta: 'Nova votação depois de encerrar?', tipo_resposta: 'Sim_Nao' });

    expect(res.status).toBe(400);
  });

  test('rejeita tentativa de alterar status de votação em reunião encerrada', async () => {
    const res = await request(app)
      .patch(`/api/votacoes/${votacaoAguardandoId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Aberta' });

    expect(res.status).toBe(400);
  });

  test('rejeita criação de pauta em reunião já encerrada', async () => {
    const res = await request(app)
      .post('/api/pautas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reuniao_id: reuniaoId, titulo: 'Pauta tardia', descricao: 'Não deveria ser criada.' });

    expect(res.status).toBe(400);
  });
});
