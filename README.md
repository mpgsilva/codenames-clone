# 🎯 Codinomes — Jogo de Palavras em Equipe

Bem-vindo ao **Codinomes**, uma adaptação web multiplayer, moderna e 100% em português do clássico jogo de tabuleiro *Codenames*. 

Este projeto foi construído para que você e seus amigos possam criar uma sala em segundos, dividir os times (Azul e Vermelho), escolher seus papéis de **Espião Mestre** ou **Agente Operacional** e jogar diretamente pelo navegador — sem precisar criar conta, instalar nada ou lidar com configurações complicadas.

---

## ✨ O que torna este projeto legal?

Mais do que apenas um tabuleiro estático, o **Codinomes** cuida de toda a dinâmica de uma partida real entre amigos:

- **🏠 Salas Online com Código de 6 Dígitos:** Crie uma sala privada, personalize o nome dos times e compartilhe o código numérico com a galera.
- **🕵️ Papéis Bem Definidos:**
  - **Espião Mestre (Spymaster):** Enxerga a chave secreta de cores do tabuleiro (com opção de ocultar/mostrar a qualquer momento) e envia a dica da rodada (palavra + número de cartas associadas).
  - **Agente Operacional (Operative):** Debate com a equipe, marca cartas suspeitas e confirma os palpites no tabuleiro.
  - **Plateia (Espectador):** Para quem entrou na sala só para assistir à partida sem interferir nos times.
- **🤝 Marcação Colaborativa (Anti-Missclick):** Antes de revelar uma carta de vez, os agentes devem **marcá-la como possibilidade** (as iniciais de quem marcou aparecem no canto da carta). Só depois de marcada o botão de confirmação (`✓`) é liberado — evitando aquele clique acidental que entrega o jogo na Carta Assassina!
- **📐 Tabuleiro Flexível (`4x4` ou `5x5`):** Escolha entre partidas mais rápidas de 16 cartas (`4x4`) ou a experiência clássica oficial de 25 cartas (`5x5`), sorteando entre **+170 palavras em português**.
- **⏱️ Cronômetro e Regras Automatizadas:** Turnos de 2 minutos (120s) com troca automática caso o tempo acabe, controle de limite de palpites (`número da dica + 1`) e validação de formação dos times antes do início.
- **📜 Histórico de Dicas em Tempo Real:** Painel lateral que registra todas as dicas enviadas por cada equipe e quais palavras foram reveladas em cada turno.
- **🌗 Tema Claro e Escuro (Dark Mode):** Interface limpa, responsiva (funciona no PC e no celular) e com celebração animada em *Canvas* ao final da partida.
- **⚡ Persistência Híbrida Inteligente:** Roda localmente direto na memória (*zero-config*) e suporta **Upstash Redis** nativamente para ambientes *serverless* em produção.

---

## 🛠️ Tecnologias e Padrões Utilizados

O projeto utiliza uma stack moderna do ecossistema React/Next.js, priorizando tipagem estrita, componentização limpa e facilidade de deploy:

