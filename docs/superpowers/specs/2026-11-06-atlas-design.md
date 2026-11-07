# Atlas do Corpo Humano: design

Data: 2026-11-06 · Repositório: <https://github.com/jorguzz-fer/atlas>
Referência mapeada: [docs/mapeamento-atlas-corpo-humano.md](../../mapeamento-atlas-corpo-humano.md)

## 1. Intenção

Um atlas anatômico 3D **pessoal, para estudo**, em português. O layout segue o "Atlas do Corpo Humano" da Astra (print enviado pelo dono em 2026-11-06). O que muda em relação a ele: um **tutor de IA** que conhece a estrutura selecionada e a hospedagem na **VPS do dono via Coolify**. A base técnica é o projeto aberto `ashemag/human-atlas` (MIT) com os dados BodyParts3D 4.0 (CC BY 4.0).

Por quê: o dono quer uma ferramenta própria de estudo que ele controle e possa evoluir no Coolify (recursos futuros como banco, progresso e anotações), em vez de depender de um site de terceiros.

## 2. Objetivos (primeira versão)

1. Visualizar o corpo adulto masculino do BodyParts3D, com cerca de 2.230 estruturas selecionáveis, girando, aproximando e clicando.
2. Interface no layout do print (seção 5), **toda em português**, incluindo os nomes das estruturas.
3. Navegação por **Regiões / Sistemas / Camadas**, busca (atalho `/`), visualizações rápidas, mostrar e ocultar cada sistema e contador de estruturas visíveis.
4. Ações sobre a seleção: focar, isolar, afastar as estruturas (explodir), vistas Frente / Costas / Lado / Perspectiva, rótulos inteligentes e bússola de orientação.
5. **Tutor de IA** em painel lateral, com o contexto da estrutura selecionada, capaz de acender no modelo as estruturas que cita.
6. **Explorações guiadas** (tours) e **Aprender** (quiz "encontre a estrutura").
7. Página **Fonte e créditos** com as atribuições exigidas.
8. Implantação em **um container Docker no Coolify**, com a chave da API só no servidor.

## 3. Fora do escopo agora (fase 2 ou depois)

- Login e contas. O site fica aberto por decisão do dono ("pode deixar aberto por enquanto").
- Banco de dados, progresso de estudo, histórico do tutor e anotações.
- **Corpo feminino** (botões Masculino/Feminino). *Decisão minha:* exige montar o pacote de órgãos femininos do HRA e a malha de deformação, um trabalho grande à parte. Na v1 o botão aparece desabilitado com a etiqueta "em breve".
- Órgãos detalhados em GLB (os "specimens" da Astra). *Decisão minha:* os modelos e ilustrações da Astra são dela e não podem ser usados. Na v1 o carrossel "Órgãos em 3D" foca e isola o órgão do próprio BodyParts3D, com ícones próprios.
- Botão "Avaliar".

## 4. Anti-objetivos (é fracasso mesmo que funcione)

- Usar qualquer asset, ilustração, logo, marca ou arquivo servido pelo CDN da Astra. Tudo vem do BodyParts3D original, do `human-atlas` (MIT) ou é criado por nós.
- Expor a chave da API do Claude no navegador.
- Nomes anatômicos errados apresentados como certos. Uma tradução gerada por IA e não conferida precisa ser marcada como tal na interface.
- O tutor responder como se fosse orientação médica.
- Carregamento lento a ponto de travar no celular sem dar retorno. Precisa ter barra de progresso.

## 5. Layout (conforme o print)

Imagem de referência: [layout-referencia.png](layout-referencia.png). O resultado deve ficar **visualmente próximo** dela: cores, densidade, cartões, rótulos com linha de chamada e barra inferior. Não precisa ser idêntico, e nada de marca ou ilustração da Astra.

Tema escuro, três colunas mais uma barra inferior.

