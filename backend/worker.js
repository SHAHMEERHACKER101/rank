/**
 * NexusRank Pro - Cloudflare Worker
 * AI-powered SEO toolkit backend service
 * Powered by Google Gemini AI with proper CORS and security
 */

// CORS configuration for multiple origins
function getCorsHeaders(origin) {
  const allowedOrigins = [
    'https://nexusrankpro.pages.dev',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  ];
  
  const isAllowed = allowedOrigins.includes(origin) || origin?.includes('nexusrankpro.pages.dev');
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://nexusrankpro.pages.dev',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin',
    'Access-Control-Max-Age': '86400',
  };
}

// Google Gemini AI configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// AI tool endpoints and their configurations
const AI_ENDPOINTS = {
  '/ai/seo-write': {
    name: 'AI SEO Writer',
    systemPrompt: 'You are a professional SEO content writer and expert. Write comprehensive, SEO-optimized articles that rank well in search engines. Your writing should be engaging, informative, and valuable to readers. Follow these guidelines:\n\n1. Create a compelling title and introduction\n2. Use proper H2 and H3 headings for structure\n3. Include bullet points and numbered lists for readability\n4. Integrate keywords naturally without stuffing\n5. Maintain a human, conversational tone throughout\n6. Include actionable insights and practical tips\n7. Write 2000-5000 words with comprehensive coverage\n8. Avoid AI-like patterns and robotic language\n9. Make it sound 100% human-written\n10. Focus on providing real value to readers\n\nWrite a complete, well-structured article about the following topic:',
  },
  '/ai/humanize': {
    name: 'AI Humanizer',
    systemPrompt: 'You are an expert at transforming AI-generated text to sound completely human-written. Your task is to rewrite the given text with these characteristics:\n\n1. Add natural contractions (don\'t, won\'t, can\'t, etc.)\n2. Include conversational language and casual phrases\n3. Add slight imperfections and natural flow\n4. Use varied sentence lengths and structures\n5. Include personal touches and relatable examples\n6. Remove robotic or overly formal language\n7. Add emotional undertones where appropriate\n8. Use active voice instead of passive\n9. Include transitional phrases and connectors\n10. Make it completely undetectable as AI content\n\nRewrite the following text to sound 100% human-written:',
  },
  '/ai/detect': {
    name: 'AI Detector',
    systemPrompt: 'You are an AI detection specialist with expertise in identifying AI-generated content. Analyze the given text for AI patterns and characteristics. Look for:\n\n1. Repetitive phrasing or structures\n2. Unnatural transitions between ideas\n3. Overly perfect grammar and punctuation\n4. Lack of personal experience or opinion\n5. Generic statements without specificity\n6. AI-typical sentence patterns\n7. Overuse of certain phrases\n8. Lack of emotional depth\n9. Too formal or academic tone\n10. Missing human imperfections\n\nProvide your analysis in this exact format:\n\nAI Probability: [X]%\n\n[Provide a detailed 2-3 sentence explanation of your analysis, highlighting the specific indicators that influenced your assessment]\n\nAnalyze this text:',
  },
  '/ai/paraphrase': {
    name: 'Paraphrasing Tool',
    systemPrompt: 'You are a professional text rewriter specializing in creating unique, human-sounding content. Your task is to completely rewrite the given text while:\n\n1. Maintaining the original meaning and intent\n2. Changing sentence structure and vocabulary\n3. Using synonyms and alternative expressions\n4. Varying sentence lengths and flow\n5. Adding natural human touches\n6. Ensuring 100% uniqueness from the original\n7. Making it sound naturally written\n8. Avoiding AI-like patterns\n9. Preserving the core message\n10. Creating engaging, readable content\n\nCompletely rewrite the following text to make it 100% unique and human-sounding:',
  },
  '/ai/grammar': {
    name: 'Grammar Checker',
    systemPrompt: 'You are a professional editor and grammar expert. Your task is to fix all grammar, spelling, punctuation, and style errors in the given text. Focus on:\n\n1. Correcting grammatical mistakes\n2. Fixing spelling errors\n3. Improving punctuation\n4. Enhancing sentence structure\n5. Maintaining the original voice and tone\n6. Improving clarity and readability\n7. Ensuring proper word usage\n8. Fixing run-on sentences\n9. Correcting subject-verb agreement\n10. Improving overall flow\n\nReturn ONLY the corrected text without any explanations, comments, or markup. Fix all errors in this text:',
  },
  '/ai/improve': {
    name: 'Text Improver',
    systemPrompt: 'You are a professional writing coach and editor. Your task is to enhance the given text for better clarity, fluency, and professionalism while preserving the core message. Focus on:\n\n1. Improving clarity and readability\n2. Enhancing flow and transitions\n3. Making language more engaging\n4. Strengthening word choice\n5. Improving sentence variety\n6. Adding professional polish\n7. Maintaining the original voice\n8. Enhancing overall impact\n9. Making it more compelling\n10. Ensuring natural, human tone\n\nEnhance and improve the following text while keeping its meaning intact:'
  }
};

/**
 * Main worker event listener - ES Module syntax
 */
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};

/**
 * Fallback for service worker syntax (for compatibility)
 */
if (typeof addEventListener !== 'undefined') {
  addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request, globalThis));
  });
}

