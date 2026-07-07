# Fase 1: Configuração do Ambiente e Inicialização do Projeto

Este documento de engenharia descreve exclusivamente a **Fase 1 (Setup do Ambiente e Conectividade)** do sistema **SIRILO**. Ele justifica a escolha de cada tecnologia e dependência instalada nesta etapa, conceitua a necessidade do banco de dados no sistema e orienta o processo de inicialização do projeto.

---

## 1. Análise de Necessidade: Por que usar um Banco de Dados no SIRILO?

Uma dúvida comum em protótipos acadêmicos é se a criação de um banco de dados real é necessária ou se um armazenamento temporário em memória (RAM) bastaria. Para o SIRILO, a decisão de implementar um banco de dados relacional físico (SQLite) é técnica e estrategicamente justificada pelos seguintes pontos:

### 1.1. Unicidade e Integridade do Voto (RF18)
O sistema exige que cada proprietário (ou procurador) vote no máximo uma vez por pauta.
*   **Em Memória:** Se o servidor Express reiniciar por qualquer motivo durante a demonstração (queda de energia, reconfiguração, ou o recarregamento automático do `nodemon` ao salvar um arquivo), todo o histórico de votos e logs seria zerado, permitindo que usuários votassem novamente.
*   **Com Banco de Dados:** O registro do voto é gravado de forma definitiva no arquivo `backend/sirilo.db`. Mesmo que o backend caia ou reinicie, o estado atual da assembleia e a integridade das regras são preservados.

### 1.2. Fórmulas de Peso e Cruzamento de Dados (RF19)
O cálculo do resultado de uma votação não é uma contagem simples de votos. O peso do voto depende da fração ideal do lote (Terreno = Peso 1.0, Casa = Peso 2.0) e da adimplência do proprietário (Inadimplente = Peso 0.0).
*   **Em Memória:** Exigiria a manutenção de arrays e filtros complexos em JavaScript na memória do servidor para cruzar chaves estrangeiras entre proprietários, lotes e votos.
*   **Com Banco de Dados:** A estrutura relacional permite cruzar essas tabelas de forma robusta e otimizada utilizando *Foreign Keys* (Chaves Estrangeiras) e realizar somas ponderadas (`SUM(peso_aplicado)`) diretamente nas consultas do banco de dados, garantindo consistência e limpeza no código.

### 1.3. Requisito de Auditoria Técnica (RF4)
O sistema precisa auditar todas as ações, registrando o IP e o `User-Agent` (navegador) do votante. 
*   Manter um histórico de auditoria confiável exige persistência. O banco de dados garante que a trilha de auditoria permaneça intacta e consultável a qualquer momento através de uma tabela dedicada (`logs_auditoria`).

### 1.4. Por que o SQLite?
Para equilibrar a necessidade de um banco relacional com a simplicidade exigida por um protótipo escolar, a escolha perfeita é o **SQLite**:
*   **Sem Instalação:** Ele roda como uma biblioteca interna do Node.js. O banco de dados inteiro reside em um único arquivo (`sirilo.db`) dentro do diretório do backend (`backend/sirilo.db`), garantindo portabilidade total sem a necessidade de instalar ou gerenciar um servidor de banco de dados externo (como MySQL ou Postgres).
*   **Facilidade de Reset:** Na demonstração prática, se você quiser limpar todos os votos e reiniciar o teste do zero para a banca, basta apagar o arquivo `backend/sirilo.db` e rodar as migrações/seeds novamente.

---

## 2. Justificativa Detalhada das Tecnologias da Fase 1

Na Fase 1, o objetivo é estabelecer as fundações do projeto através da criação de um ambiente monorepo simplificado e verificar a conectividade local entre o cliente (Frontend) e o servidor (Backend). Abaixo está o detalhamento técnico e a justificativa para cada tecnologia e dependência instalada nesta fase:

