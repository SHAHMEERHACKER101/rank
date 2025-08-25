/**
 * NexusRank Pro - FINAL Fixed Cloudflare Worker
 * Resolves spaces, CORS, and API key issues
 */

// ✅ Allowed origins (NO TRAILING SPACES!)
const ALLOWED_ORIGINS = [
  'https://nexusrankpro.pages.dev',
  'http://localhost:5000'
];

// ✅ CORS headers
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin');
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }

  return headers;
}

// ✅ Handle preflight (OPTIONS)
function handleOptions(request) {
  const corsHeaders = getCorsHeaders(request);
  corsHeaders['Access-Control-Allow-Headers'] = 'Content-Type';
  return new Response(null, { status: 204, headers: corsHeaders });
}

// ✅ DeepSeek API URL (NO TRAILING SPACE!)
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// ✅ Tool configurations
const TOOL_CONFIGS = {
  '/ai/improve': {
    system: 'Enhance this text for clarity, fluency, and professionalism. Improve readability and engagement — without changing the core message.',
    max_tokens: 4000,
    temperature: 0.5
  },
  '/ai/seo-write': {
    system: 'Write a 5000-10000 word SEO-optimized article. Use H2/H3, bullet points, natural keywords, and human tone. Avoid AI patterns.',
    max_tokens: 16000,
    temperature: 0.7
  },
  '/ai/paraphrase': {
    system: 'Rewrite this text to be 100% unique and undetectable as AI. Use different sentence structures and synonyms. Keep meaning but make it fresh.',
    max_tokens: 4000,
    temperature: 0.6
  },
  '/ai/humanize': {
    system: 'Transform this AI text to sound 100% human. Add contractions, minor imperfections, personal tone, and conversational flow.',
    max_tokens: 4000,
    temperature: 0.8
  },
  '/ai/detect': {
    system: 'Analyze this text and estimate the probability it was AI-generated. Respond with: "AI Probability: X%" and a 2-sentence explanation.',
    max_tokens: 1000,
    temperature: 0.3
  },
  '/ai/grammar': {
    system: 'Fix all grammar, spelling, and punctuation errors. Return only the corrected version.',
    max_tokens: 4000,
    temperature: 0.2
  }
};

export default {
  async fetch(request, env) {
    // ✅ Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // ✅ Validate POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: getCorsHeaders(request)
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ✅ Debug logs
    console.log('🔍 Incoming request to:', path);
    console.log('🔑 API Key exists:', !!env.DEEPSEEK_API_KEY);
    if (env.DEEPSEEK_API_KEY) {
      console.log('🔑 First 4 chars:', env.DEEPSEEK_API_KEY.substring(0, 4));
    } else {
      console.log('❌ API Key is MISSING!');
    }

    // ✅ Check if endpoint exists
    const config = TOOL_CONFIGS[path];
    if (!config) {
      return new Response(JSON.stringify({
        error: 'Endpoint not found',
        available: Object.keys(TOOL_CONFIGS)
      }), {
        status: 404,
        headers: getCorsHeaders(request)
      });
    }

    // ✅ Parse request body
    let data;
    try {
      data = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: getCorsHeaders(request)
      });
    }

    const text = data.text || data.prompt || '';
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Text input is required' }), {
        status: 400,
        headers: getCorsHeaders(request)
      });
    }

    // ✅ Get API key
    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY not set');
      return new Response(JSON.stringify({ error: 'AI service configuration error' }), {
        status: 500,
        headers: getCorsHeaders(request)
      });
    }

    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: config.system },
            { role: 'user', content: text }
          ],
          max_tokens: config.max_tokens,
          temperature: config.temperature,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API error:', response.status, errorText);
        return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
          status: 503,
          headers: getCorsHeaders(request)
        });
      }

      const result = await response.json();
      const aiText = result.choices?.[0]?.message?.content?.trim();

      if (!aiText) {
        return new Response(JSON.stringify({ error: 'Empty AI response' }), {
          status: 500,
          headers: getCorsHeaders(request)
        });
      }

      return new Response(JSON.stringify({
        success: true,
        content: aiText,
        tool: path.split('/').pop(),
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: {
          ...getCorsHeaders(request),
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: getCorsHeaders(request)
      });
    }
  }
};
