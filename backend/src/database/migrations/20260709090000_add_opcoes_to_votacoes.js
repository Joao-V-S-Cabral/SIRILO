/**
 * Adiciona a coluna `opcoes` em `votacoes`: um JSON serializado com a lista
 * de opções válidas para aquela votação (ex: ["Sim","Não"] ou
 * ["Candidato A","Candidato B","Candidato C"]).
 *
 * Isso resolve a lacuna de "Multipla_Escolha" e "Eleicao" aceitarem
 * qualquer string em opcao_escolhida: agora toda votação, independente do
 * tipo_resposta, tem um conjunto fechado e validável de opções.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('votacoes', table => {
    table.text('opcoes').notNullable().defaultTo(JSON.stringify(['Sim', 'Não']));
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('votacoes', table => {
    table.dropColumn('opcoes');
  });
};
