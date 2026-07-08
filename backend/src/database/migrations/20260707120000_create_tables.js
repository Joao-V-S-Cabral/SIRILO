/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // 1. Condomínios
    .createTable('condominios', table => {
      table.increments('id').primary();
      table.string('nome').notNullable();
      table.string('cnpj', 18).notNullable();
    })
    // 2. Proprietários / Admins
    .createTable('proprietarios', table => {
      table.increments('id').primary();
      table.integer('condominio_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('condominios')
        .onDelete('CASCADE');
      table.string('nome').notNullable();
      table.string('email').unique().notNullable();
      table.string('senha').notNullable();
      table.string('lotes').notNullable(); // Ex: "Casa 10, Casa 11" ou "Terreno 15"
      table.decimal('peso_voto', 8, 2).notNullable().defaultTo(1.0);
      table.boolean('inadimplente').notNullable().defaultTo(false);
      table.string('tipo_acesso').notNullable().defaultTo('Proprietario'); // Admin, Proprietario
    })
    // 3. Reuniões / Assembleias
    .createTable('reunioes', table => {
      table.increments('id').primary();
      table.integer('condominio_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('condominios')
        .onDelete('CASCADE');
      table.string('nome_assembleia').notNullable();
      table.date('data').notNullable();
      table.string('hora', 5).notNullable(); // Formato "HH:MM"
      table.string('status').notNullable().defaultTo('Agendada'); // Agendada, Em_Andamento, Encerrada
    })
    // 4. Procuradores
    .createTable('procuradores', table => {
      table.increments('id').primary();
      table.integer('proprietario_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('proprietarios')
        .onDelete('CASCADE');
      table.integer('reuniao_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('reunioes')
        .onDelete('CASCADE');
      table.string('nome').notNullable();
      table.string('email').notNullable();
      table.string('token_reuniao').unique().notNullable(); // Token gerado para login do procurador
    })
    // 5. Pautas
    .createTable('pautas', table => {
      table.increments('id').primary();
      table.integer('reuniao_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('reunioes')
        .onDelete('CASCADE');
      table.string('titulo').notNullable();
      table.text('descricao').notNullable();
      table.binary('anexo_pdf'); // Blob para arquivo em pdf
    })
    // 6. Votações
    .createTable('votacoes', table => {
      table.increments('id').primary();
      table.integer('reuniao_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('reunioes')
        .onDelete('CASCADE');
      table.integer('pauta_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('pautas')
        .onDelete('CASCADE');
      table.string('pergunta').notNullable();
      table.string('tipo_resposta').notNullable().defaultTo('Sim_Nao'); // Sim_Nao, Multipla_Escolha, Eleicao
      table.string('visibilidade').notNullable().defaultTo('Aberta'); // Aberta, Fechada
      table.string('status').notNullable().defaultTo('Aguardando'); // Aguardando, Aberta, Encerrada
      table.integer('duracao_minutos').notNullable().defaultTo(15);
    })
    // 7. Votos
    .createTable('votos', table => {
      table.increments('id').primary();
      table.integer('votacao_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('votacoes')
        .onDelete('CASCADE');
      table.integer('proprietario_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('proprietarios')
        .onDelete('CASCADE');
      table.integer('procurador_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('procuradores')
        .onDelete('SET NULL');
      table.string('opcao_escolhida').notNullable();
      table.decimal('peso_aplicado', 8, 2).notNullable(); // Salva o peso no momento exato do voto
      table.timestamp('timestamp').defaultTo(knex.fn.now());
      table.string('ip_voto').notNullable();

      // Regra de Integridade (RF18): Unicidade do Voto
      table.unique(['votacao_id', 'proprietario_id']);
    })
    // 8. Logs de Auditoria
    .createTable('logs_auditoria', table => {
      table.increments('id').primary();
      table.integer('proprietario_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('proprietarios')
        .onDelete('SET NULL');
      table.integer('procurador_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('procuradores')
        .onDelete('SET NULL');
      table.string('acao').notNullable(); // Ex: "Login", "Voto Computado", "Abertura de Votação"
      table.timestamp('data_hora').defaultTo(knex.fn.now());
      table.string('ip').notNullable();
      table.string('navegador').notNullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('logs_auditoria')
    .dropTableIfExists('votos')
    .dropTableIfExists('votacoes')
    .dropTableIfExists('pautas')
    .dropTableIfExists('procuradores')
    .dropTableIfExists('reunioes')
    .dropTableIfExists('proprietarios')
    .dropTableIfExists('condominios');
};
