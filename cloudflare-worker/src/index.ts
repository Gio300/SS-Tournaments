/**
 * Cloudflare Worker for smL Rules Bot + AI Director
 * - Rules Bot: Llama 3.1 8B for tournament rules
 * - Director: Llama 3.2 11B Vision for stream switching
 */

interface Env {
  AI: any; // Workers AI binding
}

interface RequestBody {
  question?: string;
  rulesContext?: string;
  videoIds?: string[];
  action?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const isDirector = url.pathname.endsWith('/director');

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (isDirector) {
      return handleDirector(request, env);
    }

    return handleRulesBot(request, env);
  },
};

async function handleDirector(request: Request, env: Env): Promise<Response> {
  try {
    const body: RequestBody = await request.json();
    const { videoIds, action } = body;

    if (action === 'agree') {
      const res = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', { prompt: 'agree' });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing videoIds array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const ids = videoIds.slice(0, 8);
    const images: string[] = [];

    for (const id of ids) {
      const thumbUrl = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
      const res = await fetch(thumbUrl);
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      const arr = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
      const base64 = btoa(binary);
      images.push(`data:image/jpeg;base64,${base64}`);
    }

    if (images.length === 0) {
      return new Response(JSON.stringify({ index: 1 }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const prompt = `These ${images.length} images are thumbnails from live gaming streams. Which shows the most in-game action or excitement? Reply with ONLY a JSON object: {"index": N} where N is 1-${images.length}.`;

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: 'text', text: prompt },
    ];
    for (const img of images) {
      content.push({ type: 'image_url', image_url: { url: img } });
    }

    const aiResponse = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      messages: [{ role: 'user', content }],
      max_tokens: 50,
      temperature: 0.2,
    });

    let answer = '';
    if (typeof aiResponse === 'string') answer = aiResponse;
    else if (aiResponse?.response) {
      const r = aiResponse.response;
      answer = typeof r === 'string' ? r : r?.content ?? (Array.isArray(r) ? r[0]?.content ?? '' : '');
    } else if (aiResponse?.text) answer = aiResponse.text;

    const match = answer.match(/\{"index"\s*:\s*(\d+)\}/) || answer.match(/index["\s:]+(\d+)/);
    const index = match ? Math.min(Math.max(1, parseInt(match[1], 10)), images.length) : 1;

    return new Response(JSON.stringify({ index }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Director error:', error);
    return new Response(
      JSON.stringify({ error: 'Director failed', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

async function handleRulesBot(request: Request, env: Env): Promise<Response> {
  try {
    const body: RequestBody = await request.json();
    const { question, rulesContext } = body;

    if (!question || !rulesContext) {
      return new Response(
        JSON.stringify({ error: 'Missing question or rulesContext' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
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
      aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.3,
      });
    }

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
      answer = JSON.stringify(aiResponse).substring(0, 500) || 'Unable to parse AI response. Please try rephrasing your question.';
    }

    answer = answer.trim();
    if (!answer) {
      answer = 'Unable to generate answer. Please try rephrasing your question or check the Rules and FAQ pages.';
    }

    return new Response(
      JSON.stringify({ answer, model: 'llama-3.1-8b-instruct' }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('Worker error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}
