import Anthropic from '@anthropic-ai/sdk';
import type {LlmTurn} from './routes';

/** Real model turn on the Claude API: streamed text, low effort, server-side refusal fallback. */
export function createClaudeTurn(opts: {apiKey: string; model: string}): LlmTurn {
  const client = new Anthropic({apiKey: opts.apiKey});
  return async ({system, messages, tools, onText}) => {
    const stream = client.beta.messages.stream({
      model: opts.model,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {effort: 'low'},
      // Stable system prompt + tools first, so they are cached across questions.
      system: [{type: 'text', text: system, cache_control: {type: 'ephemeral'}}],
      tools: tools as Anthropic.Beta.BetaTool[],
      messages: messages as Anthropic.Beta.BetaMessageParam[],
    } as Anthropic.Beta.Messages.MessageCreateParamsStreaming);
    stream.on('text', onText);
    const message = await stream.finalMessage();
    return {
      content: message.content as unknown as Anthropic.ContentBlock[],
      stop_reason: message.stop_reason,
      usage: message.usage,
      model: message.model,
    };
  };
}
