# Implantar no Coolify

O Atlas roda num único container: o servidor Node serve o site, os modelos 3D e o tutor.

## 1. Criar o recurso

1. No Coolify: **+ New → Application → Public/Private Repository (GitHub)**.
2. Repositório `jorguzz-fer/atlas`, branch `main`.
3. **Build Pack: Dockerfile** (o `Dockerfile` fica na raiz).
4. **Ports Exposes:** `3000`.
5. **Domínio:** o que você quiser (ex.: `https://atlas.seudominio.com.br`). O Coolify gera o HTTPS.

## 2. Variáveis de ambiente

| Variável | Valor | Obrigatória |
|---|---|---|
| `ANTHROPIC_API_KEY` | sua chave da API do Claude (marque como *secret*) | sim, para o tutor |
| `TUTOR_MODEL` | `claude-opus-5-5` (padrão). `claude-sonnet-5-5` dá ~2,5× mais perguntas pelo mesmo valor | não |
| `TUTOR_DAILY_BUDGET_USD` | `1.00` (≈ US$ 30/mês) | não |
| `TUTOR_RATE_LIMIT_PER_HOUR` | `30` perguntas por IP por hora | não |
| `PORT` | `3000` | não |

Sem `ANTHROPIC_API_KEY`, o Atlas funciona normalmente e só o tutor fica indisponível.

## 3. Healthcheck

O container já declara `HEALTHCHECK` em `/healthz`. No Coolify, se pedir: caminho `/healthz`, porta `3000`.

## 4. Segunda trava de gasto (importante)

O tutor para sozinho ao atingir o teto diário, mas o contador zera se o container reiniciar. Defina também um **limite de gasto mensal no Console da Anthropic** (Settings → Limits), por exemplo US$ 30.

## 5. Atualizar

Cada push na `main` pode disparar um novo deploy, se você ligar *Auto Deploy* no Coolify. Também dá para clicar em **Redeploy**.
