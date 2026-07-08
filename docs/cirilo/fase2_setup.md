# Fase 2: Estrutura do Banco de Dados e Carga de Demonstração (Persistência)

Este documento de engenharia descreve detalhadamente a **Fase 2 (Estrutura do Banco de Dados e Carga de Demonstração)** do sistema **SIRILO**. Ele apresenta o esquema físico do banco SQLite, os scripts das migrações do Knex, o seed para carga de dados e o endpoint administrativo de reset, garantindo a fidelidade arquitetural e facilitando testes práticos para a banca.

---

## 1. Análise de Modelagem: Mapeamento Relacional e Restrições do SIRILO

Para implementar as regras de negócio em conformidade com o Diagrama de Classes e o Documento de Requisitos (RF18, RF19), a modelagem relacional na Fase 2 segue um mapeamento estrito:

### 1.1. Unicidade de Voto por Votação (RF18)
Para garantir de forma inviolável no banco de dados que cada proprietário (ou procurador votando por ele) vote no máximo uma vez em cada pauta:
*   A tabela `votos` possui uma restrição do tipo `UNIQUE(votacao_id, proprietario_id)`.
*   Mesmo se o frontend falhar ou se houver requisições simultâneas via API, a restrição de índice único do SQLite rejeitará qualquer inserção duplicada.

### 1.2. Representação e Herança de Voto por Procuradores (RF12)
*   A tabela `votos` possui uma chave estrangeira opcional `procurador_id` (`nullable`). 
*   Se o proprietário votar diretamente, a coluna `procurador_id` fica `null`. 
*   Se o voto for feito por um procurador credenciado, `procurador_id` registrará o ID do procurador que realizou a ação em nome do proprietário, assegurando a transparência e auditoria do voto.

### 1.3. Integridade Referencial e Comportamento em Cascata
*   Se uma **Reunião** for excluída do sistema, as **Pautas**, **Votações** e **Votos** associados a ela devem ser limpos automaticamente para manter o banco consistente. Isso é enforcado usando `ON DELETE CASCADE` nas chaves estrangeiras.

---

## 2. Tecnologias e Configurações de Persistência na Fase 2

*   **Knex.js Migrations:** As migrações fornecem um controle de versão do esquema do banco de dados em JavaScript. Isso elimina a necessidade de comandos SQL DDL manuais e permite que o banco de dados seja recriado de forma limpa em qualquer máquina com `npx knex migrate:latest`.
*   **Knex Seeds:** Fornecem a massa de dados inicial pré-cadastrada com cenários de testes complexos (inadimplência, múltiplas pautas e representação de procurador) que podem ser disparados com `npx knex seed:run`.
*   **SQLite Foreign Keys Enforcement:** Como o driver padrão do SQLite não ativa restrições de chaves estrangeiras por padrão, a Fase 2 herda a configuração do pool de conexões do Knex para habilitar o comando `PRAGMA foreign_keys = ON`.

---

## 3. Estrutura de Pastas Adicionada na Fase 2

A estrutura do diretório do backend é ampliada para acomodar os arquivos de persistência e rotas:

```text
backend/
├── src/
│   ├── database/
│   │   ├── connection.js       # Arquivo de inicialização e exportação da conexão do Knex
│   │   ├── migrations/
│   │   │   └── 20260707120000_create_tables.js  # Script de migração unificado das 8 tabelas
│   │   └── seeds/
│   │       └── 01_demo_data.js # Script de carga de dados para a demonstração
│   └── server.js               # Adicionado o endpoint de reset (/api/admin/reset-db)
├── knexfile.js
└── package.json
```

---

## 4. Passo a Passo da Configuração e Códigos-Fonte (Boilerplate)

### Passo 4.1: Criando a Migração Unificada das Tabelas
No terminal, a partir da pasta `backend`:
1. Gere o arquivo de migração:
   ```bash
   npx knex migrate:make create_tables
   ```
2. Abra o arquivo recém-criado na pasta `src/database/migrations/` e substitua o conteúdo pelo código abaixo. Ele cria as tabelas na ordem exata de dependência:

```javascript
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
```

---

### Passo 4.2: Criando o Script de Sementes (Seeds)
1. Crie o arquivo de sementes a partir da pasta `backend`:
   ```bash
   npx knex seed:make 01_demo_data
   ```
2. Edite o arquivo em `src/database/seeds/01_demo_data.js` para preencher as tabelas com a massa padrão de testes para o dia da apresentação:

```javascript
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
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
```

---

### Passo 4.3: Conectando o Banco de Dados ao Express
1. Crie a pasta `src/database/` se não existir, e dentro dela crie `connection.js`:
   ```javascript
   const knex = require('knex');
   const configuration = require('../../knexfile');

   const connection = knex(configuration.development);

   module.exports = connection;
   ```

---

### Passo 4.4: Criando o Roteiro do Endpoint Administrativo de Reset
Para que a demonstração na banca seja infalível, criamos o endpoint de reset em `backend/src/server.js`.
1. Atualize seu arquivo `backend/src/server.js` para incluir a importação da conexão do banco de dados e a rota administrativa:

