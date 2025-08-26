# NexusRank Pro - AI-Powered SEO Toolkit

[![Cloudflare Pages](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Pages-orange)](https://nexusrankpro.pages.dev)
[![Cloudflare Workers](https://img.shields.io/badge/Backend-Cloudflare%20Workers-orange)](https://workers.cloudflare.com)
[![DeepSeek AI](https://img.shields.io/badge/AI%20Powered%20by-DeepSeek-blue)](https://deepseek.com)

Professional AI-powered SEO and writing tools for content creators, marketers, and businesses. Transform your content strategy with cutting-edge AI technology.

## 🚀 Features

### 6 Professional AI Tools

- **🖊️ AI SEO Writer** - Generate comprehensive, SEO-optimized articles (5000+ words)
- **👤 AI Humanizer** - Transform AI text to sound 100% human-written
- **🔍 AI Detector** - Detect AI-generated content with high accuracy
- **🔄 Paraphrasing Tool** - Rewrite content while preserving meaning
- **✅ Grammar Checker** - Fix grammar, spelling, and punctuation errors
- **✨ Text Improver** - Enhance clarity, fluency, and professionalism

### Modern Features

- **🆓 Freemium Model** - 2 free uses per tool, unlimited with Pro
- **💻 Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **🎨 3D Gaming Interface** - Dark theme with neon cyan and purple accents
- **⚡ Real-time Processing** - Instant AI results with loading states
- **📱 PWA Support** - Installable web app with offline functionality
- **🔒 Privacy First** - No content storage, secure processing
- **📋 Copy & Download** - Easy export of generated content

## 🛠️ Tech Stack

### Frontend
- **HTML5/CSS3/JavaScript** - Pure vanilla implementation
- **Font Awesome** - Professional icons
- **Google Fonts** - JetBrains Mono & Segoe UI
- **Service Worker** - PWA functionality and caching

### Backend
- **Cloudflare Workers** - Serverless backend
- **DeepSeek AI API** - Advanced language models
- **Wrangler** - Deployment and configuration

### Deployment
- **Cloudflare Pages** - Frontend hosting
- **Cloudflare Workers** - Backend API
- **GitHub Actions** - CI/CD (optional)

## 📁 Project Structure

```
nexusrank-pro/
├── index.html              # Main landing page
├── css/
│   └── style.css           # Complete styling with 3D effects
├── js/
│   └── app.js              # Application logic and API integration
├── pages/
│   ├── about.html          # About page
│   ├── contact.html        # Contact page
│   ├── privacy.html        # Privacy policy
│   ├── terms.html          # Terms of service
│   └── cookie-policy.html  # Cookie policy
├── backend/
│   ├── worker.js           # Cloudflare Worker with AI integration
│   └── wrangler.jsonc      # Worker configuration
├── sw.js                   # Service Worker for PWA
└── README.md               # This documentation
```

## 🚀 Deployment Instructions

### Step 1: Deploy the Worker (Backend)

**Important: Deploy the worker first, then the frontend.**

1. **Navigate to your worker directory:**
   ```bash
   cd backend
   ```

2. **Deploy using Wrangler:**
   ```bash
   npx wrangler deploy
   ```
   Your worker will be available at: `https://nexusrank-ai-pro.shahshameer383.workers.dev`

3. **Set your DeepSeek API key as a secret:**
   ```bash
   npx wrangler secret put DEEPSEEK_API_KEY
   ```
   When prompted, enter your DeepSeek API key (get one from [DeepSeek Platform](https://platform.deepseek.com/))

### Step 2: Deploy Frontend (Cloudflare Pages)

1. **Push this code to your GitHub repository:**
   ```bash
   git add .
   git commit -m "Deploy NexusRank Pro"
   git push origin main
   ```

2. **Connect to Cloudflare Pages:**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project"
   - Connect your GitHub repository
   - Use these settings:
     - **Framework preset**: None
     - **Build command**: (leave empty)
     - **Build output directory**: `/`
     - **Root directory**: `/`

3. **Your site will be available at:**
   `https://nexusrankpro.pages.dev`

### Step 3: Get Your DeepSeek API Key

1. Visit [DeepSeek Platform](https://platform.deepseek.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and use it in Step 1.3 above

## 🔧 Current Configuration

Your project is already configured for:
- **Worker URL**: `https://nexusrank-ai-pro.shahshameer383.workers.dev`
- **Pages URL**: `https://nexusrankpro.pages.dev`
- **CORS**: Properly configured for your domains + localhost development

## 🔍 Testing

After deployment, test your setup:

1. **Health check:**
   ```bash
   curl https://nexusrank-ai-pro.shahshameer383.workers.dev/health
   ```

2. **AI API test:**
   ```bash
   curl -X POST https://nexusrank-ai-pro.shahshameer383.workers.dev/ai/humanize \
     -H "Content-Type: application/json" \
     -H "Origin: https://nexusrankpro.pages.dev" \
     -d '{"text": "This is a test message for the AI humanizer tool."}'
   ```

Expected response:
```json
{
  "success": true,
  "content": "This message serves as a test for the AI humanizer tool.",
  "tool": "AI Humanizer",
  "timestamp": "2025-08-26T08:30:00.000Z"
}
```

## 💰 Monetization Setup

### Pro Login Credentials
- **Username**: `prouser606`
- **Password**: `tUChSUZ7drfMkYm`

### Usage Tracking
- Free users: 2 uses per tool (stored in localStorage)
- Pro users: Unlimited access
- Usage data persists across browser sessions

## 🔒 Environment Variables

Required in Cloudflare Worker:
- `DEEPSEEK_API_KEY`: Your DeepSeek AI API key (set as secret)
- `ENVIRONMENT`: Set to "production" (already configured)

## 📱 PWA Features

The application includes full PWA support:
- **Offline functionality** with intelligent caching
- **Installable** as a native app on mobile/desktop
- **Service Worker** for background sync and notifications
- **App icons** and splash screens

To install:
1. Visit the website in Chrome/Edge/Safari
2. Look for the "Install" prompt
3. Click "Install" to add to home screen/desktop

## 🚨 Troubleshooting

### Common Issues:

1. **"AI service configuration error"**
   - Solution: Set your DEEPSEEK_API_KEY in the worker
   ```bash
   cd backend
   npx wrangler secret put DEEPSEEK_API_KEY
   ```

2. **CORS errors in browser console**
   - Check that your Pages domain matches the worker CORS config
   - Worker is already configured for `nexusrankpro.pages.dev`

3. **"Method not allowed" error**
   - Ensure your worker is using the latest code
   - Redeploy with: `npx wrangler deploy`

4. **Tools not working on frontend**
   - Verify the API URL in `js/app.js` matches your worker URL
   - Check browser console for error messages

### Debug Commands:

```bash
# Check worker logs
npx wrangler tail

# Test worker directly
curl -X POST https://nexusrank-ai-pro.shahshameer383.workers.dev/ai/humanize \
  -H "Content-Type: application/json" \
  -d '{"text": "test"}'

# Check worker configuration
npx wrangler secret list
```

## 🔧 Development

### Local Development

1. **Start local server:**
   ```bash
   python -m http.server 5000
   # OR
   npx serve .
   ```

2. **Worker development:**
   ```bash
   cd backend
   npx wrangler dev
   ```

3. **Access locally:**
   - Frontend: `http://localhost:5000`
   - Worker: `http://localhost:8787` (when using wrangler dev)

### File Modifications

- **Frontend API URL**: Update `js/app.js` line 3
- **CORS Settings**: Update `backend/worker.js` getCorsHeaders function
- **Styling**: Modify `css/style.css` for design changes
- **Content**: Update `pages/*.html` for legal pages

## 📊 Performance

### Optimization Features
- **CDN Distribution**: Global edge deployment via Cloudflare
- **Intelligent Caching**: Static assets cached, API responses fresh
- **Lazy Loading**: Progressive content loading
- **Minification**: Optimized CSS and JavaScript
- **Service Worker**: Offline functionality and performance

### Analytics
- Cloudflare Analytics for traffic insights
- Worker analytics for API usage monitoring
- Built-in error logging and performance tracking

## 🔐 Security

### Implemented Security Measures
- **CORS Protection**: Restricted to authorized domains
- **Rate Limiting**: Built-in request throttling (100 req/min per IP)
- **Input Validation**: Text length and type validation
- **Secure Headers**: Proper security headers set
- **Environment Isolation**: Secrets managed via Cloudflare

### API Security
- API keys stored as encrypted secrets
- Request validation and sanitization
- Error messages don't expose sensitive information
- HTTPS-only communication

## 📞 Support

### For Issues:
1. Check browser console for error messages
2. Verify your DeepSeek API key has credit
3. Ensure both worker and pages are deployed
4. Check the troubleshooting section above

### Resources:
- [DeepSeek API Documentation](https://platform.deepseek.com/api-docs/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)

---

**NexusRank Pro** - Professional AI-powered SEO toolkit for modern content creators.

*Built with ❤️ for the content creation community*