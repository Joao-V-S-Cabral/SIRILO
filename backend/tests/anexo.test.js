const { app, request, loginAdmin, loginProprietarioA } = require('./helpers');

describe('Anexo de pauta (upload/download PDF)', () => {
  let adminToken;
  let pautaId;

  beforeAll(async () => {
    adminToken = await loginAdmin();

    const pautaRes = await request(app)
      .post('/api/pautas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reuniao_id: 1, titulo: 'Pauta com anexo', descricao: 'Fixture de teste de anexo.' });

    pautaId = pautaRes.body.id;
  });

  test('rejeita upload de arquivo que não é PDF de verdade', async () => {
    const res = await request(app)
      .post(`/api/pautas/${pautaId}/anexo`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('arquivo', Buffer.from('isto nao e um pdf'), { filename: 'falso.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
  });

  test('aceita upload de um PDF válido e depois permite o download do mesmo conteúdo', async () => {
    // Cabeçalho mínimo de um PDF válido (assinatura %PDF-)
    const pdfFake = Buffer.from('%PDF-1.4\n%Conteudo de teste do PDF\n%%EOF');

    const uploadRes = await request(app)
      .post(`/api/pautas/${pautaId}/anexo`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('arquivo', pdfFake, { filename: 'documento.pdf', contentType: 'application/pdf' });

    expect(uploadRes.status).toBe(200);

    const proprietarioToken = await loginProprietarioA();
    const downloadRes = await request(app)
      .get(`/api/pautas/${pautaId}/anexo`)
      .set('Authorization', `Bearer ${proprietarioToken}`);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers['content-type']).toBe('application/pdf');
    expect(Buffer.compare(downloadRes.body, pdfFake)).toBe(0);
  });

  test('bloqueia Proprietário de enviar anexo (rota exclusiva do Admin)', async () => {
    const proprietarioToken = await loginProprietarioA();
    const pdfFake = Buffer.from('%PDF-1.4\nOutro conteudo\n%%EOF');

    const res = await request(app)
      .post(`/api/pautas/${pautaId}/anexo`)
      .set('Authorization', `Bearer ${proprietarioToken}`)
      .attach('arquivo', pdfFake, { filename: 'documento.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(403);
  });
});