```javascript
const express = require('express');
const cors = require('cors');
const connection = require('./database/connection');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Endpoint simples de status para validação de conectividade
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Comunicação com o Backend do SIRILO estabelecida!' 
  });
});

// Endpoint Administrativo de Reset (Importante para a Apresentação)
app.post('/api/admin/reset-db', async (req, res) => {
  const { secret } = req.query;

  // Validação simples de segurança contra acidentes
  if (secret !== 'SIRILO_RESET_SECRET') {
    return res.status(403).json({ error: 'Acesso negado: token inválido.' });
  }

  try {
    console.log('[Database] Reset acionado pelo administrador...');

    // Roda os rollbacks e migrações em tempo de execução
    await connection.migrate.rollback(null, true); // Rola de volta todas as tabelas
    await connection.migrate.latest();             // Recria todas as tabelas atualizadas
    await connection.seed.run();                   // Insere a massa de dados padrão

    console.log('[Database] Reset e seeds executados com sucesso!');

    return res.json({ 
      status: 'success', 
      message: 'Banco de dados reinicializado e sementes aplicadas com sucesso!' 
    });
  } catch (error) {
    console.error('[Database Error] Falha ao resetar banco de dados:', error);
    return res.status(500).json({ 
      error: 'Falha ao processar reconfiguração do banco de dados.', 
      details: error.message 
    });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[Backend] Express ativo localmente na porta ${PORT}`);
});
```

---

## 5. Instruções de Execução e Teste de Persistência

Para rodar manualmente as migrations e sementes ou acionar o reset remoto:

### 5.1. Execução de Linha de Comando (Desenvolvimento)
> [!NOTE]
> Os comandos do Knex devem ser executados de dentro do diretório `backend/` ou utilizando a flag `--prefix backend` a partir da raiz do monorepo.

1. Rodar as migrações:
   ```bash
   # A partir da pasta 'backend'
   npx knex migrate:latest
   ```
   * O Knex criará o arquivo `backend/sirilo.db` e aplicará as 8 tabelas estruturadas.
2. Rodar a massa de dados:
   ```bash
   # A partir da pasta 'backend'
   npx knex seed:run
   ```

### 5.2. Testando o Reset Remoto da Apresentação
1. Abra um terminal de testes e envie uma requisição POST de reset:
   * **Via PowerShell:**
     ```powershell
     Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:3001/api/admin/reset-db?secret=SIRILO_RESET_SECRET"
     ```
   * **Via cURL:**
     ```bash
     curl -X POST "http://127.0.0.1:3001/api/admin/reset-db?secret=SIRILO_RESET_SECRET"
     ```
2. O servidor deve responder com status de sucesso (`"status": "success"`). Se você apagar todos os registros ou simular múltiplos votos durante a apresentação, basta reenviar a chamada acima para que o banco seja limpo e as seeds reinseridas de forma instantânea.

---

## 6. Análise de Riscos e Mitigações (Fase 2)

### 6.1. Bloqueio de Arquivo Físico do SQLite (Database is locked)
*   **Problema:** O SQLite grava tudo em um arquivo único (`sirilo.db`). Se o servidor Express receber multiplos acessos de escrita simultâneos durante a apresentação ou durante o comando de reset, o arquivo pode ficar travado e lançar um erro de banco bloqueado.
*   **Mitigação:** Como o protótipo será testado com apenas 3 ou 4 alunos conectados simultaneamente via celular, o tráfego de escritas é insignificante. Para o Reset, a função de rollback no script do `server.js` é executada com `connection.migrate.rollback(null, true)` que finaliza as sessões de forma forçada antes de resetar.

### 6.2. Inconsistência de IDs e Auto-incremento (Sequences)
*   **Problema:** Em alguns bancos de dados, ao deletar registros das tabelas, a contagem de ID primária (Auto-increment) não zera, fazendo com que novos inserts comecem com IDs maiores (ex: 6, 7 em vez de 1). Isso pode quebrar scripts de demonstração que dependam de chaves hardcoded no frontend.
*   **Mitigação:** No script de reset (`01_demo_data.js`), a deleção de tabelas é executada recriando a tabela do zero (`rollback` seguido de `latest`), limpando as tabelas e reinicializando todos os contadores de autoincremento para o valor `1`.

---

## 7. Definição de Pronto (Definition of Done - DoD) da Fase 2

A Fase 2 será considerada 100% concluída quando atender a todos os critérios abaixo:

1.  **Criação Limpa das Tabelas:** O comando `npx knex migrate:latest` executa sem nenhum erro e cria o arquivo físico `sirilo.db` com a estrutura das 8 tabelas especificadas.
2.  **Massa Inicial Carregada:** O comando `npx knex seed:run` popula todos os registros demonstrativos (1 condomínio, 5 proprietários incluindo 1 admin, 1 reunião em andamento, 2 pautas e 1 votação).
3.  **Funcionamento do Reset DB:** Uma chamada POST para `/api/admin/reset-db?secret=SIRILO_RESET_SECRET` apaga o banco, reconstrói as tabelas e reinsere as sementes em menos de 1.5 segundos.
4.  **Enforçamento de Voto Único:** O SQLite impede fisicamente a gravação de mais de um voto para o mesmo `proprietario_id` em uma mesma `votacao_id` (violando a restrição UNIQUE).
5.  **Clean Code e Portabilidade:** O banco de dados SQLite não requer nenhuma instalação externa de software do lado do usuário para funcionar, mantendo o monorepo portátil.