- **Topo:** título "Atlas do Corpo Humano", subtítulo "Biologia · Simulação" e marca própria (sem Astra). À direita: "Perguntar ao tutor", menu ⋯ e fechar/voltar.
- **Coluna esquerda (cerca de 280 px):**
  - busca "Encontre uma estrutura…" com atalho `/`;
  - carrossel "Órgãos em 3D";
  - abas Regiões / Sistemas / Camadas;
  - "Visualizações rápidas": Órgãos, Esqueleto, Músculos, Todos os sistemas;
  - lista de sistemas com contagem e um olho para mostrar ou ocultar cada um;
  - rodapé: botão "Aprender", "Rótulos inteligentes" (liga/desliga) e "Fonte e créditos".
- **Centro:**
  - canvas 3D;
  - selo "Estruturas visíveis: N" no topo esquerdo;
  - zoom −/+ e reset no topo direito;
  - rótulos com linha de chamada;
  - bússola S/I/D/E/A no canto inferior direito.
- **Barra inferior:** Frente / Costas / Lado / Perspectiva · Masculino / Feminino · controle deslizante "Afastar as estruturas" (0–100%) com reset.
- **Coluna direita (cerca de 280 px):**
  - "Explore a anatomia / Veja você mais de perto", com texto curto;
  - cartões de atalho (Coração, Cérebro, Fígado);
  - "Explorações guiadas";
  - dica de uso;
  - quando há seleção, essa coluna vira o **painel da estrutura** (nome em PT, nome em latim se houver, sistema, região, ID FMA e ações Focar / Isolar / Perguntar ao tutor).
- **Painel do tutor:** gaveta à direita, sobreposta à coluna direita.
- **Celular:** colunas viram gavetas e a barra inferior fica compacta. Precisa ser utilizável, não precisa ser perfeito.

## 6. Decisões técnicas

| Tema | Decisão | De quem |
|---|---|---|
| Base do código | Fork do código de `ashemag/human-atlas` (React 19 + three.js + shadcn/ui + Vite), mantendo o aviso MIT | minha, aceita no papo ("começar a partir do human-atlas") |
| Hospedagem | VPS do dono, Coolify, um container Docker | dono |
| Servidor | Node pequeno (Hono ou Express) que serve o build estático do Vite e a rota `/api/tutor`. Substitui o deploy Vercel/Cloudflare do original | minha |
| Login | Nenhum por enquanto | dono |
| Proteção do tutor | Limite por IP (sugestão: 30 perguntas/hora), **mais o teto global diário em dólares** (linha abaixo) e tamanho máximo de pergunta, tudo configurável por variável de ambiente. O IP vem do `X-Forwarded-For` definido pelo proxy do Coolify (Traefik), confiando apenas no primeiro salto. Ao bater o teto, o tutor avisa "volte amanhã" e o resto do Atlas segue funcionando | minha |
| Tutor | API do Claude, SDK oficial `@anthropic-ai/sdk`, com resposta em streaming. Modelo padrão `claude-opus-5-5` (US$ 4 / US$ 20 por milhão de tokens de entrada/saída), effort `low` e fallback de recusa do lado do servidor ativado. Trocável por `TUTOR_MODEL` (ex.: `claude-sonnet-5-5`, ~2,5× mais perguntas pelo mesmo valor) | dono quis o tutor; modelo é minha |
| Orçamento do tutor | **Até US$ 30/mês**. Teto diário em dólares (`TUTOR_DAILY_BUDGET_USD=1.00`), calculado pelo uso real de tokens que a API devolve em cada resposta, e não por número de perguntas. Estimativa: ~US$ 0,03 por pergunta no Opus 5.5, ou ~30 perguntas/dia. O dono também deve definir um limite de gasto no Console da Anthropic como segunda trava | dono (valor); mecanismo é minha |
| Geometria | Reusar a geometria pronta que o `human-atlas` já traz em `public/models` (`atlas.json` + `body-N.bin`/`.bin.gz`) e commitá-la no repositório. Assim o build no Coolify não baixa nada externo. Não reconstruir a partir do zip original na v1 | minha (achado do revisor) |
| Indexação | `noindex` (meta + `robots.txt`): site pessoal, fora dos buscadores | minha |
| Banco | Nenhum na v1 | minha (dono indicou fase futura) |

