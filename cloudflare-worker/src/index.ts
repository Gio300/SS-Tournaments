/**
 * Cloudflare Worker for smL Rules Bot
 * Uses Workers AI (Llama 3.1 8B) to answer tournament rules questions
 */

interface Env {
  AI: any; // Workers AI binding
}

interface RequestBody {
  question: string;
  rulesContext: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const body: RequestBody = await request.json();
      const { question, rulesContext } = body;

      if (!question || !rulesContext) {
        return new Response(
          JSON.stringify({ error: 'Missing question or rulesContext' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Prepare prompt for Llama 3.1 8B
      const prompt = `You are a helpful assistant for the smL Tournament Rules Hub. Answer questions about tournament rules based ONLY on the provided rules context.

RULES CONTEXT:
${rulesContext}

USER QUESTION: ${question}

INSTRUCTIONS:
- Answer based ONLY on the rules provided above
- Understand common slang: "mods" = modes, "ult" = ultimate/jutsu, "tool" = ninja tool, "sub" = substitution, "summon" = summoning
- If the question uses slang or abbreviations, translate them to the proper terms from the rules context
- If the question asks about something not in the rules, say "This scenario requires staff confirmation"
- Cite specific rules when possible (e.g., "According to [Rule Section], ...")
- Use clear, concise language
- If multiple rules apply, mention all relevant ones
- For questions about combinations or interactions, check the "Combo / Interaction Restrictions" section
- Handle partial words and abbreviations (e.g., "koto" refers to "Kotoamatsukami", "mist" refers to "Hidden Mist")

ANSWER:`;

      // Call Workers AI (Llama 3.1 8B Instruct)
      // Try messages format first (for chat models)
      let aiResponse;
      try {
        aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant for tournament rules. Answer questions accurately based only on the provided rules context.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0.3,
        });
      } catch (e) {
        // Fallback to prompt format if messages format fails
        aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          prompt: prompt,
          max_tokens: 500,
          temperature: 0.3,
        });
      }

      // Extract answer from response (format varies by model)
      let answer = '';
      if (typeof aiResponse === 'string') {
        answer = aiResponse;
      } else if (aiResponse.response) {
        if (typeof aiResponse.response === 'string') {
          answer = aiResponse.response;
        } else if (aiResponse.response.content) {
          answer = aiResponse.response.content;
        } else if (Array.isArray(aiResponse.response) && aiResponse.response.length > 0) {
          answer = aiResponse.response[0].content || aiResponse.response[0].text || '';
        }
      } else if (aiResponse.description) {
        answer = aiResponse.description;
      } else if (aiResponse.text) {
        answer = aiResponse.text;
      } else {
        // Try to extract from any nested structure
        answer = JSON.stringify(aiResponse).substring(0, 500) || 'Unable to parse AI response. Please try rephrasing your question.';
      }

      // Clean up answer
      answer = answer.trim();
      if (!answer) {
        answer = 'Unable to generate answer. Please try rephrasing your question or check the Rules and FAQ pages.';
      }

      return new Response(
        JSON.stringify({
          answer,
          model: 'llama-3.1-8b-instruct',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (error: any) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          details: error.message,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};
