
exports.up = function(knex) {
  return knex.schema.alterTable('votacoes', table => {
    table.text('opcoes').notNullable().defaultTo(JSON.stringify(['Sim', 'Não']));
  });
};


exports.down = function(knex) {
  return knex.schema.alterTable('votacoes', table => {
    table.dropColumn('opcoes');
  });
};
