# @ara-peaha-ai/orchestrator

`orchestrator` é o repositório orquestrador do [PE'AHA](https://github.com/ara-peaha-ai). Ele reúne rails de pagamento, fluxos de negócio e serviços de suporte em um único workspace baseado em Nuxt.

Este repositório ainda está sendo limpo e deve ser lido como uma base inicial do orquestrador, não como um produto finalizado.

## Estrutura

```text
/
├── nuxt.config.js      app Nuxt raiz — carrega todos os módulos do workspace
├── app.vue
├── pages/
├── server/
├── rails/              módulos de rails de pagamento
├── flows/              módulos de fluxos de negócio
├── services/           módulos de serviços de infraestrutura
└── utils/              utilitários compartilhados
```

## O que existe hoje

### Rails

Módulos de rails de pagamento. Cada um injeta páginas, composables e handlers de servidor no app host, e também pode rodar de forma standalone como servidor Nitro.

| Package | Page | API |
|---------|------|-----|
| `@ara-peaha-ai/template` (`rails/template`) | `/rails/template` | `/api/rails/template` |
| `@ara-peaha-ai/peach` (`rails/peach`) | `/rails/peach` | `/api/rails/peach/*` |
| `@ara-peaha-ai/robosats` (`rails/robosats`) | `/rails/robosats` | `/api/rails/robosats/*` |

### Flows

Módulos de funcionalidades de nível superior com páginas e componentes de UI.

| Package | Pages |
|---------|-------|
| `@ara-peaha-ai/booking` (`flows/booking`) | `/flows/booking`, `/flows/booking/embed` |

### Services

Módulos de infraestrutura que funcionam tanto como app Nitro standalone quanto como módulo Nuxt embutível.

| Package | Routes | Notes |
|---------|--------|-------|
| `@ara-peaha-ai/tor` (`services/tor`) | `/api/tor`, `/api/tor/**` | Proxy reverso Tor, desativado por padrão |
| `@ara-peaha-ai/market` (`services/market`) | `/api/market/**` | Agregador de ofertas sem KYC (Bisq, RoboSats, Peach), desativado por padrão |

## O que isto não é

- Não é um cloud finalizado
- Não é um SDK público polido
- Ainda não é estável o bastante para prometer uso amplo em produção

## Desenvolvimento local

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

## Carregamento de módulos

O app Nuxt raiz (`nuxt.config.js`) lista os módulos do workspace no array `modules`. Cada módulo registra automaticamente suas páginas, composables e handlers de servidor quando o app inicia. Adicionar um módulo exige duas mudanças:

1. Adicionar `"@ara-peaha-ai/<name>": "workspace:*"` às dependências do `package.json` raiz
2. Adicionar `'@ara-peaha-ai/<name>'` ao array `modules` em `nuxt.config.js`

`flows/booking` requer `@nuxt/ui`. Ele deve estar presente em `nuxt.config.js` antes ou junto com o módulo booking.

## Variáveis de ambiente

### `services/tor`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_TOR_PROXY_SECRET` | yes | — | Segredo compartilhado enviado no header `X-Tor-Proxy-Secret` |
| `NUXT_TOR_SOCKS_URL` | no | `socks5h://127.0.0.1:9050` | URL SOCKS5h do daemon Tor local |

### `rails/robosats`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_ROBOSATS_COORDINATOR_URL` | no | onion padrão do RoboSats | URL base onion do coordenador |
| `NUXT_TOR_PROXY_SECRET` | yes | — | Segredo compartilhado para o proxy embutido `@ara-peaha-ai/tor` |
| `NUXT_TOR_SOCKS_URL` | no | `socks5h://127.0.0.1:9050` | URL SOCKS5h do daemon Tor local |

### `rails/peach`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_PEACH_BASE_URL` | no | `https://api.peachbitcoin.com` | URL base da API do Peach |
| `NUXT_PEACH_BITCOIN_MNEMONIC` | yes | — | Mnemonic BIP39 para derivação de chaves da wallet |
| `NUXT_PEACH_PGP_PRIVATE_KEY` | yes | — | Chave privada PGP armored |
| `NUXT_PEACH_PGP_PUBLIC_KEY` | yes | — | Chave pública PGP armored |
| `NUXT_PEACH_PGP_PASSPHRASE` | yes | — | Passphrase da chave PGP |
| `NUXT_PEACH_REFERRAL_CODE` | no | — | Código de referral do Peach |
| `NUXT_PEACH_FEE_RATE` | no | `hourFee` | Estratégia de fee rate do Bitcoin |
| `NUXT_PEACH_MAX_PREMIUM` | no | `0` | Prêmio máximo aceito para ofertas |

### `services/market`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NUXT_TOR_PROXY_SECRET` | yes | — | Segredo de autenticação para o handler inline do proxy Tor |
| `NUXT_ROBOSATS_COORDINATOR_ONION_URL` | no | onion padrão do RoboSats | Endereço onion do coordenador do RoboSats |
| `NUXT_TOR_SOCKS_URL` | no | `socks5h://127.0.0.1:9050` | URL SOCKS5h do daemon Tor local |

## Problemas conhecidos

- Incompatibilidade de versão de `@nuxt/kit`: `rails/peach`, `rails/robosats` e `services/tor` declaram `@nuxt/kit ^3.13.0`, enquanto o app raiz e `rails/template`, `flows/booking` usam `^4.0.0`. Os módulos funcionam em modo módulo por meio da própria instância de kit do Nuxt, mas a migração completa standalone para `^4.0.0` ainda está pendente.
