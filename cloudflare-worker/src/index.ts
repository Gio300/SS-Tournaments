/**
 * Cloudflare Worker for ButtonMasherz Rules Bot + AI Director
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
  body?: string;
  pollQuestion?: string;
  imageBase64?: string;
  matchType?: string;
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
    const isAssist = url.pathname.endsWith('/assist');
    const isScreenshotAnalyze = url.pathname.endsWith('/screenshot-analyze');

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

    if (isAssist) {
      return handleAssist(request, env);
    }

    if (isScreenshotAnalyze) {
      return handleScreenshotAnalyze(request, env);
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

async function handleAssist(request: Request, env: Env): Promise<Response> {
  try {
    const body: RequestBody = await request.json();
    const { body: userText, action, pollQuestion } = body;

    if (!userText && !pollQuestion) {
      return new Response(
        JSON.stringify({ error: 'Missing body or pollQuestion' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const actions: Record<string, string> = {
      rewrite: 'Rewrite this text to be clearer and fix any grammar. Keep it concise. Return only the rewritten text. Text:',
      shorten: 'Shorten this text into a brief caption (1-2 sentences). Return only the shortened text. Text:',
      expand: 'Expand this text with more detail and context. Return only the expanded text. Text:',
      suggest_caption: 'Suggest a short, engaging caption for a social post. Return only the caption. Context:',
      suggest_poll_options: 'Given this poll question, suggest 2-4 options as a JSON array of strings. Return only the JSON array. Question:',
    };

    const actionPrompt = actions[action || 'rewrite'] || actions.rewrite;
    const inputText = pollQuestion ? `Poll question: ${pollQuestion}` : userText;
    const prompt = `${actionPrompt}\n\n${inputText}`;

    let aiResponse;
    try {
      aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.4,
      });
    } catch (e) {
      aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        prompt,
        max_tokens: 500,
        temperature: 0.4,
      });
    }

    let answer = '';
    if (typeof aiResponse === 'string') answer = aiResponse;
    else if (aiResponse?.response) {
      const r = aiResponse.response;
      answer = typeof r === 'string' ? r : r?.content ?? (Array.isArray(r) ? r[0]?.content ?? '' : '');
    } else if (aiResponse?.text) answer = aiResponse.text;

    answer = answer.trim();
    if (action === 'suggest_poll_options' && answer) {
      const match = answer.match(/\[[\s\S]*?\]/);
      if (match) {
        try {
          const arr = JSON.parse(match[0]);
          if (Array.isArray(arr)) {
            answer = arr.map((s: string) => String(s).trim()).filter(Boolean).join('\n');
          }
        } catch (_) {}
      }
    }

    return new Response(
      JSON.stringify({ text: answer }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('Assist error:', error);
    return new Response(
      JSON.stringify({ error: 'Assist failed', details: error?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

async function handleScreenshotAnalyze(request: Request, env: Env): Promise<Response> {
  try {
    const body: RequestBody = await request.json();
    const { imageBase64, matchType } = body;

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing imageBase64' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const imgUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;
    const mt = matchType || 'quick_match';

    const prompt = `This is a Shinobi Strikers (Naruto to Boruto: Shinobi Striker) end-of-match screen. One player row is highlighted in light blue - that is the UPLOADER (the person taking the screenshot). The top section is "Victory" (winners), bottom is "Defeat" (losers).

Extract and reply with ONLY a JSON object (no other text):
- uploaderName: the in-game name of the player whose row is highlighted in light blue - that is the uploader
- victoryTeam: array of player names in the Victory section
- defeatTeam: array of player names in the Defeat section
- players: array of objects, one per row: { "name": "in-game name", "points": number from Points column, "team": "victory" or "defeat", "isUploader": true only for the blue-highlighted row }
- playTimeSec: match duration in seconds as integer (e.g. "Play Time 05:23" = 323)
- resultsRemainingSec: countdown number as integer (e.g. "Results will close in: 17" = 17)
- matchMode: "barrier_battle" or "quick_match" or "survival" or "red_white" or "ninja_world_league" or "tournament" based on what the screen shows
- winnerName: first player in Victory (for legacy)
- loserNames: array of Defeat (for legacy)

Example: {"uploaderName":"KmH_PatternAft3r","victoryTeam":["IKMHIFINISH_HIM!","KmH_PatternAft3r"],"defeatTeam":["Maruki","SHINOBI"],"players":[{"name":"KmH_PatternAft3r","points":976,"team":"victory","isUploader":true}],"playTimeSec":323,"resultsRemainingSec":17,"matchMode":"barrier_battle","winnerName":"IKMHIFINISH_HIM!","loserNames":["Maruki"]}`;

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: imgUrl } },
    ];

    const aiResponse = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      messages: [{ role: 'user', content }],
      max_tokens: 300,
      temperature: 0.2,
    });

    let answer = '';
    if (typeof aiResponse === 'string') answer = aiResponse;
    else if (aiResponse?.response) {
      const r = aiResponse.response;
      answer = typeof r === 'string' ? r : r?.content ?? (Array.isArray(r) ? r[0]?.content ?? '' : '');
    } else if (aiResponse?.text) answer = aiResponse.text;

    const jsonMatch = answer.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify(parsed), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (_) {}
    }

    return new Response(
      JSON.stringify({
        uploaderName: null,
        victoryTeam: [],
        defeatTeam: [],
        players: [],
        playTimeSec: null,
        resultsRemainingSec: null,
        matchMode: mt,
        winnerName: null,
        loserNames: [],
        redTeam: null,
        whiteTeam: null,
        scores: null,
        raw: answer.substring(0, 500),
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('Screenshot analyze error:', error);
    return new Response(
      JSON.stringify({ error: 'Screenshot analyze failed', details: error?.message }),
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
    const prompt = `You are a helpful assistant for ButtonMasherz. Answer questions about tournament rules based ONLY on the provided rules context.

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
