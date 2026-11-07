# Mapeamento — Atlas do Corpo Humano 3D (Astra)

Alvo: `https://app.astra-ai.co/pt-BR/lab/human-body-3d` · capturado em 2026-11-07 com REA
(Evidence `ev_e38cc0caddeb759c1e23b5f9b2633fa5a5976f7238eab606f7efd89f8232e3d0`).

## TL;DR

- **O visualizador é uma adaptação de um projeto open source (MIT):** <https://github.com/ashemag/human-atlas>, commit `1c38bf35c254a891200d3cedecfd57abebe83d8d`. A Astra mudou o renderer, os controles e a apresentação.
- **Os dados anatômicos são abertos:** BodyParts3D 4.0 (DBCLS, Japão), licença **CC BY 4.0**, com nomes e IDs FMA. A versão feminina usa os órgãos do HRA Visible Human Female (CC BY 4.0) e o MakeHuman (CC0).
- **Para montar o seu:** parta do repositório `human-atlas` e do dataset BodyParts3D original. Os dois permitem uso pessoal (e até comercial) desde que você dê os créditos. Os arquivos que a Astra serve no CDN dela são um pacote otimizado por ela; use o dataset original em vez de puxar do CDN.

## 1. Stack observada

| Camada | O que é | Evidência |
|---|---|---|
| App | Next.js (Turbopack), Sentry, tRPC, i18n via `/api/i18n/pt-BR` | URLs dos chunks e das requisições |
| Página | Componente `HumanBody3DPage`, módulo 634847, chunk `30uh2b8381gn0.js` (239 KB) | mapa de rotas em `2oyp48dkt7x2f.js` |
| 3D | three.js (`WebGLRenderer`, `InstancedMesh`, `MeshPhysicalMaterial`, OrbitControls), chunks `3klzvnmcldmbq.js` e `1grst_pqnop-f.js` | strings dos chunks |
| Geometria | meshoptimizer (`decodeVertexBuffer` / `decodeIndexBuffer`) + gzip via `DecompressionStream` | chunk `2_nmj17btdts2.js` e a página |

## 2. Dados

### Manifesto `atlas.json` (masculino, 1,35 MB)
```
version: "BodyParts3D 4.0", sex: "male"
parts: 2235 peças   chunks: 36 binários   concepts: 3423 conceitos FMA
triangles: 2.292.132 (fonte: 6.681.030; simplificado com meshoptimizer, erro máx 0,2%)
```
Cada peça:
```json
{"id":"FJ1252","name":"Gingiva of upper jaw","conceptId":"FMA59763","system":"skeletal",
 "chunk":0,"positions":0,"normals":10596,"indices":15896,
 "vertexCount":883,"indexCount":4272,"bounds":[[minX,minY,minZ],[maxX,maxY,maxZ]]}
```
`positions`, `normals` e `indices` são offsets em bytes dentro do chunk já decodificado. Unidade: metros, eixo Y para cima.

Cada conceito agrupa peças, por exemplo `{"id":"FMA3728","name":"arterial anastomosis","elements":["FJ2227",…]}`. São esses conceitos que permitem selecionar "coração" e acender todas as sub-peças dele.

**Sistemas (nº de peças):** arterial 639 · venoso 404 · muscular 402 · esquelético 302 · nervoso 139 · respiratório 119 · digestório 97 · sensorial 45 · conjuntivo 40 · cardíaco 23 · reprodutor 12 · urinário 6 · endócrino 4 · linfático 3.

### Atlas feminino (`atlas-female.json`)
São 28 peças a mais (útero, ovários, tubas, mamas, bexiga, ureteres, vagina, uretra), mais um **warp grid** (`female-warp.bin`): dois grids 3D de deslocamento (51×121×26 e 41×59×44, escala 1e-5). Com interpolação trilinear, eles deformam o esqueleto e os órgãos masculinos para a forma feminina direto no navegador.

