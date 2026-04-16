// aparencia-custom.js - Lógica para o novo painel de personalização inteligente
const CustomAppearanceManager = (function() {
    const STORAGE_KEY = 'trilista_custom_appearance';
    // Configurações padrão
    let config = {
        bgColor: '#ffffff',
        bgType: 'color', // 'color' ou 'image'
        bgImage: null,
        bgZoom: 100,
        bgOpacity: 100,
        bgPosition: 'center',
        bgRepeat: false,
        
        fontFamily: "'Inter', sans-serif",
        textColor: '#1F2937',
        fontSize: 16,
        lineHeight: 1.5,
        letterSpacing: 0,
        headerAlign: 'center',
        fontWeight: 700,
        textShadow: false,
        
        btnColor: '#6366F1', // Legado/Geral
        btnListColor: '#6366F1', // Cor específica para o modo Lista
        btnIconColorBg: '#6366F1', // Cor específica para o modo Ícone (Fundo)
        btnIconOpacity: 100, // Transparência para o modo Ícone (0-100)
        btnTextColor: '#FFFFFF',
        btnIconBg: '', // Vazio por padrão para seguir a lógica inteligente do CSS
        btnIconColor: '#FFFFFF', // Nova: Cor específica do ícone
        iconCompactSize: 30,
        iconCompactGap: 6,
        iconCompactRadius: 9,
        
        // Configurações de Logo
        logoSize: 100,
        logoYOffset: 0,
        coverShape: 'rect',
        coverHeight: 124,

        linkMode: 'full', // 'full' (atual) ou 'compact' (botão de app)
        // Layout custom
        layoutStyle: 'standard',
        layoutSpacing: 15
    };

    function getScopedStorageKey() {
        const dbKey = window.TrilistaDB && typeof window.TrilistaDB.getCurrentDBKey === 'function'
            ? window.TrilistaDB.getCurrentDBKey()
            : null;
        return dbKey ? `${STORAGE_KEY}_${dbKey}` : STORAGE_KEY;
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

    function applyPanelThemeVars() {
        const root = document.documentElement;
        const accent = config.btnColor || config.btnListColor || config.btnIconColorBg || '#6366F1';
        const accentContrast = getContrastColor(accent);
        const textColor = config.textColor || '#1F2937';
        root.style.setProperty('--theme-panel-icon-bg', accent);
        root.style.setProperty('--theme-panel-icon-color', accentContrast);
        root.style.setProperty('--theme-primary', accent);
        root.style.setProperty('--theme-primary-text', accentContrast);
        root.style.setProperty('--theme-status-bar-bg', accent);
        root.style.setProperty('--theme-status-bar-text', accentContrast);
        root.style.setProperty('--primary-color', accent);
        root.style.setProperty('--text-color', textColor);
        root.style.setProperty('--border-color', `color-mix(in srgb, ${accent} 16%, #dbe3ef)`);
        root.style.setProperty('--primary-soft', `color-mix(in srgb, ${accent} 12%, white)`);
        root.style.setProperty('--primary-soft-strong', `color-mix(in srgb, ${accent} 18%, white)`);
        root.style.setProperty('--primary-soft-border', `color-mix(in srgb, ${accent} 32%, #dbe3ef)`);
        root.style.setProperty('--primary-shadow', `color-mix(in srgb, ${accent} 22%, transparent)`);
    }

    function init() {
        loadSettings();
        injectMissingUI();
        applyPanelThemeVars();
        applyAllStyles();
    }

    function injectMissingUI() {
        const controlsGrid = document.querySelector('#custom-mode-controls .control-grid-smart');
        
        // --- CONTROLES DE BOTÕES ---
        if (controlsGrid) {
            // Se o seletor de cor do texto do botão não existir, injetamos ele
            if (!document.getElementById('btn-text-color-picker')) {
                const textControl = document.createElement('div');
                textControl.className = 'control-group';
                textControl.innerHTML = `
                    <label class="group-label">Cor do Texto da Lista</label>
                    <div class="color-picker-compact">
                        <input type="color" id="btn-text-color-picker" oninput="CustomAppearanceManager.updatePreview('btnTextColor', this.value)" value="#FFFFFF">
                        <input type="text" class="color-hex-small" id="btn-text-color-hex" value="#FFFFFF" onchange="CustomAppearanceManager.updatePreview('btnTextColor', this.value)">
                    </div>
                `;
                // Inserir após o primeiro controle (Cor Fundo Botão)
                controlsGrid.insertBefore(textControl, controlsGrid.children[1]);
            }

            // Se o seletor de fundo do ícone não existir, injetamos ele (agora apenas transparência para Cor do Botão em Ícones)
            if (!document.getElementById('btn-icon-opacity-range')) {
                const iconOpacityControl = document.createElement('div');
                iconOpacityControl.id = 'btn-icon-opacity-group';
                iconOpacityControl.className = 'control-group';
                iconOpacityControl.style.marginTop = '5px';
                iconOpacityControl.innerHTML = `
                    <label class="group-label">Transparência do Botão</label>
                    <div class="range-with-value">
                        <input type="range" id="btn-icon-opacity-range" min="0" max="100" value="100" oninput="CustomAppearanceManager.updatePreview('btnIconOpacity', this.value); this.nextElementSibling.textContent = this.value + '%'">
                        <span class="range-badge">100%</span>
                    </div>
                `;
                // Inserir após o controle de cor do botão
                controlsGrid.appendChild(iconOpacityControl);
            }

            if (!document.getElementById('btn-icon-size-range')) {
                const iconSizeControl = document.createElement('div');
                iconSizeControl.id = 'btn-icon-size-group';
                iconSizeControl.className = 'control-group';
                iconSizeControl.style.marginTop = '5px';
                iconSizeControl.innerHTML = `
                    <label class="group-label">Tamanho do Ícone</label>
                    <div class="range-with-value">
                        <input type="range" id="btn-icon-size-range" min="24" max="44" value="30" oninput="CustomAppearanceManager.updatePreview('iconCompactSize', this.value); this.nextElementSibling.textContent = this.value + 'px'">
                        <span class="range-badge">30px</span>
                    </div>
                `;
                controlsGrid.appendChild(iconSizeControl);
            }

            if (!document.getElementById('btn-icon-gap-range')) {
                const iconGapControl = document.createElement('div');
                iconGapControl.id = 'btn-icon-gap-group';
                iconGapControl.className = 'control-group';
                iconGapControl.style.marginTop = '5px';
                iconGapControl.innerHTML = `
                    <label class="group-label">Espaçamento entre Ícones</label>
                    <div class="range-with-value">
                        <input type="range" id="btn-icon-gap-range" min="0" max="18" value="6" oninput="CustomAppearanceManager.updatePreview('iconCompactGap', this.value); this.nextElementSibling.textContent = this.value + 'px'">
                        <span class="range-badge">6px</span>
                    </div>
                `;
                controlsGrid.appendChild(iconGapControl);
            }

            if (!document.getElementById('btn-icon-radius-range')) {
                const iconRadiusControl = document.createElement('div');
                iconRadiusControl.id = 'btn-icon-radius-group';
                iconRadiusControl.className = 'control-group';
                iconRadiusControl.style.marginTop = '5px';
                iconRadiusControl.innerHTML = `
                    <label class="group-label">Formato do Botão</label>
                    <div class="range-with-value">
                        <input type="range" id="btn-icon-radius-range" min="0" max="22" value="9" oninput="CustomAppearanceManager.updatePreview('iconCompactRadius', this.value); this.nextElementSibling.textContent = this.value + 'px'">
                        <span class="range-badge">9px</span>
                    </div>
                `;
                controlsGrid.appendChild(iconRadiusControl);
            }
        }

        // --- CONTROLES DE TEXTO ---
        const tabText = document.getElementById('tab-text');
        if (tabText) {
            // Injetar novos controles de texto se não existirem
            if (!document.getElementById('letter-spacing-range')) {
                const textExtraControls = document.createElement('div');
                textExtraControls.innerHTML = `
                    <div class="control-group">
                        <label class="group-label">Espaçamento Letras</label>
                        <div class="range-with-value">
                            <input type="range" id="letter-spacing-range" min="-2" max="10" value="0" oninput="CustomAppearanceManager.updatePreview('letterSpacing', this.value); this.nextElementSibling.textContent = this.value + 'px'">
                            <span class="range-badge">0px</span>
                        </div>
                    </div>
                    <div class="control-grid-smart">
                        <div class="control-group">
                            <label class="group-label">Alinhamento Cabeçalho</label>
                            <select class="smart-select" id="header-align-select" onchange="CustomAppearanceManager.updatePreview('headerAlign', this.value)" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.85rem;">
                                <option value="left">Esquerda</option>
                                <option value="center" selected>Centro</option>
                                <option value="right">Direita</option>
                            </select>
                        </div>
                        <div class="control-group">
                            <label class="group-label">Peso Título</label>
                            <select class="smart-select" id="font-weight-select" onchange="CustomAppearanceManager.updatePreview('fontWeight', this.value)" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.85rem;">
                                <option value="400">Normal</option>
                                <option value="600">Semi-Negrito</option>
                                <option value="700" selected>Negrito</option>
                                <option value="800">Extra-Negrito</option>
                            </select>
                        </div>
                    </div>
                    <div class="control-group">
                        <div style="display: flex; align-items: center; justify-content: space-between; background: #f1f5f9; padding: 10px; border-radius: 10px;">
                            <label class="group-label" style="margin-bottom: 0;">Sombra no Texto (Melhora leitura)</label>
                            <label class="smart-switch">
                                <input type="checkbox" id="text-shadow-check" onchange="CustomAppearanceManager.updatePreview('textShadow', this.checked)">
                                <span class="switch-slider"></span>
                            </label>
                        </div>
                    </div>
                `;
                tabText.appendChild(textExtraControls);
            }
        }
    }

    function switchTab(type) {
        const tabs = document.querySelectorAll('.sidebar-tab');
        const contents = document.querySelectorAll('.tab-pane');
        
        tabs.forEach(btn => btn.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));
        
        // Mapeamento de tipos para IDs de abas
        const tabMap = {
            'bg': 'tab-bg',
            'text': 'tab-text',
            'buttons': 'tab-buttons',
            'layout': 'tab-layout'
        };

        const targetTabId = tabMap[type];
        if (targetTabId) {
            const activeTab = document.getElementById(targetTabId);
            if (activeTab) activeTab.classList.add('active');
            
            // Encontrar o botão correspondente
            tabs.forEach(btn => {
                if (btn.getAttribute('onclick').includes(`'${type}'`)) {
                    btn.classList.add('active');
                }
            });
        }
    }

    function handleBgUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            config.bgImage = e.target.result;
            config.bgType = 'image';
            const bgControls = document.getElementById('bg-controls');
            if (bgControls) bgControls.style.display = 'block';
            updatePreview('bgImage', e.target.result);
        };
        reader.readAsDataURL(file);
    }

    function applyCoverShape(shape = 'rect') {
        const cover = document.getElementById('storeCover');
        if (!cover) return;

        cover.classList.remove('cover-shape-rect', 'cover-shape-curve-down', 'cover-shape-curve-up');

        const shapeClassMap = {
            rect: 'cover-shape-rect',
            'curve-down': 'cover-shape-curve-down',
            'curve-up': 'cover-shape-curve-up'
        };

        cover.classList.add(shapeClassMap[shape] || 'cover-shape-rect');
    }

    function applyCoverHeight(height = 124) {
        const cover = document.getElementById('storeCover');
        if (!cover) return;

        if (!cover.classList.contains('has-cover')) {
            cover.style.height = '';
            cover.style.marginBottom = '';
            return;
        }

        const safeHeight = Math.min(220, Math.max(80, parseInt(height, 10) || 124));
        const overlap = Math.round(safeHeight * 0.32);

        cover.style.height = `${safeHeight}px`;
        cover.style.marginBottom = `-${overlap}px`;
    }

    function setCoverShape(shape) {
        config.coverShape = shape;
        syncUIElement('coverShape', shape);
        applyCoverShape(shape);
        saveSettings(true);
    }

    // Debounce para atualizações de preview pesadas
    let updateTimeout;
    function updatePreview(prop, value) {
        if (prop) {
            // Se for opacidade, converter para 0-100 se vier do range (0.1, 0.2...)
            if (prop === 'bgOpacity') {
                config.bgOpacity = parseFloat(value) * 100;
            } else if (prop === 'btnColor') {
                // Se estiver alterando a cor do botão genérico, aplicar ao modo atual
                if (config.linkMode === 'full') {
                    config.btnListColor = value;
                } else {
                    config.btnIconColorBg = value;
                }
                config.btnColor = value;
            } else {
                config[prop] = value;
            }
            
            // Sincronização imediata de inputs de UI (não pesada)
            syncUIElement(prop, value);
        }
        
        // Debounce do preview real (DOM manipulation/CSS variables)
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            const preview = document.querySelector('.store-content');
            const bgLayer = document.getElementById('previewBgLayer');
            if (!preview || !bgLayer) return;

            // Atualizar Fundo
            if (config.bgType === 'color') {
                preview.style.backgroundColor = config.bgColor;
                bgLayer.style.backgroundImage = 'none';
                bgLayer.style.opacity = 1;
            } else if (config.bgImage) {
                // Fundo transparente no container rolável para ver o layer de fundo fixo atrás
                preview.style.backgroundColor = 'transparent'; 
                bgLayer.style.backgroundImage = `url(${config.bgImage})`;
                bgLayer.style.backgroundSize = `${config.bgZoom}%`;
                bgLayer.style.opacity = config.bgOpacity / 100;
                
                if (config.bgRepeat) {
                    bgLayer.style.backgroundRepeat = 'repeat';
                    bgLayer.style.backgroundPosition = config.bgPosition;
                    // No modo repetir, o fundo precisa rolar junto
                    bgLayer.style.position = 'absolute';
                    bgLayer.style.height = `${preview.scrollHeight}px`;
                } else {
                    bgLayer.style.backgroundRepeat = 'no-repeat';
                    bgLayer.style.backgroundPosition = 'center center';
                    // No modo centralizado, o fundo fica fixo na tela do celular
                    bgLayer.style.position = 'absolute';
                    bgLayer.style.height = '100%';
                }
            }

            // Atualizar Texto (CSS Variables para melhor controle)
            const previewContent = document.querySelector('.store-content');
            
            const applyVariable = (name, val) => {
                if (previewContent) previewContent.style.setProperty(name, val);
            };

            applyPanelThemeVars();

            applyVariable('--theme-font-family', config.fontFamily);
            applyVariable('--theme-text-color', config.textColor);
            applyVariable('--theme-primary', config.btnColor); // Aplicado para a status bar
            applyVariable('--theme-font-size', `${config.fontSize}px`);
            applyVariable('--theme-line-height', config.lineHeight);
            applyVariable('--theme-letter-spacing', `${config.letterSpacing}px`);
            applyVariable('--theme-header-align', config.headerAlign);
            applyVariable('--theme-font-weight', config.fontWeight);
            applyVariable('--theme-text-shadow', config.textShadow ? '0px 2px 4px rgba(0,0,0,0.3)' : 'none');
            applyVariable('--theme-layout-style', config.layoutStyle);
            applyVariable('--theme-layout-spacing', `${config.layoutSpacing}px`);

            if (previewContent) {
                previewContent.classList.toggle('layout-standard', config.layoutStyle === 'standard');
                previewContent.classList.toggle('layout-compact', config.layoutStyle === 'compact');
                previewContent.classList.toggle('layout-spacious', config.layoutStyle === 'spacious');

                previewContent.style.setProperty('--theme-layout-spacing', `${config.layoutSpacing}px`);
                previewContent.querySelectorAll('.store-section').forEach(section => {
                    section.style.marginBottom = `${config.layoutSpacing}px`;
                });
            }

            // Aplicar também ao store-bio explicitamente
            const bio = preview.querySelector('.store-bio');
            if (bio) {
                bio.style.setProperty('text-align', config.headerAlign, 'important');
                bio.style.setProperty('letter-spacing', `${config.letterSpacing}px`, 'important');
                bio.style.setProperty('line-height', config.lineHeight, 'important');
            }

            // Preservar comportamento antigo de fallback para elementos genéricos
            preview.style.setProperty('font-family', config.fontFamily, 'important');
            preview.style.color = config.textColor;

            // Forçar a fonte apenas em elementos que contenham texto real, ignorando ícones
            const textElements = preview.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div:not(.phone-link-icon):not(.link-icon):not(.section-icon)');
            textElements.forEach(el => {
                // Se o elemento for um ícone do FontAwesome ou uma imagem, não mexemos na fonte
                if (!el.classList.contains('fa') && !el.classList.contains('fas') && !el.classList.contains('fab') && !el.classList.contains('fa-solid') && !el.classList.contains('fa-brands') && el.tagName !== 'I' && el.tagName !== 'IMG') {
                    el.style.setProperty('font-family', config.fontFamily, 'important');
                }
            });

            // Atualizar Botões (CSS Variables)
            // Reutilizar previewContent definido acima
            
            // Aplicar apenas no preview do tema custom para não vazar para outros temas
            const applyBtnVar = (name, val) => {
                if (previewContent) previewContent.style.setProperty(name, val);
            };

            // Novas variáveis separadas
            applyBtnVar('--theme-button-list-bg', config.btnListColor || config.btnColor);
            applyBtnVar('--theme-button-list-text', config.btnTextColor);
            applyBtnVar('--theme-button-icon-bg', config.btnIconColorBg || config.btnColor);
            applyBtnVar('--theme-segment-bg', config.linkMode === 'compact'
                ? (config.btnIconColorBg || config.btnColor)
                : (config.btnListColor || config.btnColor));
            applyBtnVar('--theme-segment-text', config.btnTextColor || getContrastColor(
                config.linkMode === 'compact'
                    ? (config.btnIconColorBg || config.btnColor || '#6366F1')
                    : (config.btnListColor || config.btnColor || '#6366F1')
            ));
            applyBtnVar('--theme-button-icon-opacity', (config.btnIconOpacity || 100) / 100);
            applyBtnVar('--theme-button-icon-opacity-percent', (config.btnIconOpacity || 100) + '%');
            applyBtnVar('--theme-compact-icon-size', `${config.iconCompactSize || 30}px`);
            applyBtnVar('--theme-compact-icon-gap', `${config.iconCompactGap ?? 6}px`);
            applyBtnVar('--theme-compact-item-size', `${(parseInt(config.iconCompactSize || 30, 10) + 12)}px`);
            applyBtnVar('--theme-compact-icon-radius', `${config.iconCompactRadius ?? 9}px`);
            applyBtnVar('--theme-compact-icon-font-size', `${Math.max(14, Math.round((parseInt(config.iconCompactSize || 30, 10)) * 0.5))}px`);
            
            // Mantém compatibilidade legado se necessário
            applyBtnVar('--theme-button-bg', config.linkMode === 'full' ? (config.btnListColor || config.btnColor) : (config.btnIconColorBg || config.btnColor));
            
            applyBtnVar('--theme-button-text', config.btnTextColor);
            
            if (config.btnIconBg) {
                applyBtnVar('--theme-icon-bg', config.btnIconBg);
            } else {
                if (previewContent) previewContent.style.removeProperty('--theme-icon-bg');
            }

            if (config.btnIconColor) {
                applyBtnVar('--theme-icon-color', config.btnIconColor);
            } else {
                if (previewContent) previewContent.style.removeProperty('--theme-icon-color');
            }

            applyBtnVar('--theme-card-radius', '14px');
            applyBtnVar('--theme-card-shadow', 'none');

            // Atualizar Logo (Tamanho e Posição)
            const avatar = preview.querySelector('.store-avatar');
            if (avatar) {
                const baseSize = 80;
                const baseMargin = 12;
                const scale = (config.logoSize || 100) / 100;
                const yOffset = parseInt(config.logoYOffset || 0);
                const scaledGrowth = Math.max(0, ((baseSize * scale) - baseSize) / 2);
                const extraSpacing = Math.max(0, yOffset) + scaledGrowth;
                
                // Aplicar transform para escala e posição
                avatar.style.setProperty('transform', `translateY(${yOffset}px) scale(${scale})`, 'important');
                avatar.style.transformOrigin = 'center center';
                avatar.style.zIndex = "10";
                avatar.style.marginBottom = `${Math.round(baseMargin + extraSpacing)}px`;
            }
            
            // DISPARAR ATUALIZAÇÃO DOS LINKS NO PREVIEW
            applyCoverShape(config.coverShape || 'rect');
            applyCoverHeight(config.coverHeight || 124);

            if (window.LinksManager && typeof window.LinksManager.atualizarPreview === 'function') {
                window.LinksManager.atualizarPreview();
            }
            
            // Auto-save silencioso no DB para evitar perda de dados se o usuário esquecer
            saveSettings(true);
        }, 50); // 50ms é imperceptível mas agrupa eventos rápidos
    }

    function syncUIElement(prop, value) {
        const syncMap = {
            'bgColor': { hex: 'bg-color-hex', picker: 'bg-color-picker' },
            'textColor': { hex: 'text-color-hex', picker: 'text-color-picker' },
            'btnColor': { hex: 'btn-color-hex', picker: 'btn-color-picker' },
            'btnListColor': { hex: 'btn-color-hex', picker: 'btn-color-picker' },
            'btnIconColorBg': { hex: 'btn-color-hex', picker: 'btn-color-picker' },
            'btnTextColor': { hex: 'btn-text-color-hex', picker: 'btn-text-color-picker' },
            'btnIconBg': { hex: 'btn-icon-bg-hex', picker: 'btn-icon-bg-picker' },
            'btnIconColor': { hex: 'btn-icon-color-hex', picker: 'btn-icon-color-picker' },
            'btnIconOpacity': { range: 'btn-icon-opacity-range' },
            'iconCompactSize': { range: 'btn-icon-size-range', unit: 'px' },
            'iconCompactGap': { range: 'btn-icon-gap-range', unit: 'px' },
            'iconCompactRadius': { range: 'btn-icon-radius-range', unit: 'px' },
            'coverHeight': { range: 'cover-height-range', unit: 'px' }
        };

        if (prop === 'coverShape') {
            document.querySelectorAll('.cover-shape-option').forEach(btn => btn.classList.remove('active'));
            const activeButton = document.getElementById(`cover-shape-${value}`);
            if (activeButton) activeButton.classList.add('active');
            return;
        }

        if (syncMap[prop]) {
            if (syncMap[prop].hex || syncMap[prop].picker) {
                const hexInput = document.getElementById(syncMap[prop].hex);
                const picker = document.getElementById(syncMap[prop].picker);
                
                // Se estiver sincronizando btnColor mas já tivermos valores específicos, ignorar
                // Ou se for um valor específico, sincronizar o input genérico de "Cor Fundo Botão"
                if (prop === 'btnListColor' && config.linkMode !== 'full') return;
                if (prop === 'btnIconColorBg' && config.linkMode !== 'compact') return;

                if (hexInput) hexInput.value = value.toUpperCase();
                if (picker) picker.value = value;
            }

            if (syncMap[prop].range) {
                const range = document.getElementById(syncMap[prop].range);
                if (range) {
                    range.value = value;
                    const badge = range.nextElementSibling;
                    if (badge) badge.textContent = value + (syncMap[prop].unit || '%');
                }
            }
        }
    }

    function setupDragAndDrop() {
        const container = document.querySelector('.store-content');
        if (!container) return;

        // Adicionar classes draggables aos elementos existentes
        const elements = {
            header: container.querySelector('.store-header'),
            location: container.querySelector('#previewStoreLocation'),
            links: container.querySelector('#links-preview-section'),
            gallery: container.querySelector('.gallery-carousel')?.closest('.store-section'),
            videos: container.querySelector('#videos-preview-section'),
            segments: container.querySelector('#segments-preview-section')
        };

        Object.entries(elements).forEach(([key, el]) => {
            if (el) {
                el.setAttribute('draggable', true);
                el.classList.add('draggable-item');
                el.dataset.elementId = key;
                
                el.addEventListener('dragstart', (e) => {
                    el.classList.add('dragging');
                    e.dataTransfer.setData('text/plain', key);
                });

                el.addEventListener('dragend', () => {
                    el.classList.remove('dragging');
                    saveElementsOrder();
                });
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            const afterElement = getDragAfterElement(container, e.clientY);
            if (afterElement == null) {
                container.appendChild(dragging);
            } else {
                container.insertBefore(dragging, afterElement);
            }
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.draggable-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function saveElementsOrder() {
        const container = document.querySelector('.store-content');
        const items = [...container.querySelectorAll('.draggable-item')];
        config.elementsOrder = items.map(item => item.dataset.elementId);
    }

    function setLinkMode(mode) {
        config.linkMode = mode;
        
        // Atualizar botões na UI
        const btnFull = document.getElementById('link-mode-full');
        const btnCompact = document.getElementById('link-mode-compact');
        const label = document.getElementById('custom-controls-label');
        
        if (btnFull && btnCompact) {
            btnFull.classList.toggle('active', mode === 'full');
            btnCompact.classList.toggle('active', mode === 'compact');
        }

        // Atualizar texto do label para contexto
        if (label) {
            label.textContent = mode === 'full' ? 'Personalização do Botão (Lista):' : 'Personalização do Botão (Ícone):';
        }

        // Mostrar/Ocultar "Cor do Texto da Lista" apenas no modo Lista
        const btnTextColorControl = document.getElementById('btn-text-color-picker')?.closest('.control-group');
        if (btnTextColorControl) {
            btnTextColorControl.style.display = (mode === 'full') ? 'block' : 'none';
            const textLabel = btnTextColorControl.querySelector('.group-label');
            if (textLabel) textLabel.textContent = 'Cor do Texto da Lista';
        }

        // Alterar label de Cor Fundo Botão baseado no modo
        const btnColorLabel = document.getElementById('btn-color-picker')?.closest('.control-group')?.querySelector('.group-label');
        if (btnColorLabel) {
            btnColorLabel.textContent = (mode === 'full') ? 'Cor da Lista' : 'Cor do Botão';
        }

        // Garantir que "Cor do Ícone" esteja visível e no lugar certo
        const btnIconColorControl = document.getElementById('btn-icon-color-picker')?.closest('.control-group');
        if (btnIconColorControl) {
            btnIconColorControl.style.display = 'block';
            const iconLabel = btnIconColorControl.querySelector('.group-label');
            if (iconLabel) iconLabel.textContent = 'Cor do Ícone';
        }

        // Mostrar/Ocultar "Transparência do Botão" apenas no modo Ícones
        const btnIconOpacityControl = document.getElementById('btn-icon-opacity-group');
        if (btnIconOpacityControl) {
            btnIconOpacityControl.style.display = (mode === 'compact') ? 'block' : 'none';
        }

        const btnIconSizeControl = document.getElementById('btn-icon-size-group');
        if (btnIconSizeControl) {
            btnIconSizeControl.style.display = (mode === 'compact') ? 'block' : 'none';
        }

        const btnIconGapControl = document.getElementById('btn-icon-gap-group');
        if (btnIconGapControl) {
            btnIconGapControl.style.display = (mode === 'compact') ? 'block' : 'none';
        }

        const btnIconRadiusControl = document.getElementById('btn-icon-radius-group');
        if (btnIconRadiusControl) {
            btnIconRadiusControl.style.display = (mode === 'compact') ? 'block' : 'none';
        }
        
        // Aplicar classe ao preview
        const preview = document.querySelector('.store-content');
        if (preview) {
            preview.classList.toggle('links-compact', mode === 'compact');
        }

        // Forçar atualização do preview dos links
        updatePreview();

        // Sincronizar o seletor de cor com a cor do modo atual
        const currentColor = (mode === 'full') ? config.btnListColor : config.btnIconColorBg;
        syncUIElement('btnColor', currentColor);
    }

    function applyAllStyles() {
        const preview = document.querySelector('.store-content');
        if (!preview) return;

        applyPanelThemeVars();

        // Limpar outros temas e forçar o custom
        preview.classList.remove('theme-classico', 'theme-pink', 'theme-dark');
        preview.classList.add('theme-custom');

        // Aplicar modo de link salvo (ícone ou lista)
        preview.classList.toggle('links-compact', config.linkMode === 'compact');
        applyCoverShape(config.coverShape || 'rect');
        
        // Sincronizar UI do modo de link
        const mode = config.linkMode || 'full';
        const label = document.getElementById('custom-controls-label');
        if (label) {
            label.textContent = (mode === 'full') ? 'Personalização do Botão (Lista):' : 'Personalização do Botão (Ícone):';
        }

        const btnColorLabel = document.getElementById('btn-color-picker')?.closest('.control-group')?.querySelector('.group-label');
        if (btnColorLabel) {
            btnColorLabel.textContent = (mode === 'full') ? 'Cor da Lista' : 'Cor do Botão';
        }

        const btnTextColorControl = document.getElementById('btn-text-color-picker')?.closest('.control-group');
        if (btnTextColorControl) {
            btnTextColorControl.style.display = (mode === 'full') ? 'block' : 'none';
            const textLabel = btnTextColorControl.querySelector('.group-label');
            if (textLabel) textLabel.textContent = 'Cor do Texto da Lista';
        }

        const btnIconColorControl = document.getElementById('btn-icon-color-picker')?.closest('.control-group');
        if (btnIconColorControl) {
            btnIconColorControl.style.display = 'block';
            const iconLabel = btnIconColorControl.querySelector('.group-label');
            if (iconLabel) iconLabel.textContent = 'Cor do Ícone';
        }

        const btnIconOpacityControl = document.getElementById('btn-icon-opacity-group');
        if (btnIconOpacityControl) {
            btnIconOpacityControl.style.display = (mode === 'compact') ? 'block' : 'none';
        }

        const btnIconSizeControl = document.getElementById('btn-icon-size-group');
        if (btnIconSizeControl) {
            btnIconSizeControl.style.display = (mode === 'compact') ? 'block' : 'none';
        }

        const btnIconGapControl = document.getElementById('btn-icon-gap-group');
        if (btnIconGapControl) {
            btnIconGapControl.style.display = (mode === 'compact') ? 'block' : 'none';
        }

        const btnIconRadiusControl = document.getElementById('btn-icon-radius-group');
        if (btnIconRadiusControl) {
            btnIconRadiusControl.style.display = (mode === 'compact') ? 'block' : 'none';
        }

        // Atualizar botões de toggle se existirem
        const btnFull = document.getElementById('link-mode-full');
        const btnCompact = document.getElementById('link-mode-compact');
        if (btnFull && btnCompact) {
            btnFull.classList.toggle('active', config.linkMode === 'full');
            btnCompact.classList.toggle('active', config.linkMode === 'compact');
        }

        updatePreview();
        
        // Forçar a fonte no preview ao carregar (apenas elementos de texto)
        if (preview && config.fontFamily) {
            preview.style.setProperty('font-family', config.fontFamily, 'important');
            const textElements = preview.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div:not(.phone-link-icon):not(.link-icon):not(.section-icon)');
            textElements.forEach(el => {
                if (!el.classList.contains('fa') && !el.classList.contains('fas') && !el.classList.contains('fab') && !el.classList.contains('fa-solid') && !el.classList.contains('fa-brands') && el.tagName !== 'I' && el.tagName !== 'IMG') {
                    el.style.setProperty('font-family', config.fontFamily, 'important');
                }
            });
        }
    }

    // Função auxiliar para notificações
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function saveSettings(silent = false) {
        try {
            // Garantir que o nome seja custom
            config.name = 'custom';
            
            // Salvar no storage local do módulo (fallback local)
            localStorage.setItem(getScopedStorageKey(), JSON.stringify(config));
            
            // Sincronizar com o TrilistaDB se disponível (Fonte da Verdade)
            if (window.TrilistaDB) {
                window.TrilistaDB.saveTemplate({
                    ...config
                });
            }
            
            if (!silent) {
                showToast('Aparência salva com sucesso!');
            }
            return true;
        } catch (e) {
            console.error('Erro ao salvar:', e);
            if (!silent) alert('Erro ao salvar as configurações.');
            return false;
        }
    }

    function resetSettings() {
        if (confirm('Tem certeza que deseja resetar todas as personalizações? Isso voltará para as configurações padrão.')) {
            localStorage.removeItem(getScopedStorageKey());
            // Restaurar config padrão
            config = {
                bgColor: '#ffffff',
                bgType: 'color',
                bgImage: null,
                bgZoom: 100,
                bgOpacity: 100,
                bgPosition: 'center',
                bgRepeat: false,
                fontFamily: "'Inter', sans-serif",
                textColor: '#1F2937',
                fontSize: 16,
                lineHeight: 1.5,
                btnColor: '#6366F1',
                btnListColor: '#6366F1',
                btnIconColorBg: '#6366F1',
                btnIconOpacity: 100,
                btnTextColor: '#FFFFFF',
                btnIconBg: '',
                btnIconColor: '#FFFFFF',
                iconCompactSize: 30,
                iconCompactGap: 6,
                iconCompactRadius: 9,
                layoutStyle: 'standard',
                layoutSpacing: 15,
                logoSize: 100,
                logoYOffset: 0,
                coverShape: 'rect',
                coverHeight: 124
            };
            syncUIToConfig();
            applyAllStyles();
            showToast('Personalização resetada!');
        }
    }

    function loadSettings() {
        try {
            let saved = null;
            const scopedStorageKey = getScopedStorageKey();

            const rawScoped = localStorage.getItem(scopedStorageKey);
            if (rawScoped) {
                saved = JSON.parse(rawScoped);
            }

            if (!saved && window.TrilistaDB) {
                const dbTemplate = window.TrilistaDB.getTemplate();
                if (dbTemplate && dbTemplate.name === 'custom' && Object.keys(dbTemplate).length > 2) {
                    saved = dbTemplate;
                }
            }

            if (saved) {
                // Mesclar configurações salvas com as padrão
                config = { ...config, ...saved };
                // Garantir que o nome seja custom
                config.name = 'custom';

                // Normalizar cores do tema custom para não herdar aparência do tema anterior
                if (!config.btnColor) config.btnColor = '#6366F1';
                if (!config.btnListColor) config.btnListColor = config.btnColor;
                if (!config.btnIconColorBg) config.btnIconColorBg = config.btnColor;
                if (!config.btnIconColor) config.btnIconColor = '#FFFFFF';
                if (!config.iconCompactSize) config.iconCompactSize = 30;
                if (config.iconCompactGap === undefined || config.iconCompactGap === null) config.iconCompactGap = 6;
                if (config.iconCompactRadius === undefined || config.iconCompactRadius === null) config.iconCompactRadius = 9;
                
                // Se houver uma imagem, mas o tipo não for 'image', inferir (legado)
                if (config.bgImage && config.bgType !== 'image') {
                    config.bgType = 'image';
                }
                
                // Sincronizar UI
                syncUIToConfig();
            }
            else {
                config.btnListColor = config.btnListColor || config.btnColor || '#6366F1';
                config.btnIconColorBg = config.btnIconColorBg || config.btnColor || '#6366F1';
                config.btnIconColor = config.btnIconColor || '#FFFFFF';
                config.iconCompactSize = config.iconCompactSize || 30;
                config.iconCompactGap = config.iconCompactGap ?? 6;
                config.iconCompactRadius = config.iconCompactRadius ?? 9;
            }
        } catch (e) {
            console.error('Erro ao carregar configurações customizadas:', e);
        }
    }

    function syncUIToConfig() {
        const bgColorPicker = document.getElementById('bg-color-picker');
        if (bgColorPicker) bgColorPicker.value = config.bgColor;
        
        const bgColorHex = document.getElementById('bg-color-hex');
        if (bgColorHex) bgColorHex.value = config.bgColor.toUpperCase();
        
        const bgOpacityRange = document.querySelector('input[oninput*="bgOpacity"]');
        if (bgOpacityRange) {
            bgOpacityRange.value = config.bgOpacity / 100;
        }

        const bgZoomRange = document.querySelector('input[oninput*="bgZoom"]');
        if (bgZoomRange) bgZoomRange.value = config.bgZoom;

        // Sincronizar Logo
        const logoSizeRange = document.getElementById('logo-size-range');
        if (logoSizeRange) {
            logoSizeRange.value = config.logoSize || 100;
            const badge = logoSizeRange.nextElementSibling;
            if (badge) badge.textContent = `${config.logoSize || 100}%`;
        }

        const logoYRange = document.getElementById('logo-y-range');
        if (logoYRange) {
            logoYRange.value = config.logoYOffset || 0;
            const badge = logoYRange.nextElementSibling;
            if (badge) badge.textContent = `${config.logoYOffset || 0}px`;
        }

        syncUIElement('coverShape', config.coverShape || 'rect');
        syncUIElement('coverHeight', config.coverHeight || 124);

        const fontSelect = document.getElementById('font-family-select');
        if (fontSelect) fontSelect.value = config.fontFamily;

        const textColorPicker = document.getElementById('text-color-picker');
        if (textColorPicker) textColorPicker.value = config.textColor;
        
        const textColorHex = document.getElementById('text-color-hex');
        if (textColorHex) textColorHex.value = config.textColor.toUpperCase();

        const fontSizeInput = document.querySelector('input[oninput*="fontSize"]');
        if (fontSizeInput) {
            fontSizeInput.value = config.fontSize;
            const badge = fontSizeInput.nextElementSibling;
            if (badge) badge.textContent = `${config.fontSize}px`;
        }

        const lineHeightRange = document.querySelector('input[oninput*="lineHeight"]');
        if (lineHeightRange) {
            lineHeightRange.value = config.lineHeight * 10;
            const badge = lineHeightRange.nextElementSibling;
            if (badge) badge.textContent = config.lineHeight.toFixed(1);
        }

        const letterSpacingRange = document.getElementById('letter-spacing-range');
        if (letterSpacingRange) {
            letterSpacingRange.value = config.letterSpacing || 0;
            const badge = letterSpacingRange.nextElementSibling;
            if (badge) badge.textContent = (config.letterSpacing || 0) + 'px';
        }

        const headerAlignSelect = document.getElementById('header-align-select');
        if (headerAlignSelect) headerAlignSelect.value = config.headerAlign || 'center';

        const fontWeightSelect = document.getElementById('font-weight-select');
        if (fontWeightSelect) fontWeightSelect.value = config.fontWeight || 700;

        const textShadowCheck = document.getElementById('text-shadow-check');
        if (textShadowCheck) textShadowCheck.checked = config.textShadow || false;

        const btnColorPicker = document.getElementById('btn-color-picker');
        if (btnColorPicker) btnColorPicker.value = config.btnColor;
        
        const btnColorHex = document.getElementById('btn-color-hex');
        if (btnColorHex) btnColorHex.value = config.btnColor.toUpperCase();

        const btnTextColorPicker = document.getElementById('btn-text-color-picker');
        if (btnTextColorPicker) btnTextColorPicker.value = config.btnTextColor;
        
        const btnTextColorHex = document.getElementById('btn-text-color-hex');
        if (btnTextColorHex) btnTextColorHex.value = (config.btnTextColor || '#FFFFFF').toUpperCase();

        const btnIconBgPicker = document.getElementById('btn-icon-bg-picker');
        if (btnIconBgPicker) btnIconBgPicker.value = config.btnIconBg || '#FFFFFF';
        
        const btnIconBgHex = document.getElementById('btn-icon-bg-hex');
        if (btnIconBgHex) btnIconBgHex.value = (config.btnIconBg || '#FFFFFF').toUpperCase();

        const btnIconColorPicker = document.getElementById('btn-icon-color-picker');
        if (btnIconColorPicker) btnIconColorPicker.value = config.btnIconColor || '#FFFFFF';
        
        const btnIconColorHex = document.getElementById('btn-icon-color-hex');
        if (btnIconColorHex) btnIconColorHex.value = (config.btnIconColor || '#FFFFFF').toUpperCase();

        const btnIconOpacityRange = document.getElementById('btn-icon-opacity-range');
        if (btnIconOpacityRange) {
            btnIconOpacityRange.value = config.btnIconOpacity || 100;
            const badge = btnIconOpacityRange.nextElementSibling;
            if (badge) badge.textContent = (config.btnIconOpacity || 100) + '%';
        }

        const btnIconSizeRange = document.getElementById('btn-icon-size-range');
        if (btnIconSizeRange) {
            btnIconSizeRange.value = config.iconCompactSize || 30;
            const badge = btnIconSizeRange.nextElementSibling;
            if (badge) badge.textContent = `${config.iconCompactSize || 30}px`;
        }

        const btnIconGapRange = document.getElementById('btn-icon-gap-range');
        if (btnIconGapRange) {
            btnIconGapRange.value = config.iconCompactGap ?? 6;
            const badge = btnIconGapRange.nextElementSibling;
            if (badge) badge.textContent = `${config.iconCompactGap ?? 6}px`;
        }

        const btnIconRadiusRange = document.getElementById('btn-icon-radius-range');
        if (btnIconRadiusRange) {
            btnIconRadiusRange.value = config.iconCompactRadius ?? 9;
            const badge = btnIconRadiusRange.nextElementSibling;
            if (badge) badge.textContent = `${config.iconCompactRadius ?? 9}px`;
        }

        const bgRepeatCheckbox = document.getElementById('bg-repeat-check');
        if (bgRepeatCheckbox) bgRepeatCheckbox.checked = config.bgRepeat;

        const layoutStyleSelect = document.getElementById('layout-style-select');
        if (layoutStyleSelect) layoutStyleSelect.value = config.layoutStyle || 'standard';

        const layoutSpacingRange = document.getElementById('layout-spacing-range');
        const layoutSpacingLabel = document.getElementById('layout-spacing-label');
        if (layoutSpacingRange) {
            layoutSpacingRange.value = config.layoutSpacing || 15;
            if (layoutSpacingLabel) {
                layoutSpacingLabel.textContent = `${config.layoutSpacing || 15}px`;
            }
        }
        
        // Sincronizar abas e controles de imagem
        if (config.bgType === 'image') {
            switchTab('bg');
            const bgControls = document.getElementById('bg-controls');
            if (bgControls) bgControls.style.display = 'block';
        } else {
            switchTab('bg');
            const bgControls = document.getElementById('bg-controls');
            if (bgControls) bgControls.style.display = 'none';
        }

    }

    return {
        init,
        switchTab,
        handleBgUpload,
        updatePreview,
        showToast,
        setLinkMode,
        setCoverShape,
        getConfig: () => ({ ...config }),
        saveCustomAppearance: saveSettings,
        resetCustomAppearance: resetSettings
    };
})();

// Expor funções globalmente IMEDIATAMENTE
window.switchTab = CustomAppearanceManager.switchTab;
window.handleBgUpload = CustomAppearanceManager.handleBgUpload;
window.updatePreview = CustomAppearanceManager.updatePreview;
window.saveCustomAppearance = CustomAppearanceManager.saveCustomAppearance;
window.resetCustomAppearance = CustomAppearanceManager.resetCustomAppearance;
window.showToast = CustomAppearanceManager.showToast;
window.setLinkMode = CustomAppearanceManager.setLinkMode;
window.setCoverShape = CustomAppearanceManager.setCoverShape;
window.CustomAppearanceManager = CustomAppearanceManager;