| Camada | Tecnologias |
| :--- | :--- |
| **Framework Full-Stack** | [Next.js 16](https://nextjs.org/) (App Router, Route Handlers, Server-Only Modules) |
| **Linguagem** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Interface & UI** | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) ([Radix UI](https://www.radix-ui.com/)) |
| **Ícones & Temas** | [Lucide React](https://lucide.dev/), `next-themes` |
| **Estado & Sincronização** | React Context API + *Short Polling* otimizado (1.5s) + persistência de sessão via `localStorage` |
| **Armazenamento (Backend)** | *In-Memory Store* (Desenvolvimento) / **Upstash Redis REST API** (Produção) |
| **Monitoramento** | Vercel Analytics & Endpoint dedicado de Healthcheck (`/api/health`) |

### 📁 Estrutura do Projeto

```text
codenames-clone/
├── app/
│   ├── api/
│   │   ├── health/route.ts          # Healthcheck do modo de armazenamento (Memória ou Redis)
│   │   └── rooms/                   # Endpoints REST para criar, entrar, atualizar e jogar nas salas
│   ├── globals.css                  # Estilos globais e tokens de cores dos times/cartas
│   ├── layout.tsx                   # Layout raiz (PT-BR, fontes Geist e Vercel Analytics)
│   └── page.tsx                     # Ponto de entrada que alterna entre Lobby e Tabuleiro
├── components/
│   ├── clue-history-panel.tsx       # Painel lateral com histórico de dicas e seleções
│   ├── confirm-action-button.tsx    # Botão com modal de confirmação para ações críticas
│   ├── game-board.tsx               # Grade de cartas, marcações de jogadores e confirmação
│   ├── game-header.tsx              # Placar, timer, input de dicas e controles da partida
│   ├── start-screen.tsx             # Tela inicial (criar/entrar em sala) e Lobby de preparação
│   ├── victory-modal.tsx            # Modal de fim de jogo com animação de confetes
│   └── ui/                          # Componentes base do shadcn/ui (Radix)
├── lib/
│   ├── server/
│   │   └── rooms-store.ts           # Motor de regras do jogo e camada de persistência (Memória/Redis)
│   ├── game-context.tsx             # Contexto global do cliente, polling e ações da partida
│   ├── game-types.ts                # Contratos e interfaces TypeScript compartilhados
│   ├── utils.ts                     # Utilitários de estilização (clsx + tailwind-merge)
│   └── words.ts                     # Banco de palavras em Português-BR
└── public/                          # Ícones e ativos estáticos
```

---

## 🚀 Como Executar Localmente

Você não precisa configurar nenhum banco de dados para rodar o projeto na sua máquina. Quando as variáveis do Redis não estão definidas, o servidor usa automaticamente o armazenamento em memória.

### Pré-requisitos
- **Node.js** `18.18+` ou `20+`
- Gerenciador de pacotes **npm** (ou `pnpm` / `yarn`)

### Passo a passo

1. **Clone o repositório e acesse a pasta:**
   ```bash
   git clone git@github.com:AzureRodrigo/codenames-clone.git
   cd codenames-clone
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   Abra [http://localhost:3000](http://localhost:3000).
   > 💡 **Dica para testar sozinho:** Abra uma aba normal e mais 3 abas anônimas (ou perfis diferentes do navegador) em `http://localhost:3000` para simular os 4 jogadores mínimos de uma partida (1 Mestre e 1 Operativo em cada time).

---

## 📜 Scripts Disponíveis

No arquivo `package.json`, você encontrará os comandos padrão do fluxo de trabalho:

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento do Next.js com *Hot Reload* em `http://localhost:3000`. |
| `npm run build` | Gera a versão otimizada de produção na pasta `.next`. |
| `npm run start` | Inicia o servidor Node.js de produção (requer rodar `npm run build` antes). |
| `npm run lint` | Executa a verificação estática de código com o ESLint. |

---

## 🔐 Variáveis de Ambiente (Opcional no Local / Recomendado em Produção)

Para desenvolvimento local, **nenhuma variável é obrigatória**. Porém, se quiser testar ou publicar usando o **Upstash Redis** (garantindo que as salas não sejam perdidas entre execuções de funções *serverless*), crie um arquivo `.env.local` na raiz do projeto:

```env
# Credenciais REST do Upstash Redis
UPSTASH_REDIS_REST_URL="https://seu-endpoint.upstash.io"
UPSTASH_REDIS_REST_TOKEN="seu-token-secreto-upstash"
```

### 🔗 Onde criar o banco e pegar essas credenciais?

Você pode gerar essas variáveis gratuitamente por dois caminhos:

1. **Direto pelo Console da Upstash:**
   - Acesse **[https://console.upstash.com/redis](https://console.upstash.com/redis)** (ou faça login em [https://console.upstash.com/](https://console.upstash.com/)).
   - Clique em **"Create Database"**, dê um nome (ex: `codinomes-db`), escolha a região mais próxima (ex: `sa-east-1` - São Paulo) e crie o banco no plano **Free**.
   - Na página de detalhes do banco criado, role até a seção **REST API** → selecione a aba **`.env`** e copie os valores de `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`.

2. **Pela Integração Oficial na Vercel:**
   - Acesse **[https://vercel.com/marketplace/upstash](https://vercel.com/marketplace/upstash)** (ou no painel do seu projeto na Vercel em **Storage** → **Create Database** → **Upstash Redis**).
   - Ao conectar o banco ao seu projeto na Vercel, as variáveis `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` já são preenchidas automaticamente nas *Environment Variables* do projeto.

> **Nota sobre expiração:** As salas salvas no Redis possuem expiração automática (**TTL de 8 horas**). No modo em memória local, salas inativas por mais de 8 horas também são limpas automaticamente pelo *garbage collector* interno.

---

## 🌐 Como Publicar (Deploy)

A forma mais simples e recomendada de colocar o **Codinomes** no ar é utilizando a **[Vercel](https://vercel.com/)** em conjunto com o **[Upstash Redis](https://console.upstash.com/redis)** (ambos possuem planos gratuitos generosos).

### Publicando na Vercel

1. Suba o seu código para um repositório no **GitHub**, **GitLab** ou **Bitbucket**.
2. Acesse o painel de criação de projeto da Vercel em **[https://vercel.com/new](https://vercel.com/new)** e importe o repositório.
3. **Configure o Banco de Estado (Importante para Serverless):**
   - Crie seu banco Redis em **[https://console.upstash.com/redis](https://console.upstash.com/redis)** ou via **[https://vercel.com/marketplace/upstash](https://vercel.com/marketplace/upstash)**.
   - No painel do projeto na Vercel (**Settings** → **Environment Variables**), adicione `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`.
4. Clique em **Deploy**!

### Verificando a Saúde do Deploy (`/api/health`)

Após publicar, você pode verificar se a aplicação está conectada corretamente ao Redis acessando a rota de diagnóstico:

```text
GET https://seu-dominio.vercel.app/api/health
```

Exemplo de resposta esperada em produção com Redis ativo:
```json
{
  "ok": true,
  "storageMode": "redis",
  "redisConfigured": true,
  "redisOk": true
}
```

---

## 🎮 Resumo Rápido das Regras da Partida

1. **Preparação:** O anfitrião cria a sala e escolhe o tamanho da grade (`4x4` ou `5x5`). Os jogadores entram com o código de 6 dígitos e se dividem entre os dois times. Cada equipe deve ter **exatamente 1 Espião Mestre** e **pelo menos 1 Agente Operacional**.
2. **A Dica:** No início do turno, o Espião Mestre do time da vez observa o mapa secreto e envia uma dica composta por **uma única palavra** (mínimo de 2 letras) e **um número** (de `1` a `9`) indicando quantas cartas do tabuleiro têm relação com aquela pista.
3. **O Debate e a Revelação:** Os Agentes Operacionais clicam nas cartas para marcá-las como suspeitas. Quando o time chega a um consenso, o agente clica no ícone `✓` no canto da carta marcada para revelá-la:
   - **Carta do seu time:** Ponto para vocês! Podem continuar tentando até atingir o limite de palpites (`número da dica + 1`) ou passar o turno.
   - **Carta Neutra (Civil) ou do Time Adversário:** O turno encerra imediatamente e passa a vez para a outra equipe.
   - **Carta Assassina 💀:** Fim de jogo instantâneo! O time que revelou o assassino perde na hora.
4. **Vitória 🏆:** Vence a equipe que encontrar todas as suas palavras primeiro (ou se o adversário esbarrar no Assassino).

---

Feito com carinho para jogar com os amigos. Divirta-se e cuidado com a carta assassina! 🕵️‍♂️✨