### Tutor
- **Entrada:** pergunta do usuário, estrutura selecionada (id, nome PT/EN, FMA, sistema, região) e as últimas mensagens da conversa (só no navegador, sem gravar no servidor).
- **Prompt de sistema:** tutor de anatomia para estudante, em português, didático; diz quando não tem certeza; não dá orientação médica.
- **Ferramentas do modelo:**
  - `find_structures(query)`: busca no catálogo, que fica no servidor;
  - `highlight_structures(ids)`: o navegador acende e enquadra essas estruturas.
  - Ponto de partida: as ferramentas que já existem em `app/agent-tools.ts`.
- **Variáveis de ambiente:** `ANTHROPIC_API_KEY`, `TUTOR_MODEL`, `TUTOR_RATE_LIMIT_PER_HOUR`, `TUTOR_DAILY_BUDGET_USD`. O contador diário fica em memória e zera à meia-noite (horário de Brasília). Reiniciar o container zera o contador; isso é aceitável na v1.

### Nomes em português e latim

**Português do Brasil**, seguindo a terminologia anatômica brasileira (grafias "esôfago", "fêmur").
- Rótulos do Wikidata em grafia europeia são normalizados para pt-BR.
- Rótulo PT ausente no Wikidata ou duvidoso → tradução por IA instruída para pt-BR e para a Terminologia Anatômica, marcada `"fonte":"ia"`.
- *Decisão minha:* o dono não revisa os nomes antes de lançar. A v1 sai com o selo "ia" como salvaguarda e com um arquivo de correções (`names.overrides.json`) que tem precedência, para corrigir nomes aos poucos durante o estudo.

- Os nomes vêm em inglês, com ID FMA, para cerca de 3.432 conceitos.
- Gerar no build um `names.pt.json` com, por ordem de preferência:
  1. rótulo PT e latim do Wikidata pelo ID FMA;
  2. tradução por IA, marcada `"fonte":"ia"`.
- Lados ("Left/Right" → "esquerdo/direito") e padrões repetitivos se resolvem por regra.
- A interface mostra um sinal discreto nos nomes de origem "ia".
- A busca encontra por PT, EN e latim.

### Explorações guiadas e quiz
- **Tours** definidos num JSON editável (passo = estrutura + texto curto). Na v1: Coração e Sistema digestório, mais um terceiro de livre escolha do construtor (ex.: Esqueleto axial).
- **Quiz "Aprender":**
  - mostra o nome e pede que o usuário clique na estrutura;
  - resultado: correto / tente de novo / revelar;
  - banco inicial de cerca de 20 estruturas de várias regiões, num JSON editável.

## 7. Restrições

- **Créditos:** atribuição CC BY 4.0 do BodyParts3D (DBCLS, Mitsuhashi et al. 2009) e aviso MIT do `human-atlas` visíveis em "Fonte e créditos" e em `ATTRIBUTION.md`.
- **Tamanho:** geometria de cerca de 33 MB comprimida. Precisa de cache longo (`immutable`), gzip servido corretamente e carregamento progressivo com barra de progresso.
- **Navegador:** WebGL2. Se faltar, mostrar uma mensagem clara.

## 8. Deixado para o construtor

- Se a geometria vai para o git comum ou para o Git LFS (são cerca de 33 MB comprimidos, mais os `.bin` não comprimidos; dá para commitar só os `.gz` se o servidor descomprimir).
- Biblioteca do servidor, gerenciamento de estado do front e estrutura de pastas.
- Ícones dos sistemas e órgãos (próprios ou lucide).
- Textos curtos dos tours e da coluna direita.

## 9. Pronto quando

- Abre no domínio da VPS pelo Coolify.
- Mostra o corpo, permite selecionar qualquer estrutura e exibe o nome em português.
- Os controles do print funcionam (exceto Feminino e os GLB, que ficam para depois).
- O tutor responde sobre a estrutura selecionada e acende estruturas no modelo.
- O quiz e os dois tours rodam.
- Os créditos estão visíveis.
