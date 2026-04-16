// store.js - Carrega os dados reais do TrilistaDB e renderiza a página pública da loja
(function() {
    async function hydrateStoreData(storeKey = null) {
        if (!window.TrilistaSupabaseSync || !window.TrilistaSupabaseSync.isConfigured()) {
            return;
        }

        try {
            if (storeKey) {
                await window.TrilistaSupabaseSync.loadStoreByDbKeyFromSupabase(storeKey);
                return;
            }

            if (window.TrilistaDB && typeof TrilistaDB.refreshCurrentStoreFromSupabase === 'function') {
                await TrilistaDB.refreshCurrentStoreFromSupabase();
            }
        } catch (error) {
            console.warn('Nao foi possivel hidratar a loja publica via Supabase:', error.message);
        }
    }

    function applyCoverShape(shape = 'rect') {
        const coverEl = document.getElementById('storeCover');
        if (!coverEl) return;

        coverEl.classList.remove('cover-shape-rect', 'cover-shape-curve-down', 'cover-shape-curve-up');

        const shapeClassMap = {
            rect: 'cover-shape-rect',
            'curve-down': 'cover-shape-curve-down',
            'curve-up': 'cover-shape-curve-up'
        };

        coverEl.classList.add(shapeClassMap[shape] || 'cover-shape-rect');
    }

    function applyCoverHeight(height = 124) {
        const coverEl = document.getElementById('storeCover');
        if (!coverEl) return;

        if (!coverEl.classList.contains('has-cover')) {
            coverEl.style.height = '';
            coverEl.style.marginBottom = '';
            return;
        }

        const safeHeight = Math.min(220, Math.max(80, parseInt(height, 10) || 124));
        const overlap = Math.round(safeHeight * 0.32);
        coverEl.style.height = `${safeHeight}px`;
        coverEl.style.marginBottom = `-${overlap}px`;
    }

    function getStoreData() {
        // Tentar carregar do TrilistaDB (localStorage centralizado)
        if (window.TrilistaDB) {
            try {
                return TrilistaDB.getDB();
            } catch (e) {
                console.error('Erro ao acessar TrilistaDB:', e);
            }
        }
        return null;
    }

    function applyAppearance(template) {
        if (!template) return;

        const root = document.documentElement;
        const body = document.body;
        const storeContent = document.getElementById('storeContent');
        const bgLayer = document.getElementById('storeBgLayer');
        applyCoverShape(template.coverShape || 'rect');
        applyCoverHeight(template.coverHeight || 124);

        // Função auxiliar para aplicar variáveis
        const applyVar = (name, val) => {
            root.style.setProperty(name, val);
            if (storeContent) storeContent.style.setProperty(name, val);
        };

        // Se for o tema customizado, aplicar todas as variáveis
        if (template.name === 'custom') {
            body.className = 'theme-custom';
            if (storeContent) {
                storeContent.classList.remove('theme-classico', 'theme-pink', 'theme-dark');
                storeContent.classList.add('theme-custom');
            }

            // Fundo
            if (template.bgType === 'color') {
                applyVar('--theme-bg', template.bgColor);
                if (bgLayer) {
                    bgLayer.style.backgroundImage = 'none';
                    bgLayer.style.backgroundColor = template.bgColor;
                }
            } else if (template.bgImage) {
                applyVar('--theme-bg', 'transparent');
                if (bgLayer) {
                    bgLayer.style.backgroundImage = `url(${template.bgImage})`;
                    bgLayer.style.backgroundSize = `${template.bgZoom || 100}%`;
                    bgLayer.style.opacity = (template.bgOpacity || 100) / 100;
                    
                    if (template.bgRepeat) {
                        bgLayer.style.backgroundRepeat = 'repeat';
                        bgLayer.style.backgroundPosition = template.bgPosition || 'center';
                        bgLayer.style.position = 'absolute';
                    } else {
                        bgLayer.style.backgroundRepeat = 'no-repeat';
                        bgLayer.style.backgroundPosition = 'center center';
                        bgLayer.style.position = 'fixed';
                    }
                }
            }

            // Texto
            applyVar('--theme-font-family', template.fontFamily || "'Inter', sans-serif");
            applyVar('--theme-text-color', template.textColor || '#1F2937');
            applyVar('--theme-font-size', (template.fontSize || 16) + 'px');
            applyVar('--theme-line-height', template.lineHeight || 1.5);
            applyVar('--theme-letter-spacing', (template.letterSpacing || 0) + 'px');
            applyVar('--theme-header-align', template.headerAlign || 'center');
            applyVar('--theme-font-weight', template.fontWeight || 700);
            applyVar('--theme-text-shadow', template.textShadow ? '0px 2px 4px rgba(0,0,0,0.3)' : 'none');

            // Botões
            applyVar('--theme-button-list-bg', template.btnListColor || template.btnColor || '#6366F1');
            applyVar('--theme-button-icon-bg', template.btnIconColorBg || template.btnColor || '#6366F1');
            applyVar('--theme-button-icon-opacity', (template.btnIconOpacity || 100) / 100);
            applyVar('--theme-button-icon-opacity-percent', (template.btnIconOpacity || 100) + '%');
            applyVar('--theme-button-text', template.btnTextColor || '#FFFFFF');
            applyVar('--theme-icon-color', template.btnIconColor || '#FFFFFF');
            
            // Variável genérica para compatibilidade
            applyVar('--theme-primary', template.btnIconColorBg || template.btnColor || '#6366F1');
            applyVar('--theme-button-bg', template.linkMode === 'full' ? (template.btnListColor || template.btnColor) : (template.btnIconColorBg || template.btnColor));

            // Modo Compacto
            if (template.linkMode === 'compact') {
                if (storeContent) storeContent.classList.add('links-compact');
            } else {
                if (storeContent) storeContent.classList.remove('links-compact');
            }

            // Logo (Tamanho e Posição)
            const avatar = document.getElementById('storeAvatar');
            if (avatar) {
                const baseSize = 80;
                const baseMargin = 8;
                const yOffset = parseInt(template.logoYOffset || 0);
                const scale = (template.logoSize || 100) / 100;
                const scaledGrowth = Math.max(0, ((baseSize * scale) - baseSize) / 2);
                const extraSpacing = Math.max(0, yOffset) + scaledGrowth;
                
                avatar.style.setProperty('transform', `translateY(${yOffset}px) scale(${scale})`, 'important');
                avatar.style.zIndex = "10";
                avatar.style.marginBottom = `${Math.round(baseMargin + extraSpacing)}px`;
            }

        } else {
            // Temas predefinidos (classico, pink, dark)
            if (storeContent) {
                storeContent.classList.remove('theme-classico', 'theme-pink', 'theme-dark', 'theme-custom', 'links-compact');
                storeContent.classList.add(`theme-${template.name}`);
            }
            body.className = `theme-${template.name}`;
            
            const themes = {
                classico: {
                    bg: '#FFCC00',
                    text: '#000000',
                    primary: '#000000',
                    buttonListBg: '#FFCC00',
                    buttonText: '#000000',
                    iconColor: '#000000',
                    cardRadius: '14px',
                    cardShadow: 'none',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: 1.5,
                    letterSpacing: '0px'
                },
                pink: { bg: '#fff0f6', text: '#6b0f1e', primary: '#d63384' },
                dark: { bg: '#0b0f18', text: '#f8fafc', primary: '#667eea' }
            };

            const t = themes[template.name] || themes.classico;
            applyVar('--theme-bg', t.bg);
            applyVar('--theme-text-color', t.text);
            applyVar('--theme-primary', t.primary);
            applyVar('--theme-button-bg', t.buttonListBg || t.primary);
            applyVar('--theme-button-list-bg', t.buttonListBg || t.primary);
            applyVar('--theme-button-text', t.buttonText || '#ffffff');
            applyVar('--theme-icon-color', t.iconColor || '#ffffff');
            applyVar('--theme-card-radius', t.cardRadius || '14px');
            applyVar('--theme-card-shadow', t.cardShadow || 'none');
            applyVar('--theme-font-family', t.fontFamily || "'Inter', sans-serif");
            applyVar('--theme-font-size', t.fontSize || '16px');
            applyVar('--theme-font-weight', t.fontWeight || 700);
            applyVar('--theme-line-height', t.lineHeight || 1.5);
            applyVar('--theme-letter-spacing', t.letterSpacing || '0px');
            
            if (bgLayer) {
                bgLayer.style.backgroundImage = 'none';
                bgLayer.style.backgroundColor = t.bg;
                bgLayer.style.opacity = 1;
            }
        }
    }
    }

    function renderProfile(profile) {
        if (!profile) return;

        const nameEl = document.getElementById('storeName');
        const bioEl = document.getElementById('storeBio');
        const avatarEl = document.getElementById('storeAvatar');
        const coverEl = document.getElementById('storeCover');
        const locationEl = document.getElementById('storeLocation');
        const addressEl = document.getElementById('storeAddress');

        if (nameEl) nameEl.textContent = profile.storeName || 'Minha Loja';
        if (bioEl) bioEl.innerHTML = profile.bio || '';

        if (profile.profilePhoto && avatarEl) {
            avatarEl.innerHTML = `<img src="${profile.profilePhoto}" alt="${profile.storeName}">`;
        }

        if (profile.coverPhoto && coverEl) {
            coverEl.style.backgroundImage = `url(${profile.coverPhoto})`;
            coverEl.classList.add('has-cover');
        }

        if ((profile.address || profile.city) && locationEl) {
            locationEl.style.display = 'flex';
            if (addressEl) {
                let addr = profile.address || '';
                if (profile.neighborhood) addr += `, ${profile.neighborhood}`;
                if (profile.city) addr += ` - ${profile.city}`;
                addressEl.textContent = addr;
            }
        }
    }

    function renderLinks(links, template) {
        const section = document.getElementById('links-section');
        if (!links || links.length === 0) return;

        if (section) section.style.display = 'block';
        if (window.LinksManager) {
            // Primeiro carregar os links no manager
            LinksManager.carregarLinks();
            
            // O LinksManager.carregarLinks() já chama atualizarPreview() internamente
            // Mas precisamos garantir que ele use o template correto
            // atualizarPreview() de links.js usa window.currentTemplate
        }
    }

    function renderGallery(gallery) {
        const section = document.getElementById('gallery-section');
        if (!gallery || gallery.length === 0) return;

        if (section) section.style.display = 'block';
        if (window.GaleriaManager) {
            GaleriaManager.carregarGaleria();
        }
    }

    function renderVideos(videos) {
        const section = document.getElementById('videos-section');
        if (!videos || videos.length === 0) return;

        if (section) section.style.display = 'block';
        if (window.VideosManager) {
            VideosManager.carregarVideos();
        }
    }

    function renderSegments(profile) {
        const section = document.getElementById('segments-section');
        const container = document.getElementById('phoneSegmentsPreview');
        if (!container) return;

        const cats = [];
        ['categoria1Text', 'categoria2Text', 'categoria3Text', 'categoria4Text'].forEach(key => {
            if (profile[key] && profile[key] !== 'Selecione uma opção') {
                cats.push(profile[key]);
            }
        });

        if (cats.length === 0) return;

        if (section) section.style.display = 'block';
        container.innerHTML = cats.map(cat => `<div class="segment-tag">${cat}</div>`).join('');
    }

    // Inicialização
    document.addEventListener('DOMContentLoaded', async function() {
        const urlParams = new URLSearchParams(window.location.search);
        const storeKey = urlParams.get('store');
        await hydrateStoreData(storeKey);

        const data = getStoreData();
        if (!data) {
            console.warn('Nenhum dado encontrado para carregar a loja.');
            const nameEl = document.getElementById('storeName');
            if (nameEl) nameEl.textContent = 'Loja não configurada';
            return;
        }

        // 0. Configurar variável global de template para outros módulos (como links.js)
        window.currentTemplate = data.template ? data.template.name : 'classico';

        // 1. Aplicar Aparência/Tema
        applyAppearance(data.template);

        // 2. Renderizar Perfil
        renderProfile(data.profile);
        applyCoverShape(data.template?.coverShape || 'rect');
        applyCoverHeight(data.template?.coverHeight || 124);

        // 3. Renderizar Conteúdo
        renderLinks(data.links, data.template);
        renderGallery(data.gallery);
        renderVideos(data.videos);
        renderSegments(data.profile);

        // 4. Registrar Visualização (Stats)
        if (window.TrilistaDB && !Auth.isImpersonating()) {
            TrilistaDB.recordView(storeKey);
        }

        // Forçar atualização das fontes e alinhamento após renderizar tudo (Reforço JS igual ao painel)
        if (data.template && data.template.name === 'custom') {
            const template = data.template;
            const font = template.fontFamily || "'Inter', sans-serif";
            
            // Aplicar ao store-bio explicitamente (Reforço)
            const bio = document.getElementById('storeBio');
            if (bio) {
                bio.style.setProperty('text-align', template.headerAlign || 'center', 'important');
                bio.style.setProperty('letter-spacing', `${template.letterSpacing || 0}px`, 'important');
                bio.style.setProperty('line-height', template.lineHeight || 1.5, 'important');
            }

            const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div:not(.phone-link-icon):not(.link-icon):not(.section-icon)');
            elements.forEach(el => {
                if (!el.classList.contains('fa') && !el.classList.contains('fas') && !el.classList.contains('fab') && !el.classList.contains('fa-solid') && !el.classList.contains('fa-brands') && el.tagName !== 'I' && el.tagName !== 'IMG') {
                    el.style.setProperty('font-family', font, 'important');
                }
            });
        }

        console.log('Loja carregada com sucesso!');
    });
})();