/**
 * Handle incoming requests
 */
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const origin = request.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCors(corsHeaders);
  }

  // Health check endpoint
  if (path === '/health' && request.method === 'GET') {
    return new Response(JSON.stringify({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'NexusRank Pro AI Worker',
      aiProvider: 'Google Gemini',
      hasApiKey: !!(env?.GEMINI_API_KEY || globalThis.GEMINI_API_KEY),
      envType: typeof env,
      version: '2.0.0'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
  }

  // Process AI tool requests
  if (AI_ENDPOINTS[path] && request.method === 'POST') {
    return handleAIRequest(request, path, env, corsHeaders);
  }

  // Return 404 for unknown endpoints
  return new Response(JSON.stringify({ 
    error: 'Endpoint not found',
    path: path,
    availableEndpoints: Object.keys(AI_ENDPOINTS),
    service: 'NexusRank Pro AI Worker'
  }), {
    status: 404,
    headers: { 
      'Content-Type': 'application/json',
      ...corsHeaders 
    }
  });
}

/**
 * Handle CORS preflight requests
 */
function handleCors(corsHeaders) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Handle AI processing requests
 */
async function handleAIRequest(request, endpoint, env, corsHeaders) {
  try {
    // Get Gemini API key from environment
    const apiKey = env?.GEMINI_API_KEY || globalThis.GEMINI_API_KEY || process?.env?.GEMINI_API_KEY;
    
    console.log('Environment debug:', { 
      hasEnv: !!env, 
      hasApiKey: !!apiKey,
      envType: typeof env,
      envKeys: env ? Object.keys(env) : []
    });
    
    if (!apiKey) {
      console.error('No Gemini API key found in any environment source');
      return createErrorResponse('AI service configuration error. API key not found.', 500, corsHeaders);
    }

    // Parse request body
    const body = await request.json();
    const { prompt, text } = body;

    if (!prompt && !text) {
      return createErrorResponse('Missing required field: prompt or text', 400, corsHeaders);
    }

    const inputText = prompt || text;
    if (typeof inputText !== 'string' || inputText.trim().length === 0) {
      return createErrorResponse('Input text must be a non-empty string', 400, corsHeaders);
    }

    // Validate input length (max 50k characters for safety)
    if (inputText.length > 50000) {
      return createErrorResponse('Input text is too long. Maximum 50,000 characters allowed.', 400, corsHeaders);
    }

    // Get endpoint configuration
    const endpointConfig = AI_ENDPOINTS[endpoint];
    
    // Construct the full prompt for Gemini
    const fullPrompt = `${endpointConfig.systemPrompt}\n\n${inputText}`;

    // Call Gemini API
    const aiResponse = await callGeminiAPI(apiKey, fullPrompt);
    
    if (!aiResponse.success) {
      return createErrorResponse(aiResponse.error, 500, corsHeaders);
    }

    // Return successful response
    return new Response(JSON.stringify({
      success: true,
      content: aiResponse.content,
      tool: endpointConfig.name,
      timestamp: new Date().toISOString()
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });

  } catch (error) {
    console.error('AI Request Error:', error);
    return createErrorResponse('Internal server error. Please try again.', 500, corsHeaders);
  }
}

/**
 * Call Google Gemini API
 */
async function callGeminiAPI(apiKey, prompt) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          stopSequences: []
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', response.status, errorData);
      
      if (response.status === 400) {
        return { success: false, error: 'Invalid request to AI service. Please check your input.' };
      } else if (response.status === 401 || response.status === 403) {
        return { success: false, error: 'AI service authentication failed. Please check API key.' };
      } else if (response.status === 429) {
        return { success: false, error: 'AI service rate limit exceeded. Please try again later.' };
      } else if (response.status >= 500) {
        return { success: false, error: 'AI service temporarily unavailable. Please try again.' };
      } else {
        return { success: false, error: 'AI service request failed' };
      }
    }

    const data = await response.json();
    
    // Parse Gemini response format
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      console.error('Invalid Gemini response format:', data);
      return { success: false, error: 'Invalid response from AI service' };
    }

    const content = data.candidates[0].content.parts[0].text;
    if (!content || content.trim().length === 0) {
      return { success: false, error: 'AI service returned empty response' };
    }

    return { 
      success: true, 
      content: content.trim() 
    };

  } catch (error) {
    console.error('Gemini API Call Error:', error);
    return { 
      success: false, 
      error: 'Failed to connect to AI service. Please check your connection and try again.' 
    };
  }
}

/**
 * Create standardized error response
 */
function createErrorResponse(message, status = 400, corsHeaders) {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  }), {
    status: status,
    headers: { 
      'Content-Type': 'application/json',
      ...(corsHeaders || getCorsHeaders()) 
    }
  });
}

/**
 * Rate limiting helper (basic implementation)
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.windowMs = 60000; // 1 minute
    this.maxRequests = 100; // per window
  }

  isAllowed(clientId) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, []);
    }
    
    const clientRequests = this.requests.get(clientId);
    
    // Remove old requests outside the window
    const recentRequests = clientRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(clientId, recentRequests);
    
    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    return true;
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Enhanced request handler with rate limiting
 */
async function handleRequestWithRateLimit(request, env) {
  // Get client identifier (IP address or CF-Connecting-IP header)
  const clientId = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For') || 
                   'unknown';
  
  const origin = request.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Check rate limit
  if (!rateLimiter.isAllowed(clientId)) {
    return createErrorResponse('Rate limit exceeded. Please try again later.', 429, corsHeaders);
  }
  
  return handleRequest(request, env);
}
