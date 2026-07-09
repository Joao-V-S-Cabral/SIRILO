# Roteiro de Apresentação Sem Brechas (Fase 1 e Fase 2)

Este guia serve como um **playbook estratégico de apresentação** para a banca avaliadora da disciplina de Engenharia de Software. Ele foi estruturado para demonstrar o domínio do grupo sobre cada decisão arquitetural e de implementação das Fases 1 e 2, antecipando as perguntas difíceis dos avaliadores com respostas técnicas blindadas.

---

## 🧭 Estrutura Sugerida de Apresentação (10 Minutos)

```
00:00 ────────────────── 02:00 ────────────────── 05:00 ────────────────── 08:00 ────────────────── 10:00
  │ Visão Geral &        │ Arquitetura &        │ Banco de Dados &     │ Blindagem Contra     │ Perguntas
  │ Objetivos            │ Camada 1 (Setup)     │ Camada 2 (Persist.)  │ Perguntas da Banca   │ & Respostas
```

*   **Minuto 0 a 2:** O Problema do Negócio (Assembleias) e Visão Geral da Arquitetura 3 Camadas.
*   **Minuto 2 a 5:** Camada de Apresentação & Camada de Lógica (React + Vite + Express + Monorepo + Proxy Reverso).
*   **Minuto 5 a 8:** Camada de Persistência (SQLite, Knex Migrations/Seeds, Integridade de Banco).
*   **Minuto 8 a 10:** Fechamento e Simulação de perguntas da banca (o "pulo do gato" técnico).

---

## 🎯 Seção 1: Justificativas Arquiteturais e de Setup (Fase 1)

### ❓ Pergunta Esperada 1: "Por que vocês escolheram uma arquitetura de monorepo simplificado em vez de repositórios Git separados?"
*   **A armadilha:** O avaliador pode argumentar que projetos reais de grande escala costumam separar os repositórios para equipes diferentes trabalharem.
*   **A resposta blindada:**
    > *"Decidimos por um monorepo simplificado por três fatores de Engenharia de Software: **Atomicidade de Versão**, **Simplicidade de Setup** e **Coesão das Entregas**. Separar em múltiplos repositórios causaria uma sobrecarga de sincronização de dependências durante a fase acadêmica. Com o monorepo, garantimos que um commit no Git altere o frontend e o backend simultaneamente de forma atômica. Além disso, criamos scripts unificados na raiz (utilizando a ferramenta `concurrently`) para que o avaliador consiga baixar o projeto e subir ambas as aplicações com um único comando (`npm run dev`), garantindo portabilidade imediata do ambiente de desenvolvimento."*

### ❓ Pergunta Esperada 2: "Como o Frontend (Vite na porta 5173) conversa com o Backend (Express na porta 3001) sem dar erro de CORS?"
*   **A armadilha:** É muito comum que alunos simplesmente instalem a biblioteca `cors` no backend e permitam acessos de qualquer origem (`*`), o que é uma má prática de segurança em produção.
*   **A resposta blindada:**
    > *"No ambiente de desenvolvimento local, configuramos o servidor do **Vite como um Proxy Reverso**. No arquivo `vite.config.js`, definimos uma regra que intercepta chamadas com o prefixo `/api` e as redireciona internamente para `http://127.0.0.1:3001` (onde o Express escuta).
    > Para o navegador do usuário, as requisições aparentam ter a mesma origem (porta 5173), o que neutraliza as restrições de CORS nativas sem a necessidade de expor ou fragilizar as configurações de CORS do backend Express. Em ambiente de produção real, o build estático do frontend seria servido pelo próprio Express ou por um servidor Nginx na mesma origem, portanto, nossa estratégia de proxy simula perfeitamente o ambiente de produção."*

### ❓ Pergunta Esperada 3: "Por que usar o Vite no lugar do clássico Create React App (CRA)?"
*   **A armadilha:** Demonstrar que o grupo apenas seguiu um tutorial sem entender o ganho de performance.
*   **A resposta blindada:**
    > *"O Create React App está depreciado e utiliza o Webpack por baixo, que pré-empacota todo o código em disco antes de subir o servidor local (gerando lentidão). O **Vite** utiliza **ES Modules (ESM) nativos do navegador** para servir o código sob demanda durante o desenvolvimento, utilizando o compilador *esbuild* escrito em Go para dependências pesadas. Isso reduz o tempo de inicialização do servidor de minutos para milissegundos e nos fornece atualizações de tela instantâneas (Hot Module Replacement - HMR) à medida que alteramos o código."*

---

## 💾 Seção 2: Modelagem e Persistência de Dados (Fase 2)

