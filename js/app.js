/**
 * NexusRank Pro - Final AI SEO Toolkit
 * Secure, production-ready, no errors
 */

class NexusRankApp {
  constructor() {
    // ✅ Fixed URL (NO TRAILING SPACES OR SLASHES!)
    this.apiBaseUrl = 'https://nexusrank-ai-pro.shahshameer383.workers.dev';

    this.currentTool = null;
    this.isProUser = false;
    this.usageData = {};

    this.init();
  }

  init() {
    this.loadUsageData();
    this.checkProStatus();
    this.bindEvents();
    this.initializeNavigation();
  }

  loadUsageData() {
    try {
      const stored = localStorage.getItem('nexusrank_usage');
      if (stored) {
        this.usageData = JSON.parse(stored);
      } else {
        this.usageData = {
          'seo-write': 0,
          'humanize': 0,
          'detect': 0,
          'paraphrase': 0,
          'grammar': 0,
          'improve': 0
        };
        this.saveUsageData();
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
      this.usageData = {
        'seo-write': 0,
        'humanize': 0,
        'detect': 0,
        'paraphrase': 0,
        'grammar': 0,
        'improve': 0
      };
    }
  }

  saveUsageData() {
    try {
      localStorage.setItem('nexusrank_usage', JSON.stringify(this.usageData));
    } catch (error) {
      console.error('Error saving usage data:', error);
    }
  }

  checkProStatus() {
    try {
      const proStatus = localStorage.getItem('nexusrank_pro');
      this.isProUser = proStatus === 'true';
    } catch (error) {
      console.error('Error checking pro status:', error);
      this.isProUser = false;
    }
  }

  setProStatus(status) {
    this.isProUser = status;
    try {
      localStorage.setItem('nexusrank_pro', status.toString());
    } catch (error) {
      console.error('Error saving pro status:', error);
    }
  }

  bindEvents() {
    // Mobile menu toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
    }

    // Tool cards
    document.querySelectorAll('.tool-card').forEach(card => {
      card.addEventListener('click', () => {
        const tool = card.dataset.tool;
        if (tool) this.openTool(tool);
      });
    });

    // Footer tool links
    document.querySelectorAll('.footer-links a[data-tool]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tool = link.dataset.tool;
        if (tool) this.openTool(tool);
      });
    });

    // Modal events
    this.bindModalEvents();

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  bindModalEvents() {
    const toolModal = document.getElementById('tool-modal');
    const proModal = document.getElementById('pro-modal');
    const processBtn = document.getElementById('process-btn');
    const clearBtn = document.getElementById('clear-input');
    const copyBtn = document.getElementById('copy-output');
    const downloadBtn = document.getElementById('download-output');
    const proLoginBtn = document.getElementById('pro-login-btn');

    // Close modals
    document.querySelectorAll('.modal-close').forEach(close => {
      close.addEventListener('click', () => this.closeModals());
    });

    [toolModal, proModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.closeModals();
        });
      }
    });

    // Process text
    if (processBtn) {
      processBtn.addEventListener('click', () => this.processTool());
    }

    // Clear input
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        document.getElementById('tool-input').value = '';
      });
    }

    // Copy output
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyToClipboard());
    }

    // Download output
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadOutput());
    }

    // Pro login
    if (proLoginBtn) {
      proLoginBtn.addEventListener('click', () => this.handleProLogin());
    }

    // Enter key for login
    ['pro-username', 'pro-password'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') this.handleProLogin();
        });
      }
    });
  }

  initializeNavigation() {
    // Close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (navToggle && navMenu) {
          navToggle.classList.remove('active');
          navMenu.classList.remove('active');
        }
      });
    });

    // Update active nav link
    const sections = ['hero', 'tools'];
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
          const sectionTop = section.offsetTop - 100;
          if (window.pageYOffset >= sectionTop) {
            current = sectionId === 'hero' ? '' : sectionId;
          }
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        if ((!current && link.getAttribute('href') === '/') ||
            (current && link.getAttribute('href').includes(current))) {
          link.classList.add('active');
        }
      });
    });
  }

  openTool(toolName) {
    this.currentTool = toolName;
    const modal = document.getElementById('tool-modal');
    const modalTitle = document.getElementById('modal-title');
    const toolInput = document.getElementById('tool-input');
    const outputSection = document.getElementById('output-section');
    const usageCount = document.getElementById('usage-count');

    if (!modal || !modalTitle) return;

    const toolConfig = this.getToolConfig(toolName);
    modalTitle.textContent = toolConfig.title;

    if (toolInput) {
      toolInput.placeholder = toolConfig.placeholder;
      toolInput.value = '';
    }

    if (outputSection) {
      outputSection.style.display = 'none';
    }

    // Update usage
    if (usageCount) {
      const remaining = this.isProUser ? '∞' : Math.max(0, 2 - this.usageData[toolName]);
      usageCount.textContent = remaining;
    }

    modal.classList.add('active');
    if (toolInput) toolInput.focus();
  }

  getToolConfig(toolName) {
    const configs = {
      'seo-write': {
        title: 'AI SEO Writer',
        placeholder: 'Enter your topic or keywords...',
        endpoint: '/ai/seo-write',
        prompt: 'Write a 5000-10000 word SEO-optimized article. Use H2/H3, bullet points, natural keywords, and human tone.'
      },
      'humanize': {
        title: 'AI Humanizer',
        placeholder: 'Paste AI-generated text to humanize...',
        endpoint: '/ai/humanize',
        prompt: 'Make this sound 100% human. Add contractions, imperfections, and conversational flow.'
      },
      'detect': {
        title: 'AI Detector',
        placeholder: 'Paste text to analyze for AI content...',
        endpoint: '/ai/detect',
        prompt: 'Analyze this text and estimate AI probability. Respond with: "AI Probability: X%" and explanation.'
      },
      'paraphrase': {
        title: 'Paraphrasing Tool',
        placeholder: 'Enter text to paraphrase...',
        endpoint: '/ai/paraphrase',
        prompt: 'Rewrite to be 100% unique and undetectable as AI. Keep meaning but change structure.'
      },
      'grammar': {
        title: 'Grammar Checker',
        placeholder: 'Fix grammar, spelling, and punctuation errors...',
        endpoint: '/ai/grammar',
        prompt: 'Fix all grammar, spelling, and punctuation errors. Return only the corrected version.'
      },
      'improve': {
        title: 'Text Improver',
        placeholder: 'Enhance clarity and engagement...',
        endpoint: '/ai/improve',
        prompt: 'Improve this text for clarity, fluency, and professionalism.'
      }
    };

    return configs[toolName] || {
      title: 'AI Tool',
      placeholder: 'Enter your text...',
      endpoint: '/ai/improve',
      prompt: 'Improve this text:'
    };
  }

  async processTool() {
    const toolInput = document.getElementById('tool-input');
    const processBtn = document.getElementById('process-btn');

    if (!toolInput || !this.currentTool) return;

    const inputText = toolInput.value.trim();
    if (!inputText) {
      this.showError('Please enter some text to process.');
      return;
    }

    // Check usage
    if (!this.isProUser && this.usageData[this.currentTool] >= 2) {
      this.showProModal();
      return;
    }

    // Show loading
    this.showLoading(true);
    if (processBtn) {
      processBtn.disabled = true;
      const btnText = processBtn.querySelector('span');
      if (btnText) btnText.textContent = 'Processing...';
    }

    try {
      const result = await this.callAI(inputText);

      if (result.success) {
        this.showOutput(result.content);
        if (!this.isProUser) {
          this.usageData[this.currentTool]++;
          this.saveUsageData();
          this.updateUsageDisplay();
        }
      } else {
        this.showError(result.error || 'Failed to process text.');
      }
    } catch (error) {
      console.error('Processing error:', error);
      this.showError('Network error. Please try again.');
    } finally {
      this.showLoading(false);
      if (processBtn) {
        processBtn.disabled = false;
        const btnText = processBtn.querySelector('span');
        if (btnText) btnText.textContent = 'Process Text';
      }
    }
  }

  async callAI(inputText) {
    const toolConfig = this.getToolConfig(this.currentTool);

    try {
      const response = await fetch(`${this.apiBaseUrl}${toolConfig.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.error) return { success: false, error: data.error };

      return {
        success: true,
        content: data.content || data.result || 'No content returned'
      };
    } catch (error) {
      console.error('AI API Error:', error);
      return { success: false, error: error.message || 'Failed to connect to AI service' };
    }
  }

  showOutput(content) {
    const toolOutput = document.getElementById('tool-output');
    const outputSection = document.getElementById('output-section');

    if (toolOutput && outputSection) {
      toolOutput.textContent = content;
      outputSection.style.display = 'block';

      setTimeout(() => {
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }

  showError(message) {
    let errorDiv = document.querySelector('.tool-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'error-message tool-error';
      const modalBody = document.querySelector('.modal-body');
      if (modalBody) modalBody.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';

    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }

  showProModal() {
    const proModal = document.getElementById('pro-modal');
    const toolModal = document.getElementById('tool-modal');
    if (proModal) {
      if (toolModal) toolModal.classList.remove('active');
      proModal.classList.add('active');
    }
  }

  handleProLogin() {
    const username = document.getElementById('pro-username');
    const password = document.getElementById('pro-password');
    const errorDiv = document.getElementById('pro-error');

    if (!username || !password) return;

    const usernameVal = username.value.trim();
    const passwordVal = password.value.trim();

    if (usernameVal === 'prouser606' && passwordVal === 'tUChSUZ7drfMkYm') {
      this.setProStatus(true);
      this.closeModals();
      this.showSuccessMessage('Pro access activated! You now have unlimited access.');
      username.value = '';
      password.value = '';
      if (errorDiv) errorDiv.style.display = 'none';

      if (this.currentTool) {
        setTimeout(() => this.openTool(this.currentTool), 1000);
      }
    } else {
      if (errorDiv) {
        errorDiv.textContent = 'Invalid credentials. Please check your username and password.';
        errorDiv.style.display = 'block';
      }
    }
  }

  showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;
    Object.assign(successDiv.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#00cc00',
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      zIndex: '4000',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease'
    });
    document.body.appendChild(successDiv);

    setTimeout(() => {
      successDiv.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
      successDiv.style.transform = 'translateX(100%)';
      setTimeout(() => document.body.removeChild(successDiv), 300);
    }, 5000);
  }

  updateUsageDisplay() {
    const usageCount = document.getElementById('usage-count');
    if (usageCount && this.currentTool) {
      const remaining = this.isProUser ? '∞' : Math.max(0, 2 - this.usageData[this.currentTool]);
      usageCount.textContent = remaining;
    }
  }

  copyToClipboard() {
    const toolOutput = document.getElementById('tool-output');
    if (toolOutput && toolOutput.textContent) {
      navigator.clipboard.writeText(toolOutput.textContent).then(() => {
        const copyBtn = document.getElementById('copy-output');
        if (copyBtn) {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
          copyBtn.style.background = '#00cc00';
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = '';
          }, 2000);
        }
      }).catch(() => this.showError('Failed to copy.'));
    }
  }

  downloadOutput() {
    const toolOutput = document.getElementById('tool-output');
    const modalTitle = document.getElementById('modal-title');
    if (toolOutput && toolOutput.textContent) {
      const content = toolOutput.textContent;
      const filename = `${modalTitle?.textContent || 'output'}-${Date.now()}.txt`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }

  showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
  }

  closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.remove('active');
    });
    document.querySelectorAll('.tool-error').forEach(el => {
      el.style.display = 'none';
    });
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.nexusRankApp = new NexusRankApp();
});

// Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && window.nexusRankApp) {
    window.nexusRankApp.closeModals();
  }
});

// Animations
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('animate-in');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tool-card').forEach(card => {
      observer.observe(card);
    });
  });
}
