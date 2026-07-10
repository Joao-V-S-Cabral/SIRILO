
exports.seed = async function(knex) {
  // Limpa tabelas em ordem inversa de chaves estrangeiras
  await knex('logs_auditoria').del();
  await knex('votos').del();
  await knex('votacoes').del();
  await knex('pautas').del();
  await knex('procuradores').del();
  await knex('reunioes').del();
  await knex('proprietarios').del();
  await knex('condominios').del();

  // Zera os contadores de autoincremento do SQLite
  await knex.raw('DELETE FROM sqlite_sequence');

  // 1. Cadastra Condomínio
  const [condominioId] = await knex('condominios').insert({
    nome: 'Condomínio Vista Alegre',
    cnpj: '12.345.678/0001-90'
  });

  // 2. Cadastra Proprietários e Administrador
  await knex('proprietarios').insert([
    {
      id: 1,
      condominio_id: condominioId,
      nome: 'Administrador Geral',
      email: 'admin@sirilo.com',
      senha: 'admin123',
      lotes: 'Administração',
      peso_voto: 0.0,
      inadimplente: false,
      tipo_acesso: 'Admin'
    },
    {
      id: 2,
      condominio_id: condominioId,
      nome: 'Carlos Augusto (Proprietário A)',
      email: 'proprietario_a@sirilo.com',
      senha: 'senha123',
      lotes: 'Casa 10, Casa 11',
      peso_voto: 4.0, // 2 casas = Peso 4.0
      inadimplente: false,
      tipo_acesso: 'Proprietario'
    },
    {
      id: 3,
      condominio_id: condominioId,
      nome: 'Beatriz Costa (Proprietário B)',
      email: 'proprietario_b@sirilo.com',
      senha: 'senha123',
      lotes: 'Terreno 15',
      peso_voto: 1.0, // 1 Terreno = Peso 1.0
      inadimplente: false,
      tipo_acesso: 'Proprietario'
    },
    {
      id: 4,
      condominio_id: condominioId,
      nome: 'Celso Silva (Proprietário C)',
      email: 'proprietario_c@sirilo.com',
      senha: 'senha123',
      lotes: 'Casa 05',
      peso_voto: 2.0, // Casa 05 = Peso 2.0 (porém inadimplente)
      inadimplente: true, // Votará com peso zero
      tipo_acesso: 'Proprietario'
    },
    {
      id: 5,
      condominio_id: condominioId,
      nome: 'Daniel Rocha (Proprietário D)',
      email: 'proprietario_d@sirilo.com',
      senha: 'senha123',
      lotes: 'Terreno 22',
      peso_voto: 1.0, // 1 Terreno = Peso 1.0
      inadimplente: false,
      tipo_acesso: 'Proprietario'
    }
  ]);

  // 3. Cadastra Reunião em Andamento
  const [reuniaoId] = await knex('reunioes').insert({
    condominio_id: condominioId,
    nome_assembleia: 'Assembleia Geral Ordinária 2026',
    data: '2026-07-07',
    hora: '20:00',
    status: 'Em_Andamento'
  });

  // 4. Cadastra Procurador vinculado ao Proprietário D
  await knex('procuradores').insert({
    proprietario_id: 5,
    reuniao_id: reuniaoId,
    nome: 'Roberto Lima (Procurador D)',
    email: 'procurador_d@sirilo.com',
    token_reuniao: 'PROCURADOR_DEMO'
  });

  // 5. Cadastra Pautas da Reunião
  const [pautaPinturaId] = await knex('pautas').insert({
    reuniao_id: reuniaoId,
    titulo: 'Aprovação de Orçamento da Pintura',
    descricao: 'Discussão e votação sobre o orçamento para a pintura externa das fachadas dos blocos.'
  });

  await knex('pautas').insert({
    reuniao_id: reuniaoId,
    titulo: 'Eleição do Conselho Consultivo',
    descricao: 'Escolha dos novos membros do conselho consultivo para o biênio 2026-2028.'
  });

  // 6. Cadastra uma Votação Inicial vinculada à Pauta da Pintura
  await knex('votacoes').insert({
    reuniao_id: reuniaoId,
    pauta_id: pautaPinturaId,
    pergunta: 'Deseja aprovar o orçamento da empresa Pinturas Silva Ltda no valor de R$ 45.000,00?',
    tipo_resposta: 'Sim_Nao',
    visibilidade: 'Aberta',
    status: 'Aguardando',
    duracao_minutos: 15
  });
};
