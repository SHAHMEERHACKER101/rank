# NexusRank Pro - Complete Deployment Guide

This guide will walk you through deploying NexusRank Pro v2.0 with Google Gemini AI integration from scratch.

## 📋 Prerequisites

Before you begin, make sure you have:

1. **GitHub Account** - For code repository
2. **Cloudflare Account** - For Pages and Workers hosting
3. **Google Account** - For Gemini AI API access
4. **Node.js & npm** - For Wrangler CLI (optional but recommended)
5. **Git** - For version control

## 🚀 Step-by-Step Deployment

### Step 1: Get Your Google Gemini API Key

1. **Visit Google AI Studio:**
   - Go to [https://aistudio.google.com/](https://aistudio.google.com/)
   - Sign in with your Google account

2. **Create API Key:**
   - Click "Get API Key" in the left sidebar
   - Click "Create API Key"
   - Choose "Create API Key in new project" (recommended)
   - Copy the generated API key
   - **Important:** Save this key securely - you won't be able to see it again

3. **Verify API Access:**
   - Test your key with a simple curl request:
   ```bash
   curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY" \
   -H "Content-Type: application/json" \
   -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
   ```

### Step 2: Prepare Your Code Repository

1. **Create GitHub Repository:**
   ```bash
   # Create a new repository on GitHub named "nexusrank-pro"
   git clone https://github.com/yourusername/nexusrank-pro.git
   cd nexusrank-pro
   ```

2. **Add Project Files:**
   - Copy all the project files to your repository
   - Ensure the directory structure matches:
   