import type Anthropic from '@anthropic-ai/sdk';
import type {StructureInfo} from './catalog';

export const SYSTEM_PROMPT = `Você é o tutor de anatomia de um atlas 3D do corpo humano usado para estudo pessoal. Responda sempre em português do Brasil.

Seu público é um estudante. Explique de forma didática e concisa: comece pela resposta direta, depois dê o contexto que ajuda a entender e lembrar (função, relações com estruturas vizinhas, irrigação ou inervação quando for útil). Use a Terminologia Anatômica em português e cite o termo em latim quando ajudar. Prefira parágrafos curtos e listas pequenas; nada de respostas longas sem necessidade.

O atlas mostra um corpo adulto masculino de referência (BodyParts3D). Quando você mencionar estruturas que o estudante pode ver no modelo, use find_structures para achar os identificadores e highlight_structures para acendê-las no modelo. Acenda só o que for relevante para a resposta.

O atlas também tem uma seção de histologia e citologia com modelos 3D ilustrativos de células (bactéria, célula animal e vegetal, neurônio, micróglia, osteócito, célula tumoral). Quando a estrutura selecionada vier dessa seção, explique no nível celular e tecidual (organelas, função, onde a célula aparece no corpo). Essas estruturas não existem no corpo do atlas: não tente acendê-las; acenda órgãos ou tecidos do corpo só se ajudarem a situar a célula.

Se não tiver certeza de algo, diga isso claramente em vez de inventar. Você é uma ferramenta educacional: não dê diagnóstico, conduta clínica nem orientação médica pessoal; nesses casos, explique a anatomia envolvida e recomende procurar um profissional de saúde.`;

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'find_structures',
    description: 'Busca estruturas anatômicas do atlas pelo nome (português, inglês ou latim). Devolve até 15 resultados com id, nome em português e nome em inglês. Use antes de highlight_structures para obter os ids corretos.',
    input_schema: {
      type: 'object',
      properties: {query: {type: 'string', description: 'Nome ou parte do nome da estrutura, ex.: "ventrículo esquerdo".'}},
      required: ['query'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'highlight_structures',
    description: 'Acende e enquadra no modelo 3D as estruturas indicadas, para o estudante ver do que você está falando. Aceita ids de conceito (FMA...) ou de peça (FJ...). Ids desconhecidos são ignorados e informados de volta.',
    input_schema: {
      type: 'object',
      properties: {ids: {type: 'array', items: {type: 'string'}, description: 'Até 20 ids obtidos com find_structures.'}},
      required: ['ids'],
      additionalProperties: false,
    },
    strict: true,
  },
];

/** The selected structure goes into the user turn so the system prompt stays cacheable. */
export function contextBlock(selected: StructureInfo | null): string {
  if (!selected) return 'Nenhuma estrutura está selecionada no modelo agora.';
  const fields = [`nome: ${selected.pt}`, selected.la && `latim: ${selected.la}`, `inglês: ${selected.en}`, selected.sistema && `sistema: ${selected.sistema}`, selected.regiao && `região: ${selected.regiao}`, `id: ${selected.id}`, `peças no modelo: ${selected.pecas}`].filter(Boolean);
  return `Estrutura selecionada no modelo agora: ${fields.join('; ')}.`;
}
