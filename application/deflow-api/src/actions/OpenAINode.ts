import OpenAI from 'openai';
import { ActionNode } from '../utils/ActionNode';
import { NodeMessage } from '../utils/NodeMessage';

export interface OpenAIParams {
  api_key: string;
  prompt: string;
  model?: string; // Modelo a ser usado (opcional, padrão: gpt-3.5-turbo)
  max_tokens?: number; // Máximo de tokens na resposta (opcional)
  temperature?: number; // Criatividade da resposta 0-1 (opcional)
}

export class OpenAINode extends ActionNode {
  name = 'OpenAINode';
  description = 'Conecta com a API da OpenAI para gerar respostas usando GPT';

  private readonly params: OpenAIParams;
  private client: OpenAI;

  constructor(params: OpenAIParams) {
    super();
    if (!params || !params.api_key) {
      throw new Error('OpenAINode requires a valid api_key in constructor');
    }
    if (!params.prompt) {
      throw new Error('OpenAINode requires a valid prompt in constructor');
    }
    this.params = {
      model: 'gpt-3.5-turbo',
      max_tokens: 1000,
      temperature: 0.7,
      ...params,
    };

    this.client = new OpenAI({
      apiKey: this.params.api_key,
    }) as OpenAI;
  }

  async execute(message: NodeMessage): Promise<NodeMessage> {
    try {
      console.log(`🤖 OpenAI: Enviando prompt para ${this.params.model}...`);

      // Permite usar variáveis do payload na prompt
      let processedPrompt = this.params.prompt;

      // Substitui variáveis no formato {{variable}} pelos valores do payload
      if (message.payload) {
        Object.entries(message.payload).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          if (processedPrompt.includes(placeholder)) {
            processedPrompt = processedPrompt.replace(
              new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
              String(value),
            );
          }
        });
      }

      const completion = await this.client.chat.completions.create({
        model: this.params.model!,
        messages: [
          {
            role: 'system',
            content:
              'Você é um assistente útil que ajuda os usuários a gerar respostas baseadas em prompts fornecidos.',
          },
          {
            role: 'user',
            content: processedPrompt,
          },
        ],
        max_tokens: this.params.max_tokens,
        temperature: this.params.temperature,
      });

      const response = completion.choices[0]?.message?.content || '';
      const usage = completion.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      console.log(
        `✅ OpenAI: Resposta gerada com ${usage.total_tokens} tokens`,
      );

      return {
        ...message,
        payload: {
          ...message.payload,
          openai_response: response,
          openai_usage: usage,
          openai_model: this.params.model,
        },
      };
    } catch (error) {
      console.error('❌ OpenAI: Erro ao processar solicitação:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      return {
        ...message,
        payload: {
          ...message.payload,
          error: `OpenAI Error: ${errorMessage}`,
        },
      };
    }
  }
}
