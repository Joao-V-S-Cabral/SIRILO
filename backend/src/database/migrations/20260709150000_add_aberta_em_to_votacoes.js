/**
 * Adiciona a coluna `aberta_em` em `votacoes`: o timestamp exato em que o
 * status mudou para "Aberta".
 *
 * Sem isso, o cronômetro da votação no frontend só existia na memória do
 * navegador de cada votante e reiniciava do zero a cada recarregamento de
 * página (RF21 exige um cronômetro regressivo real, não um palpite local
 * que reseta). Com `aberta_em` persistido no servidor, o tempo restante
 * pode ser recalculado a qualquer momento como
 * `duracao_minutos * 60 - segundosDesde(aberta_em)`, de forma consistente
 * entre recarregamentos e entre diferentes dispositivos.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('votacoes', table => {
    table.timestamp('aberta_em').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('votacoes', table => {
    table.dropColumn('aberta_em');
  });
};