### 2.1. Tecnologias Principais (Stack Base)
*   **Node.js (Backend Runtime):** Ambiente de execução JavaScript no servidor. Foi escolhido porque permite utilizar a mesma linguagem de programação (JavaScript) em todo o ecossistema do projeto (frontend e backend), reduzindo o contexto cognitivo de desenvolvimento e facilitando a integração de dados no formato JSON.
*   **React.js (Frontend SPA):** Biblioteca para construção de interfaces SPA (Single Page Application). Sua escolha para a Fase 1 justifica-se pela facilidade de gerenciar estados dinâmicos (como o status da conexão que muda de "conectando" para "online" ao receber a resposta da API) e criar componentes de UI isolados que se atualizam de forma reativa.
*   **Express.js (Framework Backend):** Micro-framework web minimalista para Node.js. Justifica-se na Fase 1 por fornecer uma infraestrutura baseada em roteamento HTTP e middlewares extremamente leve, permitindo criar um servidor funcional e expor a rota de verificação de status (`/api/status`) em poucas linhas de código e sem configurações complexas.
*   **Vanilla CSS (Estilização):** O uso de CSS puro, utilizando variáveis nativas (`:root`), é a escolha estratégica para a estilização visual premium na Fase 1. Ao evitar frameworks pesados (como TailwindCSS), simplificamos o pipeline de compilação inicial e garantimos flexibilidade total para aplicar efeitos de *glassmorphism* e gradientes modernos de forma nativa e sem overhead de carregamento.

### 2.2. Gerenciamento e Drivers de Banco de Dados (Instalados no Setup)
Embora as tabelas sejam modeladas na Fase 2, a base da persistência é instalada na Fase 1 para garantir a integridade estrutural do ambiente desde o primeiro dia:
*   **SQLite (pacote `sqlite3`):** Driver de banco de dados relacional baseado em arquivo local. É justificado para o setup porque armazena todos os dados em um único arquivo local (`backend/sirilo.db`), eliminando a necessidade de instalar, gerenciar e expor portas de servidores de banco de dados externos (como PostgreSQL ou MySQL). Isso garante portabilidade total para o protótipo.
*   **Knex.js (pacote `knex`):** Query Builder e gerenciador de migrações SQL. É incluído na Fase 1 para criarmos o arquivo de configuração de banco (`knexfile.js`), preparando o ecossistema para rodar o versionamento de tabelas (*Migrations*) e sementes de teste (*Seeds*) a partir da próxima etapa de desenvolvimento.

### 2.3. Dependências de Desenvolvimento e Integração
*   **CORS (pacote `cors`):** Middleware para habilitar o compartilhamento de recursos entre origens distintas. No fluxo padrão do projeto, o frontend React utiliza o Proxy Reverso do Vite para redirecionar chamadas `/api` no nível do servidor (evitando a ocorrência de CORS no navegador). O middleware `cors` é instalado no backend Express como uma flexibilização adicional para permitir requisições diretas de ferramentas externas de testes (como Postman/Insomnia) ou chamadas diretas via IP na rede local sem passar pelo proxy do Vite.
*   **nodemon (Backend Dev Dependency):** Ferramenta utilitária de desenvolvimento que monitora alterações em arquivos de código do backend. A sua instalação na Fase 1 é justificada porque reinicia o servidor Express automaticamente a cada salvamento, otimizando o tempo durante o desenvolvimento inicial.
*   **Vite (Frontend Dev Dependency / Bundler):** Ferramenta moderna de build para o frontend que substitui o antigo `create-react-app`. Justifica-se na Fase 1 por usar módulos ES nativos (*ES Modules*) no navegador, fornecendo uma inicialização instantânea do servidor de desenvolvimento e atualizações de tela ultra-rápidas (*Hot Module Replacement*).
*   **concurrently (Root Dev Dependency):** Orquestrador de scripts npm. É instalado no package.json da pasta raiz na Fase 1 para resolver a necessidade de abrir múltiplos terminais separados. Com o `concurrently`, o desenvolvedor executa um único comando (`npm run dev`) e o terminal inicia e gerencia o frontend e o backend em paralelo, diferenciando os logs de cada um por prefixos coloridos.

---

## 3. Estrutura de Pastas de Setup (Monorepo)

A estrutura de arquivos criada na Fase 1 para acomodar esses componentes e suas dependências é a seguinte:

```text
sirilo-project/
├── backend/                  # API REST (Node.js + Express)
│   ├── src/
│   │   └── server.js         # Ponto de entrada do backend Express
│   ├── package.json          # Dependências do backend (express, cors, sqlite3, knex)
│   └── knexfile.js           # Arquivo de configuração de persistência básica do Knex
├── frontend/                 # Interface Gráfica SPA (React + Vite)
│   ├── src/
│   │   ├── App.jsx           # Componente principal do React com teste de fetch relativo
│   │   └── main.jsx
│   ├── package.json          # Dependências do frontend (react, react-dom, vite)
│   └── vite.config.js        # Configuração do Vite (Proxy Reverso e Host de Rede)
├── package.json              # Orquestrador raiz (contém o concurrently)
└── README.md
```

