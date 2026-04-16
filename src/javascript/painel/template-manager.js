// template-manager.js - Gerenciamento de Templates
const TemplateManager = (function() {
    const templates = {
        classico: {
            name: 'classico',
            bg: '#FFC82C',
            color: '#000000',
            font: "'Montserrat', sans-serif",
            primary: '#FFC82C',
            panelIconBg: '#FFC82C',
            panelIconColor: '#000000',
            button: '#000000',
            buttonListBg: '#ffffff',
            buttonListText: '#000000',
            coverHeight: 150,
            borderRadius: 16,
            shadowStrength: 12,
            cardStyle: 'soft'
        },
        pink: {
            name: 'pink',
            bg: '#fff0f6',
            color: '#6b0f1e',
            font: "'Montserrat', sans-serif",
            primary: '#d63384',
            panelIconBg: '#d63384',
            panelIconColor: '#ffffff',
            button: '#ffffff',
            buttonListBg: '#ffffff',
            buttonListText: '#000000',
            coverHeight: 150,
            borderRadius: 18,
            shadowStrength: 14,
            cardStyle: 'elevated'
        },
        dark: {
            name: 'dark',
            bg: '#000000',
            color: '#ffffff',
            font: "'Segoe UI', sans-serif",
            primary: '#667eea',
            statusBarBg: '#FFFFFF',
            statusBarText: '#000000',
            panelIconBg: '#000000',
            panelIconColor: '#ffffff',
            button: '#ffffff',
            buttonListBg: '#ffffff',
            buttonListText: '#1F2937',
            coverHeight: 150,
            borderRadius: 12,
            shadowStrength: 10,
            cardStyle: 'elevated'
        },
        custom: {
            name: 'custom',
            bg: '#6366F1',
            color: '#ffffff',
            font: "'Inter', sans-serif",
            primary: '#6366F1',
            panelIconBg: '#6366F1',
            panelIconColor: '#ffffff',
            button: '#ffffff',
            buttonListBg: '#ffffff',
            buttonListText: '#1F2937',
            borderRadius: 14,
            shadowStrength: 10,
            cardStyle: 'soft'
        }
    };

    let currentTemplate = 'classico';

    function setTemplate(templateName, isInitialLoad = false) {
        const previousScrollY = window.scrollY;
        currentTemplate = templateName;
        const customPanel = document.getElementById('custom-design-panel');

        // Se mudar para um tema que não seja custom, carregamos as configurações específicas desse tema do DB
        if (templateName !== 'custom') {
            const savedConfig = window.TrilistaDB ? window.TrilistaDB.getTemplate() : null;
            
            // Se o que está salvo for o mesmo tema, usamos a config salva (com as alterações do usuário)
            // Caso contrário, usamos o preset padrão definido em templates[templateName]
            if (savedConfig && savedConfig.name === templateName) {
                applyTemplate(savedConfig);
            } else {
                applyTemplate(templates[templateName]);
            }
            
            // OCULTAR o painel de customização para temas pré-definidos
            if (customPanel) customPanel.style.display = 'none';
        } else {
            // MOSTRAR o painel de customização apenas para o tema customizado
            if (customPanel) customPanel.style.display = 'block';
            const previewContent = document.querySelector('.store-content');
            const bgLayer = document.getElementById('previewBgLayer');
            if (previewContent) {
                previewContent.classList.remove('theme-classico', 'theme-pink', 'theme-dark', 'links-compact');
                previewContent.style.removeProperty('background-color');
                previewContent.style.removeProperty('color');
                previewContent.style.removeProperty('font-family');
            }
            if (bgLayer) {
                bgLayer.style.removeProperty('background-image');
                bgLayer.style.removeProperty('background-size');
                bgLayer.style.removeProperty('opacity');
            }
            if (window.CustomAppearanceManager) {
                window.CustomAppearanceManager.init();
            }
        }

        updateSelectedTemplate();
        
        // Atualizar a lista de links para mostrar/esconder o botão de cores individuais
        if (window.LinksManager) {
            window.LinksManager.atualizarDisplay();
            window.LinksManager.atualizarPreview();
        }

        // Só salva se não for o carregamento inicial para evitar toast redundante
        if (!isInitialLoad) {
            saveTemplate();
        }

        requestAnimationFrame(() => {
            window.scrollTo({ top: previousScrollY, behavior: 'auto' });
        });
    }

    function applyThemeVars(vars) {
        const root = document.documentElement;
        Object.entries(vars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }

    function getContrastColor(hex) {
        if (!hex) return '#ffffff';
        const clean = hex.replace('#', '');
        const bigint = parseInt(clean, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 150 ? '#0f172a' : '#ffffff';
    }

    function computeCardShadow(style, strength) {
        const opacity = Math.min(Math.max(strength, 0), 100) / 100 * 0.25;
        if (style === 'flat') return 'none';
        if (style === 'elevated') return `0 16px 40px rgba(0, 0, 0, ${opacity})`;
        // soft
        return `0 10px 24px rgba(0, 0, 0, ${opacity})`;
    }

    function clearCustomPreviewState(previewContent) {
        if (!previewContent) return;

        const customVars = [
            '--theme-font-family',
            '--theme-text-color',
            '--theme-font-size',
            '--theme-line-height',
            '--theme-letter-spacing',
            '--theme-header-align',
            '--theme-font-weight',
            '--theme-text-shadow',
            '--theme-layout-style',
            '--theme-layout-spacing',
            '--theme-button-list-bg',
            '--theme-button-list-text',
            '--theme-button-icon-bg',
            '--theme-button-icon-opacity',
            '--theme-button-icon-opacity-percent',
            '--theme-button-bg',
            '--theme-button-text',
            '--theme-icon-bg',
            '--theme-icon-color'
        ];

        customVars.forEach((name) => previewContent.style.removeProperty(name));
        previewContent.classList.remove('layout-standard', 'layout-compact', 'layout-spacious');

        const selectors = [
            '.store-name',
            '.store-bio',
            '.section-title-small',
            '.store-location',
            '.store-avatar',
            '.phone-link-item',
            '.phone-link-title',
            '.phone-link-value',
            '.phone-link-arrow i'
        ];

        previewContent.querySelectorAll(selectors.join(', ')).forEach((el) => {
            el.style.removeProperty('font-family');
            el.style.removeProperty('font-size');
            el.style.removeProperty('font-weight');
            el.style.removeProperty('letter-spacing');
            el.style.removeProperty('line-height');
            el.style.removeProperty('text-align');
            el.style.removeProperty('text-shadow');
            el.style.removeProperty('color');
            el.style.removeProperty('margin-bottom');
            el.style.removeProperty('transform');
            el.style.removeProperty('transform-origin');
            el.style.removeProperty('z-index');
        });

        previewContent.querySelectorAll('.store-section').forEach((section) => {
            section.style.removeProperty('margin-bottom');
        });
    }

    function updateSelectedTemplate() {
        const buttons = document.querySelectorAll('.template-card');
        buttons.forEach(btn => btn.classList.remove('active'));

        const index = Object.keys(templates).indexOf(currentTemplate);
        if (buttons[index]) {
            buttons[index].classList.add('active');
        }
    }

    function applyTemplate(template) {
        // Agora todos os templates aplicam suas configurações completas
        const vars = {
            '--theme-bg': template.bg || template.bgColor,
            '--theme-text': template.color || template.textColor,
            '--theme-primary': template.primary || template.btnColor || template.color,
            '--theme-primary-text': getContrastColor(template.primary || template.btnColor || template.color),
            '--theme-status-bar-bg': template.statusBarBg || template.primary || template.btnColor || template.color,
            '--theme-status-bar-text': template.statusBarText || getContrastColor(template.statusBarBg || template.primary || template.btnColor || template.color),
            '--theme-panel-icon-bg': template.panelIconBg || template.primary || template.btnColor || template.color,
            '--theme-panel-icon-color': template.panelIconColor || getContrastColor(template.panelIconBg || template.primary || template.btnColor || template.color),
            '--theme-button-bg': template.button || template.btnColor || template.primary || template.color,
            '--theme-button-text': template.btnTextColor || getContrastColor(template.button || template.primary || template.color),
            '--theme-button-list-bg': template.buttonListBg || template.button || '#ffffff',
            '--theme-button-list-text': template.buttonListText || template.color || '#1F2937',
            '--theme-card-radius': `${template.borderRadius || 14}px`,
            '--theme-card-shadow': computeCardShadow(template.cardStyle || 'soft', template.shadowStrength || 10)
        };

        applyThemeVars(vars);

        const previewContent = document.querySelector('.store-content');
        const storeCover = document.getElementById('storeCover');
        if (previewContent) {
            clearCustomPreviewState(previewContent);

            // Remover classes de temas e o modo compacto ao trocar de tema
            previewContent.classList.remove('theme-classico', 'theme-pink', 'theme-dark', 'theme-custom');
            previewContent.classList.add(`theme-${template.name}`);

            // Forçar fundo preto e texto branco se for o tema dark
            if (template.name === 'dark') {
                previewContent.style.setProperty('background-color', '#000000', 'important');
                previewContent.style.color = '#ffffff';
            } else {
                previewContent.style.backgroundColor = template.bg || template.bgColor;
                previewContent.style.color = template.color || template.textColor;
            }

            // IMPORTANTE: Só removemos links-compact se NÃO for o tema custom ou se o tema salvo não tiver linkMode compact
            if (template.linkMode !== 'compact') {
                previewContent.classList.remove('links-compact');
            } else {
                previewContent.classList.add('links-compact');
            }

            previewContent.style.fontFamily = template.font || template.fontFamily;

            if (storeCover && template.name !== 'custom') {
                storeCover.classList.remove('cover-shape-curve-down', 'cover-shape-curve-up');
                storeCover.classList.add('cover-shape-rect');
            }
            
            // Aplicar fundo de imagem APENAS se for o tema CUSTOMIZADO
            const bgLayer = document.getElementById('previewBgLayer');
            if (bgLayer) {
                if (template.name === 'custom' && template.bgImage) {
                    bgLayer.style.backgroundImage = `url(${template.bgImage})`;
                    bgLayer.style.opacity = (template.bgOpacity || 100) / 100;
                    bgLayer.style.backgroundSize = `${template.bgZoom || 100}%`;
                } else {
                    bgLayer.style.backgroundImage = 'none';
                    bgLayer.style.opacity = 1;
                }
            }
        }

        if (window.TrilistaDB) {
            TrilistaDB.saveTemplate(template);
        }
    }

    function loadCustomControls() {
        // Agora tratado pelo CustomAppearanceManager
        if (window.CustomAppearanceManager) {
            window.CustomAppearanceManager.init();
        }
    }

    function applyCustomStyles() {
        // Agora tratado pelo CustomAppearanceManager
        if (window.CustomAppearanceManager) {
            window.CustomAppearanceManager.updatePreview();
        }
    }

    function saveTemplate(silent = false) {
        try {
            if (currentTemplate === 'custom') {
                const currentConfig = window.CustomAppearanceManager ? window.CustomAppearanceManager.getConfig() : null;
                if (currentConfig && window.TrilistaDB) {
                    TrilistaDB.saveTemplate({ ...currentConfig, name: 'custom' });
                }
            } else {
                const presetTemplate = templates[currentTemplate];
                if (presetTemplate && window.TrilistaDB) {
                    TrilistaDB.saveTemplate({ ...presetTemplate });
                }
            }

            if (!silent && window.CustomAppearanceManager && window.CustomAppearanceManager.showToast) {
                window.CustomAppearanceManager.showToast(`Configurações do tema ${currentTemplate} salvas!`);
            }
        } catch (e) {
            console.warn('Erro ao salvar template:', e);
        }
    }

    function loadSavedTemplate() {
        try {
            // Tentar carregar do TrilistaDB primeiro
            let saved = null;
            if (window.TrilistaDB) {
                saved = TrilistaDB.getTemplate();
            }
            
            // Se não houver no TrilistaDB, tenta no localStorage (legado)
            if (!saved) {
                const raw = localStorage.getItem('trilista_template');
                if (raw) saved = JSON.parse(raw);
            }

            if (saved && saved.name) {
                currentTemplate = saved.name;
                setTemplate(currentTemplate, true); // true para evitar toast no load
            } else {
                setTemplate('classico', true);
            }
        } catch (e) {
            console.warn('Erro ao carregar template salvo:', e);
            setTemplate('classico', true);
        }
    }

    function resetTemplate() {
        if (confirm('Deseja resetar o tema para o padrão?')) {
            localStorage.removeItem(STORAGE_KEY);
            setTemplate('classico');
            if (window.CustomAppearanceManager && window.CustomAppearanceManager.showToast) {
                window.CustomAppearanceManager.showToast(`Configurações do tema ${currentTemplate} salvas!`);
            }
        }
    }

    function handleSaveAppearance() {
        saveTemplate();
    }

    function handleResetAppearance() {
        if (confirm(`Deseja resetar o tema ${currentTemplate} para o padrão?`)) {
            const defaultTemplate = templates[currentTemplate];
            if (defaultTemplate) {
                applyTemplate(defaultTemplate);
                saveTemplate(true);
                if (window.CustomAppearanceManager) {
                    window.CustomAppearanceManager.init();
                }
            }
        }
    }

    return {
        get currentTemplate() { return currentTemplate; },
        setTemplate,
        applyCustomStyles,
        saveTemplate,
        loadSavedTemplate,
        resetTemplate,
        handleSaveAppearance,
        handleResetAppearance
    };
})();

window.TemplateManager = TemplateManager;
// Atalho para facilitar no HTML
Object.defineProperty(window, 'currentTemplate', {
    get: () => TemplateManager.currentTemplate
});