### Formato do chunk binário `body-N.bin.gz` (verificado)
```
gzip →
  u32 magic = 0x314D4248 ("HBM1")
  u32 streamCount
  streamCount × { u32 type, u32 outOffset, u32 count, u32 encodedBytes }
     type: 0=positions (float32×3, meshopt filtro EXPONENTIAL)
           1=normals   (int16×3,   meshopt filtro OCTAHEDRAL, decodificado em 8 bytes/vértice e depois reduzido a 6)
           2=indices   (uint32,    meshopt index codec)
           3=int16x3
  …blocos codificados, um atrás do outro
```
Validado com [ferramentas/decode-hbm1.mjs](ferramentas/decode-hbm1.mjs) (meshoptimizer 1.3.0, a versão 0.22 rejeita): no chunk 0, **as 68 peças batem com os `bounds` e os índices do manifesto**, e o arquivo é consumido até o último byte. O script também exporta uma peça em `.obj`.

### Outros assets
- `organ-art-v1/{heart,brain,lungs,liver}.webp`: ilustrações dos órgãos.
- `specimens/*.glb`: modelos detalhados de órgãos, cada um com partes rotuladas e cor e posição próprias: coração, cérebro, pulmões, fígado, pâncreas, intestino delgado/grosso, rins, olho, pele.

## 3. Funcionalidades da interface (lidas do código da página)

- **Navegar** por *Regiões* / *Sistemas* / *Camadas*, com busca por nome.
  - A região é calculada pelo centro da bounding box: y > 1,45 m = cabeça · y < 0,79 = pernas · |x| > 0,175 = braços · y > 1,245 = tórax · senão abdome.
  - Camadas: músculos (muscular + conjuntivo), esqueleto e órgãos (todo o resto), cada uma com opacidade própria.
- **Selecionar** um conceito acende todas as peças dele com um tom azulado no shader (`mix(rgb, vec3(.42,.52,.95), selected*.28)`).
- **Focar**: o resto do corpo cai para opacidade 0,025. **Isolar** esconde o resto. **Explodir** afasta as peças do centro. Há também auto-rotação.
- **Modo fantasma (raio-X)**: um material "ghost" por sistema, ao lado do "solid".
- **Rótulos inteligentes**: projeção da bounding box na tela, escondendo rótulos que ficam pequenos, distantes ou fora do quadro.
- **Masculino/Feminino** com o warp descrito acima.
- **Nomes em latim**: dicionário embutido de cerca de 636 termos (inglês → latim + código), ex.: `abdominal aorta → aorta abdominalis`.
- **Tours guiados**:
  - Coração: coração → átrio direito → ventrículo direito → átrio esquerdo → ventrículo esquerdo.
  - Digestório: esôfago → estômago → intestino delgado → intestino grosso.
- **Desafio (quiz)**: "encontre o órgão". Alvos: estômago, cérebro, fêmur direito, pâncreas, úmero esquerdo. Resultados possíveis: correto / tente de novo / revelado.
- **Visualizador de espécime**: abre o GLB do órgão com as partes clicáveis, ex.: o coração com aorta, átrios, ventrículos e ápice.

## 4. Roteiro sugerido para o seu Atlas

1. Clonar `ashemag/human-atlas` (MIT) e ver como ele empacota os chunks. É bem provável que o script de build gere exatamente esse formato HBM1.
2. Baixar `isa_BP3D_4.0_obj_99.zip` + tabelas IS-A/PART-OF em <https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html>.
3. Pipeline: OBJ (mm, Z para cima) → metros, Y para cima → meshoptimizer `simplify` (erro 0,002) → encode → chunks + `atlas.json`.
4. Front: three.js / react-three-fiber. Use um material por sistema e um uniform/textura de visibilidade por peça. É isso que permite focar, isolar e ativar o modo fantasma sem recriar malhas.
5. Extras para estudo: nomes em PT-BR e latim, seus próprios tours e quizzes, e modo de repetição espaçada.
6. **Créditos obrigatórios:** BodyParts3D © DBCLS (CC BY 4.0) e o aviso MIT do `human-atlas`.

## 5. Limites desta análise

- A captura de rede ficou incompleta: o limite de memória de eventos foi atingido a partir da requisição 103 e os corpos acima de 64 KB não foram retidos. Por isso `atlas.json`, `attribution-2.txt` e três chunks JS foram baixados à parte, direto das URLs públicas que a própria página carregou.
- Os chunks do three.js não foram analisados em detalhe. Shaders e iluminação estão só parcialmente lidos.
- Nada foi clicado: as funcionalidades da seção 3 vêm da leitura estática do código, não de execução observada.