---

## 4. Passo a Passo da Configuração e Boilerplate da Fase 1

### Passo 4.1: Inicializando o Projeto Raiz
Na pasta de trabalho principal:
1. Inicialize o projeto raiz:
   ```bash
   npm init -y
   ```
2. Instale o orquestrador `concurrently`:
   ```bash
   npm install concurrently --save-dev
   ```
3. Edite o `package.json` raiz para conter a automação dos scripts:
   ```json
   {
     "name": "sirilo-root",
     "version": "1.0.0",
     "description": "Orquestrador do Projeto SIRILO",
     "scripts": {
       "install-all": "npm install && npm install --prefix backend && npm install --prefix frontend",
       "dev": "concurrently \"npm run dev --prefix backend\" \"npm run dev --prefix frontend\""
     },
     "devDependencies": {
       "concurrently": "^8.2.2"
     }
   }
   ```

### Passo 4.2: Configurando o Backend (Express, CORS, SQLite3, Knex)
1. Crie a pasta do backend e inicialize-a:
   ```bash
   mkdir backend
   cd backend
   npm init -y
   mkdir src
   ```
2. Instale as dependências essenciais do servidor e banco de dados:
   ```bash
   npm install express cors sqlite3 knex
   npm install nodemon --save-dev
   ```
3. Configure o script de inicialização do backend no `backend/package.json`:
   ```json
   "scripts": {
     "dev": "nodemon src/server.js"
   }
   ```
4. Crie o arquivo de configuração básica do Knex em `backend/knexfile.js` para persistência em SQLite:
    ```javascript
    const path = require('path');

    module.exports = {
      development: {
        client: 'sqlite3',
        connection: {
          filename: path.resolve(__dirname, 'sirilo.db')
        },
        useNullAsDefault: true,
        pool: {
          afterCreate: (conn, cb) => {
            conn.run('PRAGMA foreign_keys = ON', cb);
          }
        },
        migrations: {
          directory: path.resolve(__dirname, 'src', 'database', 'migrations')
        },
        seeds: {
          directory: path.resolve(__dirname, 'src', 'database', 'seeds')
        }
      }
    };
    ```
5. Crie o arquivo básico em `backend/src/server.js` para servir a rota de teste de conexão:
   ```javascript
   const express = require('express');
   const cors = require('cors');

   const app = express();
   const PORT = process.env.PORT || 3001;

    // Habilita o CORS para permitir conexões e testes diretos na API por rede local
    app.use(cors());
    app.use(express.json());

   // Endpoint simples de status para validação da conectividade
   app.get('/api/status', (req, res) => {
     res.json({ 
       status: 'online', 
       message: 'Comunicação com o Backend do SIRILO estabelecida!' 
     });
   });

    // Inicia a escuta no localhost (127.0.0.1) para segurança. O tráfego externo é gerido pelo proxy do Vite.
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`[Backend] Express ativo localmente na porta ${PORT}`);
    });
   ```

### Passo 4.3: Configurando o Frontend (React + Vite + Proxy)
1. Navegue de volta para a pasta raiz e inicialize o template de React pelo Vite:
   ```bash
   cd ..
   npx -y create-vite@latest frontend --template react
   ```
2. Acesse a pasta do frontend e instale as dependências:
   ```bash
   cd frontend
   npm install
   ```