### ❓ Pergunta Esperada 4: "O SQLite é um banco baseado em arquivo. Ele é adequado para o sistema SIRILO?"
*   **A armadilha:** O avaliador pode questionar a robustez do SQLite para sistemas concorrentes (muitos proprietários votando ao mesmo tempo).
*   **A resposta blindada:**
    > *"O SQLite foi selecionado principalmente pelo princípio da **Portabilidade de Demonstração (Portability-first)**. Ele armazena os dados em um único arquivo local (`sirilo.db`), permitindo que a banca teste o projeto de forma instantânea sem precisar baixar e configurar SGBDs pesados (como PostgreSQL ou MySQL). 
    > Para o escopo do protótipo, o SQLite atende perfeitamente: ele suporta propriedades ACID, concorrência de leitura ilimitada e concorrência de escrita suficiente para assembleias locais. Caso o sistema precise escalar para produção corporativa, o uso do **Knex.js** como Query Builder garante que possamos migrar o banco de dados para PostgreSQL apenas alterando a string de conexão no `knexfile.js`, com **zero impacto** nas consultas do código backend."*

### ❓ Pergunta Esperada 5: "O SQLite não habilita chaves estrangeiras (Foreign Keys) por padrão. Como vocês garantiram a integridade referencial do banco?"
*   **A armadilha (Muito Comum):** SQLite de fato ignora chaves estrangeiras a menos que um comando pragma específico seja enviado na abertura de cada conexão. Se o grupo não souber disso, o avaliador pode mostrar que deletar um condomínio não deletou os proprietários associados.
*   **A resposta blindada:**
    > *"Tivemos essa preocupação de engenharia. No arquivo `knexfile.js`, configuramos o pool de conexões do SQLite para executar o comando `PRAGMA foreign_keys = ON` imediatamente após estabelecer qualquer conexão com o arquivo do banco. 
    > Isso garante que as restrições declaradas em nossas migrações (como chaves estrangeiras e ações `ON DELETE CASCADE` ou `SET NULL`) sejam rigorosamente validadas e cumpridas pelo motor do SQLite durante as operações de escrita."*

### ❓ Pergunta Esperada 6: "Como vocês garantem no banco que um morador não vote duas vezes?"
*   **A armadilha:** Dizer que faz uma verificação apenas no código JavaScript (Express). O avaliador dirá que, se duas requisições chegarem ao mesmo tempo (corrida de concorrência), a verificação em JS falhará.
*   **A resposta blindada:**
    > *"A unicidade do voto é protegida em **duas linhas de defesa**. 
    > A primeira linha é a validação lógica no Express. 
    > A segunda linha, que é a definitiva, é uma **restrição de chave única composta (Composite Unique Constraint)** definida diretamente na tabela `votos` de nossa migration: `table.unique(['votacao_id', 'proprietario_id'])`. 
    > Mesmo que ocorra uma condição de corrida no servidor e duas requisições passem pela validação do JavaScript simultaneamente, o banco de dados lançará um erro de constraint ao tentar inserir a segunda linha, impedindo fisicamente a duplicidade do voto."*

---

## 🛠️ Seção 3: Playbook da Demonstração Prática (Fase 2 - Carga e Reset)

### ❓ Pergunta Esperada 7: "Se eu testar a interface, votar com todos os usuários e o banco ficar poluído, como vocês limpam o banco para apresentar para outro professor?"
*   **A resposta blindada:**
    > *"Desenvolvemos um recurso exclusivo para demonstrações rápidas: o endpoint `POST /api/admin/reset-db?secret=SIRILO_RESET_SECRET` (executado no backend pelo [admin.controller.js](file:///c:/Users/jciri/OneDrive/Desktop/6%20PERIODO/ENG%20SOFT/IMPLEMENTA%C3%87%C3%83O/backend/src/controllers/admin.controller.js)). 
    > Ao disparar essa requisição, o backend executa em tempo de execução um rollback completo de todas as migrações (limpando a estrutura antiga), roda as migrações mais recentes e executa os arquivos de seed (recriando instantaneamente os usuários padrão e a reunião demo). Isso nos permite resetar a demonstração em menos de 1 segundo diretamente pela API."*

---

## 💡 Dicas de Postura Técnica para o Grupo

1.  **Nunca diga "Eu fiz assim porque o tutorial mandou":** Substitua por: *"Adotamos essa abordagem técnica para garantir desacoplamento, portabilidade de testes ou consistência com os padrões de projeto de software (Design Patterns)"*.
2.  **Sempre cite os Requisitos Funcionais (RFs):** Durante a explicação de tabelas ou código, faça ligações diretas com os requisitos documentados (ex: *"A tabela logs_auditoria foi modelada especificamente para atender ao RF4 de Auditoria do sistema"*).
3.  **Demonstre conhecimento das limitações:** Admitir que o SQLite é para portabilidade acadêmica e que as senhas estão em texto limpo apenas por facilidade do seed (e que seriam criptografadas em produção real) demonstra muito mais maturidade e honestidade intelectual do que tentar mascarar essas simplificações.
