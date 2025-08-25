class NexusRankApp {
    constructor() {
        this.apiBaseUrl = 'https://nexusrank-ai.your-account.workers.dev';
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
                placeholder: 'Enter your topic or keywords for the SEO article...',
                endpoint: '/ai/seo-write',
                prompt: 'Write a comprehensive 5000-10000 word SEO-optimized article about the following topic. Use proper H2/H3 headings, bullet points, natural keyword integration, and maintain a human tone throughout. Avoid AI writing patterns and create engaging, valuable content that ranks well in search engines:'
            },
            'humanize': {
                title: 'AI Humanizer',
                placeholder: 'Paste AI-generated text that you want to humanize...',
                endpoint: '/ai/humanize',
                prompt: 'Transform the following AI-generated text to sound 100% human-written. Add contractions, natural language patterns, slight imperfections, conversational flow, and remove all AI-like patterns. Make it completely undetectable as AI content:'
            },
            'detect': {
                title: 'AI Detector',
                placeholder: 'Paste text to analyze for AI content detection...',
                endpoint: '/ai/detect',
                prompt: 'Analyze the following text and estimate the probability that it was generated by AI. Respond with "AI Probability: X%" followed by a brief 2-sentence explanation of your analysis:'
            },
            'paraphrase': {
                title: 'Paraphrasing Tool',
                placeholder: 'Enter text that you want to paraphrase...',
                endpoint: '/ai/paraphrase',
                prompt: 'Completely rewrite the following text to be 100% unique and undetectable as AI-generated content. Maintain the original meaning while changing sentence structure, vocabulary, and flow. Ensure the result sounds natural and human-written:'
            },
            'grammar': {
                title: 'Grammar Checker',
                placeholder: 'Paste text to check and fix grammar errors...',
                endpoint: '/ai/grammar',
                prompt: 'Fix all grammar, spelling, punctuation, and style errors in the following text. Return only the corrected version without any explanations or markup:'
            },
            'improve': {
                title: 'Text Improver',
                placeholder: 'Enter text that you want to improve and enhance...',
                endpoint: '/ai/improve',
                prompt: 'Enhance the following text for better clarity, fluency, and professionalism. Improve readability and flow while preserving the core message and meaning:'
            }
        };

        return configs[toolName] || {
            title: 'AI Tool',
            placeholder: 'Enter your text...',
            endpoint: '/ai/improve',
            prompt: 'Improve the following text:'
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
            } else {
                this.showError(result.error || 'Failed to process text. Please try again.');
            }
        } catch (error) {
            console.error('Processing error:', error);
            this.showError('Network error. Please check your connection and try again.');
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
        const fullPrompt = `${toolConfig.prompt}\n\n${inputText}`;

        try {
            const response = await fetch(`${this.apiBaseUrl}${toolConfig.endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: fullPrompt,
                    text: inputText
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                return { success: false, error: data.error };
            }

            return { 
                success: true, 
                content: data.content || data.result || data.response || 'No content returned'
            };
        } catch (error) {
            console.error('AI API Error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to connect to AI service'
            };
        }
    }

    showOutput(content) {
        const toolOutput = document.getElementById('tool-output');
        const outputSection = document.getElementById('output-section');

        if (toolOutput && outputSection) {
            toolOutput.value = content;
            outputSection.style.display = 'block';
            
            // Scroll to output
            setTimeout(() => {
                outputSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }, 100);
        }
    }

    showError(message) {
        // Create or update error message
        let errorDiv = document.querySelector('.tool-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message tool-error';
            const modalBody = document.querySelector('.modal-body');
            if (modalBody) {
                modalBody.appendChild(errorDiv);
            }
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showProModal() {
        const proModal = document.getElementById('pro-modal');
        const toolModal = document.getElementById('tool-modal');
        
        if (proModal) {
            if (toolModal) {
                toolModal.classList.remove('active');
            }
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

        // Check credentials
        if (usernameVal === 'prouser606' && passwordVal === 'tUChSUZ7drfMkYm') {
            this.setProStatus(true);
            this.closeModals();
            
            // Show success message
            this.showSuccessMessage('Pro access activated! You now have unlimited access to all tools.');
            
            // Clear form
            username.value = '';
            password.value = '';
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
            
            // Reopen tool if one was selected
            if (this.currentTool) {
                setTimeout(() => {
                    this.openTool(this.currentTool);
                }, 1000);
            }
        } else {
            if (errorDiv) {
                errorDiv.textContent = 'Invalid credentials. Please check your username and password.';
                errorDiv.style.display = 'block';
            }
        }
    }

    showSuccessMessage(message) {
        // Create success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        Object.assign(successDiv.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'var(--success-color)',
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
        
        // Animate in
        setTimeout(() => {
            successDiv.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            successDiv.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(successDiv);
            }, 300);
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
        const copyBtn = document.getElementById('copy-output');
        
        if (toolOutput && toolOutput.value) {
            navigator.clipboard.writeText(toolOutput.value).then(() => {
                // Visual feedback
                if (copyBtn) {
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    copyBtn.style.background = 'var(--success-color)';
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                        copyBtn.style.background = '';
                    }, 2000);
                }
            }).catch(err => {
                console.error('Copy failed:', err);
                this.showError('Failed to copy text to clipboard.');
            });
        }
    }

    downloadOutput() {
        const toolOutput = document.getElementById('tool-output');
        const modalTitle = document.getElementById('modal-title');
        
        if (toolOutput && toolOutput.value) {
            const content = toolOutput.value;
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
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        
        // Clear any error messages
        const errors = document.querySelectorAll('.tool-error');
        errors.forEach(error => {
            error.style.display = 'none';
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nexusRankApp = new NexusRankApp();
});

// Handle escape key to close modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (window.nexusRankApp) {
            window.nexusRankApp.closeModals();
        }
    }
});

// Add some visual polish with intersection observer for animations
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe tool cards for animation
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.tool-card').forEach(card => {
            observer.observe(card);
        });
    });
}