3. Edite o arquivo `frontend/vite.config.js` para habilitar a exposição na rede local (essencial para acesso via celular) e configurar o **Proxy Reverso** (evita hardcode de IPs no código):
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     server: {
       host: true,      // Permite que outros computadores/celulares na mesma rede acessem o frontend
       port: 5173,
       proxy: {
         '/api': {      // Encaminha requisições que começam com /api para o backend Express
           target: 'http://127.0.0.1:3001',
           changeOrigin: true,
           secure: false
         }
       }
     }
   })
   ```
4. Substitua o conteúdo de `frontend/src/App.jsx` por este código de validação usando chamada relativa:
   ```jsx
   import React, { useEffect, useState } from 'react';

   function App() {
     const [status, setStatus] = useState('Estabelecendo conexão...');

     useEffect(() => {
       // O proxy reverso do Vite redireciona '/api' para 'http://127.0.0.1:3001/api' automaticamente.
       // Isso resolve o problema de conexões via celular (que falhariam se chumbássemos 'localhost').
       fetch('/api/status')
         .then((res) => res.json())
         .then((data) => setStatus(`${data.message} [Status: ${data.status.toUpperCase()}]`))
         .catch(() => setStatus('Falha de conexão: Verifique se o backend está ativo.'));
     }, []);

     return (
       <div style={{
         fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif',
         display: 'flex',
         flexDirection: 'column',
         alignItems: 'center',
         justifyContent: 'center',
         height: '100vh',
         background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
         color: '#f8fafc',
         textAlign: 'center'
       }}>
         <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', color: '#38bdf8' }}>SIRILO</h1>
         <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '2rem' }}>
           Fase 1: Configuração e Validação de Conectividade
         </p>
         
         <div style={{
           padding: '24px',
           borderRadius: '16px',
           background: 'rgba(30, 41, 59, 0.7)',
           border: '1px solid rgba(255, 255, 255, 0.1)',
           boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
           maxWidth: '450px',
           backdropFilter: 'blur(8px)'
         }}>
           <h3 style={{ marginTop: 0, color: '#f1f5f9' }}>Status de Conectividade:</h3>
           <p style={{ margin: 0, color: '#10b981', fontWeight: 'bold' }}>{status}</p>
         </div>
       </div>
     );
   }

   export default App;
   ```

---

## 5. Instruções de Execução e Teste

Para validar a correta inicialização do ambiente e as dependências da Fase 1:

1. Acesse a pasta raiz do projeto (`sirilo-project`) pelo seu terminal.
2. Execute o comando:
   ```bash
   npm run dev
   ```
3. O `concurrently` abrirá o servidor Express na porta `3001` e o Vite na porta `5173` simultaneamente no mesmo console.
4. Abra o navegador e navegue até `http://localhost:5173`.
5. Se a caixa informativa exibir a mensagem *"Comunicação com o Backend do SIRILO estabelecida! [Status: ONLINE]"*, a Fase 1 foi executada e configurada com 100% de sucesso.

---

## 6. Análise de Riscos e Mitigações (Fase 1)

Durante o setup inicial do ambiente, alguns riscos técnicos comuns podem impedir o funcionamento correto da conectividade cliente-servidor. Abaixo estão listados os principais riscos da Fase 1 e como mitigá-los:

### 6.1. Conflito de Portas de Rede
*   **Problema:** O Express tenta usar a porta `3001` ou o Vite tenta usar a porta `5173`, mas elas já estão ocupadas por outros processos.
*   **Risco de Forçar Encerramento (`taskkill`):** Matar um processo abruptamente (`taskkill /F` ou `kill -9`) pode causar problemas se o processo que está ocupando a porta for um serviço importante do sistema ou outra aplicação de trabalho ativa (ex: outra instância do VS Code ou outro projeto Node rodando em segundo plano), resultando em perda de dados não salvos.
*   **Mitigação Segura (Recomendada):**
    1.  **Identificação Prévia:** Sempre verifique o que está rodando na porta antes de matá-la. Use `netstat -ano | findstr :3001` para achar o ID do Processo (`PID`). Vá na aba *Detalhes* do Gerenciador de Tarefas do Windows, localize o PID e veja qual aplicativo é (se for uma aba perdida do terminal Node, você pode fechar normalmente de forma manual).
    2.  **Uso de Portas Alternativas (Sem derrubar nada):**
        *   **No Express (Backend):** Mude a porta na constante do arquivo `server.js` (ex: de `3001` para `3002`).
        *   **No Vite (Frontend - Importante):** Se você alterar a porta do backend no `server.js`, você **deve obrigatoriamente** atualizar a chave `target` do proxy no arquivo `frontend/vite.config.js` para corresponder à nova porta (ex: `target: 'http://127.0.0.1:3002'`). Caso contrário, a conectividade cliente-servidor deixará de funcionar.
        *   **Fixando Portas no Frontend:** O Vite detecta automaticamente se a porta `5173` está em uso e pergunta se você deseja abrir em outra. Para fixar uma porta alternativa no frontend mantendo o proxy ativo, ajuste o arquivo `frontend/vite.config.js`:
            ```javascript
            import { defineConfig } from 'vite'
            import react from '@vitejs/plugin-react'

            export default defineConfig({
              plugins: [react()],
              server: {
                host: true,
                port: 5174, // Força o Vite a rodar em uma porta alternativa fixa
                proxy: {
                  '/api': {
                    target: 'http://127.0.0.1:3001', // Deve corresponder à porta ativa do backend
                    changeOrigin: true,
                    secure: false
                  }
                }
              }
            })
            ```

