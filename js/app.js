class NexusRankApp {
    constructor() {
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
    }

    saveUsageData() {
        localStorage.setItem('nexusrank_usage', JSON.stringify(this.usageData));
    }

    checkProStatus() {
        const proStatus = localStorage.getItem('nexusrank_pro');
        if (proStatus === 'true') {
            this.isProUser = true;
        }
    }

    setProStatus(status) {
        this.isProUser = status;
        localStorage.setItem('nexusrank_pro', status.toString());
    }

    bindEvents() {
        // Navigation toggle
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // Tool cards
        const toolCards = document.querySelectorAll('.tool-card');
        toolCards.forEach(card => {
            card.addEventListener('click', () => {
                const tool = card.dataset.tool;
                if (tool) {
                    this.openTool(tool);
                }
            });
        });

        // Footer tool links
        const footerToolLinks = document.querySelectorAll('.footer-links a[data-tool]');
        footerToolLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tool = link.dataset.tool;
                if (tool) {
                    this.openTool(tool);
                }
            });
        });

        // Modal events
        this.bindModalEvents();

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    bindModalEvents() {
        // Tool modal elements
        const toolModal = document.getElementById('tool-modal');
        const proModal = document.getElementById('pro-modal');
        const processBtn = document.getElementById('process-btn');
        const clearBtn = document.getElementById('clear-input');
        const copyBtn = document.getElementById('copy-output');
        const downloadBtn = document.getElementById('download-output');
        const proLoginBtn = document.getElementById('pro-login-btn');

        // Close modal events
        document.querySelectorAll('.modal-close').forEach(close => {
            close.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Close on backdrop click
        [toolModal, proModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModals();
                    }
                });
            }
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });

        // Process button
        if (processBtn) {
            processBtn.addEventListener('click', () => {
                this.processTool();
            });
        }

        // Clear input
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                document.getElementById('tool-input').value = '';
            });
        }

        // Copy output
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyToClipboard();
            });
        }

        // Download output
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadOutput();
            });
        }

        // Pro login
        if (proLoginBtn) {
            proLoginBtn.addEventListener('click', () => {
                this.handleProLogin();
            });
        }

        // Enter key handling for pro login
        ['pro-username', 'pro-password'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleProLogin();
                    }
                });
            }
        });

        // Enter key handling for tool input
        const toolInput = document.getElementById('tool-input');
        if (toolInput) {
            toolInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.processTool();
                }
            });
        }
    }

    initializeNavigation() {
        // Close mobile menu when clicking on links
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

        // Update active nav link on scroll
        const sections = ['hero', 'tools'];
        const navLinks = document.querySelectorAll('.nav-link');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(sectionId => {
                const section = document.getElementById(sectionId) || document.querySelector(`.${sectionId}`);
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
        const toolOutput = document.getElementById('tool-output');
        const outputSection = document.getElementById('output-section');
        const usageCount = document.getElementById('usage-count');

        if (!modal || !modalTitle) return;

        // Set tool title and placeholder
        const toolConfig = this.getToolConfig(toolName);
        modalTitle.textContent = toolConfig.title;
        
        if (toolInput) {
            toolInput.placeholder = toolConfig.placeholder;
            toolInput.value = '';
        }

        if (toolOutput) {
            toolOutput.value = '';
        }

        if (outputSection) {
            outputSection.style.display = 'none';
        }

        // Update usage counter
        if (usageCount) {
            const remaining = this.isProUser ? '∞' : Math.max(0, 2 - this.usageData[toolName]);
            usageCount.textContent = remaining;
        }

        // Show modal
        modal.classList.add('active');
        if (toolInput) {
            toolInput.focus();
        }
    }

    getToolConfig(toolName) {
        const configs = {
            'seo-write': {
                title: 'AI SEO Writer',
                placeholder: 'Enter your topic or keywords for the SEO article (e.g., "Benefits of yoga for mental health", "Digital marketing strategies 2025")...',
                endpoint: '/ai/seo-write'
            },
            'humanize': {
                title: 'AI Humanizer',
                placeholder: 'Paste AI-generated text that you want to humanize and make sound more natural...',
                endpoint: '/ai/humanize'
            },
            'detect': {
                title: 'AI Detector',
                placeholder: 'Paste text to analyze for AI content detection and get probability scores...',
                endpoint: '/ai/detect'
            },
            'paraphrase': {
                title: 'Paraphrasing Tool',
                placeholder: 'Enter text that you want to paraphrase and rewrite in a unique way...',
                endpoint: '/ai/paraphrase'
            },
            'grammar': {
                title: 'Grammar Checker',
                placeholder: 'Paste text to check and fix grammar, spelling, and punctuation errors...',
                endpoint: '/ai/grammar'
            },
            'improve': {
                title: 'Text Improver',
                placeholder: 'Enter text that you want to improve for better clarity, fluency, and professionalism...',
                endpoint: '/ai/improve'
            }
        };

        return configs[toolName] || {
            title: 'AI Tool',
            placeholder: 'Enter your text...',
            endpoint: '/ai/improve'
        };
    }

    async processTool() {
        const toolInput = document.getElementById('tool-input');
        const processBtn = document.getElementById('process-btn');
        
        if (!toolInput || !this.currentTool) return;

        const inputText = toolInput.value.trim();
        if (!inputText) {
            this.showToast('Please enter some text to process.', 'error');
            return;
        }

        // Check usage limits
        if (!this.isProUser && this.usageData[this.currentTool] >= 2) {
            this.showProModal();
            return;
        }

        // Show loading state
        this.showLoading(true);
        if (processBtn) {
            processBtn.disabled = true;
            const btnText = processBtn.querySelector('span');
            if (btnText) {
                btnText.textContent = 'Processing...';
            }
        }

        try {
            const result = await this.callAI(inputText);
            
            if (result.success) {
                this.showOutput(result.content);
                
                // Update usage count for non-pro users
                if (!this.isProUser) {
                    this.usageData[this.currentTool]++;
                    this.saveUsageData();
                    this.updateUsageDisplay();
                }

                this.showToast('Content processed successfully!', 'success');
            } else {
                this.showToast(result.error || 'Failed to process text. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Processing error:', error);
            this.showToast('Network error. Please check your connection and try again.', 'error');
        } finally {
            this.showLoading(false);
            if (processBtn) {
                processBtn.disabled = false;
                const btnText = processBtn.querySelector('span');
                if (btnText) {
                    btnText.textContent = 'Process Text';
                }
            }
        }
    }

    async callAI(inputText) {
        const toolConfig = this.getToolConfig(this.currentTool);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}${toolConfig.endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': window.location.origin
                },
                body: JSON.stringify({
                    text: inputText
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API call error:', error);
            return {
                success: false,
                error: error.message || 'Failed to connect to AI service'
            };
        }
    }

    showOutput(content) {
        const outputSection = document.getElementById('output-section');
        const toolOutput = document.getElementById('tool-output');
        
        if (outputSection && toolOutput) {
            toolOutput.value = content;
            outputSection.style.display = 'block';
            
            // Scroll to output
            outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            if (show) {
                loadingOverlay.classList.add('active');
            } else {
                loadingOverlay.classList.remove('active');
            }
        }
    }

    showProModal() {
        const proModal = document.getElementById('pro-modal');
        if (proModal) {
            proModal.classList.add('active');
        }
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
    }

    updateUsageDisplay() {
        const usageCount = document.getElementById('usage-count');
        if (usageCount && this.currentTool) {
            const remaining = this.isProUser ? '∞' : Math.max(0, 2 - this.usageData[this.currentTool]);
            usageCount.textContent = remaining;
        }
    }

    async copyToClipboard() {
        const toolOutput = document.getElementById('tool-output');
        if (!toolOutput || !toolOutput.value) {
            this.showToast('No content to copy', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(toolOutput.value);
            this.showToast('Content copied to clipboard!', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            // Fallback for older browsers
            toolOutput.select();
            document.execCommand('copy');
            this.showToast('Content copied to clipboard!', 'success');
        }
    }

    downloadOutput() {
        const toolOutput = document.getElementById('tool-output');
        if (!toolOutput || !toolOutput.value) {
            this.showToast('No content to download', 'warning');
            return;
        }

        const toolConfig = this.getToolConfig(this.currentTool);
        const filename = `${toolConfig.title.replace(/\s+/g, '_').toLowerCase()}_output.txt`;
        
        const blob = new Blob([toolOutput.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Content downloaded successfully!', 'success');
    }

    handleProLogin() {
        const username = document.getElementById('pro-username')?.value;
        const password = document.getElementById('pro-password')?.value;
        
        // Demo credentials
        if (username === 'prouser606' && password === 'tUChSUZ7drfMkYm') {
            this.setProStatus(true);
            this.closeModals();
            this.updateUsageDisplay();
            this.showToast('Welcome to Pro! You now have unlimited access.', 'success');
        } else {
            this.showToast('Invalid credentials. Use the demo credentials provided.', 'error');
        }
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('active'), 100);
        
        // Hide toast after 4 seconds
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Public method to check service health
    async checkHealth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            const data = await response.json();
            console.log('Service health:', data);
            return data;
        } catch (error) {
            console.error('Health check failed:', error);
            return null;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nexusRankApp = new NexusRankApp();
    
    // Development helper - expose health check
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Development mode: Health check available via nexusRankApp.checkHealth()');
    }
});

// Handle service worker updates
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}
