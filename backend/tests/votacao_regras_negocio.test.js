const {
  app,
  request,
  loginAdmin,
  loginProprietarioA,
  loginProprietarioB,
  loginProprietarioC,
  loginProcuradorD
} = require('./helpers');

describe('Regras de negócio de votação', () => {
  let adminToken;
  let votacaoSimNaoId;

  beforeAll(async () => {
    adminToken = await loginAdmin();

    // Cria uma pauta e votação isoladas para este arquivo de teste,
    // para não interferir (nem sofrer interferência) de outras suítes.
    const pautaRes = await request(app)
      .post('/api/pautas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reuniao_id: 1, titulo: 'Pauta de Teste - Sim/Não', descricao: 'Fixture de teste automatizado.' });

    const votacaoRes = await request(app)
      .post('/api/votacoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pauta_id: pautaRes.body.id, pergunta: 'Aprova o teste automatizado?', tipo_resposta: 'Sim_Nao' });

    votacaoSimNaoId = votacaoRes.body.id;

    await request(app)
      .patch(`/api/votacoes/${votacaoSimNaoId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Aberta' });
  });

  test('proprietário adimplente vota e o peso aplicado é o seu peso_voto cadastrado', async () => {
    const token = await loginProprietarioA(); // peso 4.0
    const res = await request(app)
      .post('/api/votacoes/votar')
      .set('Authorization', `Bearer ${token}`)
      .send({ votacao_id: votacaoSimNaoId, opcao_escolhida: 'Sim' });

    expect(res.status).toBe(201);
    expect(res.body.peso_aplicado).toBe(4);
  });

  test('proprietário inadimplente vota, mas o peso aplicado é ZERO', async () => {
    const token = await loginProprietarioC(); // peso 2.0, porém inadimplente
    const res = await request(app)
      .post('/api/votacoes/votar')
      .set('Authorization', `Bearer ${token}`)
      .send({ votacao_id: votacaoSimNaoId, opcao_escolhida: 'Não' });

    expect(res.status).toBe(201);
    expect(res.body.peso_aplicado).toBe(0);
  });

  test('não permite o mesmo proprietário votar duas vezes na mesma votação (409)', async () => {
    const token = await loginProprietarioA();
    const res = await request(app)
      .post('/api/votacoes/votar')
      .set('Authorization', `Bearer ${token}`)
      .send({ votacao_id: votacaoSimNaoId, opcao_escolhida: 'Não' });

    expect(res.status).toBe(409);
  });

  test('procurador credenciado consegue votar em nome do proprietário que representa', async () => {
    const token = await loginProcuradorD(); // representa o Proprietário D (peso 1.0)
    const res = await request(app)
      .post('/api/votacoes/votar')
      .set('Authorization', `Bearer ${token}`)
      .send({ votacao_id: votacaoSimNaoId, opcao_escolhida: 'Sim' });

    expect(res.status).toBe(201);
    expect(res.body.peso_aplicado).toBe(1);
  });

  test('rejeita opcao_escolhida fora do conjunto válido da votação', async () => {
    const token = await loginProprietarioB();
    const res = await request(app)
      .post('/api/votacoes/votar')
      .set('Authorization', `Bearer ${token}`)
      .send({ votacao_id: votacaoSimNaoId, opcao_escolhida: 'Talvez' });

    expect(res.status).toBe(400);
  });

  test('indica corretamente ja_votou como true ou false ao buscar a votação ativa', async () => {
    // 1. Cria uma pauta e uma votação exclusivas para este teste
    const pautaRes = await request(app)
      .post('/api/pautas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reuniao_id: 1, titulo: 'Pauta Isolada Polling', descricao: 'Fixture.' });

    const votacaoRes = await request(app)
      .post('/api/votacoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pauta_id: pautaRes.body.id, pergunta: 'Voto Isolado?', tipo_resposta: 'Sim_Nao' });

    const votacaoId = votacaoRes.body.id;

    await request(app)
      .patch(`/api/votacoes/${votacaoId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Aberta' });

    const token = await loginProprietarioB(); // Proprietário B
    
    // 2. Antes de votar, ja_votou deve ser false
    let resAtiva = await request(app)
      .get(`/api/votacoes/ativa?reuniao_id=1`)
      .set('Authorization', `Bearer ${token}`);
    expect(resAtiva.status).toBe(200);
    expect(resAtiva.body.ja_votou).toBe(false);

    // 3. Registra o voto
    const resVoto = await request(app)
      .post('/api/votacoes/votar')
      .set('Authorization', `Bearer ${token}`)
      .send({ votacao_id: votacaoId, opcao_escolhida: 'Sim' });
    expect(resVoto.status).toBe(201);

    // 4. Depois de votar, ja_votou deve ser true
    resAtiva = await request(app)
      .get(`/api/votacoes/ativa?reuniao_id=1`)
      .set('Authorization', `Bearer ${token}`);
    expect(resAtiva.status).toBe(200);
    expect(resAtiva.body.id).toBe(votacaoId);
    expect(resAtiva.body.ja_votou).toBe(true);
  });

  test('rejeita voto em votação que não está aberta', async () => {
    // Encerra a votação e tenta votar em seguida
    await request(app)
      .patch(`/api/votacoes/${votacaoSimNaoId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Encerrada' });

    const token = await loginProprietarioB();
    const res = await request(app)
      .post('/api/votacoes/votar')
      .set('Authorization', `Bearer ${token}`)
      .send({ votacao_id: votacaoSimNaoId, opcao_escolhida: 'Sim' });

    expect(res.status).toBe(400);
  });

  test('não permite reabrir uma votação encerrada', async () => {
    const res = await request(app)
      .patch(`/api/votacoes/${votacaoSimNaoId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Aberta' });

    expect(res.status).toBe(400);
  });

  test('resultado final reflete a soma ponderada correta (peso 4 "Sim" contra peso 0+1 "Não"/"Sim")', async () => {
    const token = await loginProprietarioA();
    const res = await request(app)
      .get(`/api/votacoes/${votacaoSimNaoId}/resultados`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Sim: Proprietário A (4.0) + Procurador D em nome do Prop. D (1.0) = 5.0
    // Não: Proprietário C, inadimplente (0.0)
    const simResultado = res.body.resultados.find(r => r.opcao === 'Sim');
    const naoResultado = res.body.resultados.find(r => r.opcao === 'Não');

    expect(simResultado.peso_total).toBe(5);
    expect(naoResultado.peso_total).toBe(0);
    expect(simResultado.percentual).toBe(100);
  });
});

describe('Votação com opções customizadas (Multipla_Escolha)', () => {
  let adminToken;

  beforeAll(async () => {
    adminToken = await loginAdmin();
  });

  test('exige "opcoes" (array com 2+ itens) para tipo Multipla_Escolha', async () => {
    const pautaRes = await request(app)
      .post('/api/pautas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reuniao_id: 1, titulo: 'Eleição de teste', descricao: 'Fixture.' });

    const semOpcoes = await request(app)
      .post('/api/votacoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pauta_id: pautaRes.body.id, pergunta: 'Quem deve vencer?', tipo_resposta: 'Multipla_Escolha' });

    expect(semOpcoes.status).toBe(400);
  });

  test('cria votação de múltipla escolha com opções customizadas e valida o voto contra elas', async () => {
    const pautaRes = await request(app)
      .post('/api/pautas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reuniao_id: 1, titulo: 'Eleição de teste 2', descricao: 'Fixture.' });

    const votacaoRes = await request(app)
      .post('/api/votacoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        pauta_id: pautaRes.body.id,
        pergunta: 'Quem deve vencer?',
        tipo_resposta: 'Multipla_Escolha',
        opcoes: ['Candidato A', 'Candidato B']
      });

    expect(votacaoRes.status).toBe(201);
    expect(votacaoRes.body.opcoes).toEqual(['Candidato A', 'Candidato B']);

    await request(app)
      .patch(`/api/votacoes/${votacaoRes.body.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Aberta' });

    const token = await loginProprietarioB();

    const votoInvalido = await request(app)
      .post('/api/votacoes/votar')
      .set('Authorization', `Bearer ${token}`)
      .send({ votacao_id: votacaoRes.body.id, opcao_escolhida: 'Candidato Inexistente' });
    expect(votoInvalido.status).toBe(400);

    const votoValido = await request(app)
      .post('/api/votacoes/votar')
      .set('Authorization', `Bearer ${token}`)
      .send({ votacao_id: votacaoRes.body.id, opcao_escolhida: 'Candidato A' });
    expect(votoValido.status).toBe(201);
  });
});