### 6.2. Incompatibilidade de Versões do Runtime Node.js
*   **Problema:** O Vite ou o Knex falham ao rodar scripts de compilação/execução devido à utilização de uma versão obsoleta do Node.js instalada no computador de desenvolvimento.
*   **Mitigação:** Padronizar o ambiente do grupo para usar o **Node.js LTS v18 ou v20+**. Verifique a versão rodando `node -v` no terminal antes de instalar as dependências.

### 6.3. Bloqueio de Rede Local pelo Firewall do Windows
*   **Problema:** O frontend Vite é exposto na Fase 1 com `host: true` (porta `5173`) para permitir que dispositivos móveis acessem o cliente. No entanto, o Firewall do Windows pode bloquear conexões de entrada de IPs externos na porta do Vite.
*   **Impacto da Mudança de Portas:** Se as portas forem alteradas para evitar conflitos (ex: usando `5174`), regras de firewall baseadas em portas estáticas deixarão de funcionar, bloqueando as conexões dos dispositivos móveis.
*   **Mitigação (Liberação Dinâmica por Programa):**
    1.  Configure o perfil de rede do Windows como **Privado** (não Público) na mesma rede Wi-Fi onde os testes em tempo real serão realizados.
    2.  Em vez de criar regras para portas específicas (que quebram ao mudar de porta), adicione uma regra de entrada no Firewall do Windows que libere o executável do **Node.js (`node.exe`)**. Como o Vite roda sob o Node, o Windows permitirá conexões de entrada automaticamente em *qualquer* porta de frontend selecionada pelo projeto no momento.

### 6.4. Segurança do Host e Binding do Backend no Localhost (Interface 127.0.0.1)
*   **Problema:** O backend Express escuta apenas na interface de loopback local (`127.0.0.1`), blindando a API direta de conexões externas. Embora isso evite que atacantes acessem a API diretamente em redes públicas (como a Wi-Fi da universidade), o servidor Vite (que atua como proxy reverso) ainda está exposto na porta `5173`.
*   **Mitigação:** É altamente recomendável realizar os testes de integração em dispositivos móveis e a própria apresentação sob uma rede Wi-Fi privada e controlada (por exemplo, compartilhando a rede móvel de um celular através do recurso de Ponto de Acesso / Roteador Wi-Fi pessoal). Isso impede acessos não autorizados ao frontend do Vite por parte de terceiros na rede e garante maior estabilidade e imunidade a oscilações.

---

## 7. Definição de Pronto (Definition of Done - DoD) da Fase 1

Para garantir que a equipe possua uma base estável antes de passar para a **Fase 2 (Modelagem e Persistência do Banco)**, a Fase 1 deve atender rigidamente aos seguintes critérios de aceitação:

1.  **Ausência de Erros de Comunicação (CORS):** O console do navegador (F12) no frontend não deve apresentar nenhum aviso de bloqueio de política CORS ao consultar a API.
2.  **Clean Compile:** O terminal não deve reportar avisos (*Warnings*) de compilação ou falhas de dependência no bundler do Vite ou no Node/Express.
3.  **Estrutura Monorepo Isolada:** A dependência `concurrently` deve residir exclusivamente no `package.json` raiz (`devDependencies`), enquanto `express`, `knex` e `sqlite3` devem estar somente no `backend/package.json`, mantendo a separação de responsabilidades.
4.  **Versionamento Limpo (.gitignore):** O arquivo `.gitignore` na raiz do projeto deve estar configurado para ignorar as pastas `node_modules/`, subpastas de compilação (`dist/`) e arquivos de banco temporários (ex: `backend/*.db` ou regras como `*.db`), prevenindo o commit acidental de arquivos binários ou dependências gigantescas no repositório Git.
5.  **Status Conectado na UI:** O frontend deve renderizar a tela de validação e exibir dinamicamente o status retornado em JSON pelo backend (`[Status: ONLINE]`).
