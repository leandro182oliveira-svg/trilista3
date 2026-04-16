// links.js - Gerenciamento de links
const LinksManager = (function() {
    let links = [];
    const customIconOptions = [
        { key: 'link', label: 'Link', icon: 'fa-link', style: 'fa-solid', color: '#0F766E' },
        { key: 'globe', label: 'Site', icon: 'fa-globe', style: 'fa-solid', color: '#8B5CF6' },
        { key: 'message', label: 'Mensagem', icon: 'fa-message', style: 'fa-solid', color: '#2563EB' },
        { key: 'phone', label: 'Telefone', icon: 'fa-phone', style: 'fa-solid', color: '#3B82F6' },
        { key: 'envelope', label: 'E-mail', icon: 'fa-envelope', style: 'fa-solid', color: '#EF4444' },
        { key: 'location', label: 'Localizacao', icon: 'fa-location-dot', style: 'fa-solid', color: '#10B981' },
        { key: 'telegram', label: 'Telegram', icon: 'fa-telegram', style: 'fa-brands', color: '#229ED9' },
        { key: 'linkedin', label: 'LinkedIn', icon: 'fa-linkedin', style: 'fa-brands', color: '#0A66C2' },
        { key: 'youtube', label: 'YouTube', icon: 'fa-youtube', style: 'fa-brands', color: '#FF0000' },
        { key: 'tiktok', label: 'TikTok', icon: 'fa-tiktok', style: 'fa-brands', color: '#111111' },
        { key: 'x-twitter', label: 'X / Twitter', icon: 'fa-x-twitter', style: 'fa-brands', color: '#111111' },
        { key: 'discord', label: 'Discord', icon: 'fa-discord', style: 'fa-brands', color: '#5865F2' },
        { key: 'github', label: 'GitHub', icon: 'fa-github', style: 'fa-brands', color: '#111111' },
        { key: 'cart', label: 'Loja', icon: 'fa-cart-shopping', style: 'fa-solid', color: '#F59E0B' }
    ];

    function resolveCustomIconOption(choice) {
        const normalized = String(choice || '').trim().toLowerCase();
        const byIndex = Number.parseInt(normalized, 10);
        if (!Number.isNaN(byIndex) && byIndex >= 1 && byIndex <= customIconOptions.length) {
            return customIconOptions[byIndex - 1];
        }
        return customIconOptions.find((option) => option.key === normalized) || customIconOptions[0];
    }

    function openCustomLinkModal(initialData = {}) {
        return new Promise((resolve) => {
            const current = {
                name: initialData.name || 'Saiba mais',
                url: initialData.url || '',
                iconKey: initialData.iconKey || 'link'
            };

            const modal = document.createElement('div');
            modal.className = 'custom-link-modal';

            const optionsHtml = customIconOptions.map((option) => `
                <button type="button" class="custom-link-icon-option ${option.key === current.iconKey ? 'active' : ''}" data-icon-key="${option.key}">
                    <span class="custom-link-icon-preview" style="background:${option.color};">
                        <i class="${option.style} ${option.icon}"></i>
                    </span>
                    <span class="custom-link-icon-label">${option.label}</span>
                </button>
            `).join('');

            modal.innerHTML = `
                <div class="custom-link-modal__dialog">
                    <div class="custom-link-modal__header">
                        <h3>Botão personalizado</h3>
                        <button type="button" class="custom-link-modal__close" aria-label="Fechar">&times;</button>
                    </div>
                    <div class="custom-link-modal__body">
                        <label class="custom-link-modal__field">
                            <span>Nome do botão</span>
                            <input type="text" class="custom-link-input" id="customLinkName" maxlength="40" value="${current.name.replace(/"/g, '&quot;')}">
                        </label>
                        <label class="custom-link-modal__field">
                            <span>URL</span>
                            <input type="text" class="custom-link-input" id="customLinkUrl" placeholder="https://seulink.com.br" value="${current.url.replace(/"/g, '&quot;')}">
                        </label>
                        <div class="custom-link-modal__field">
                            <span>Escolha um ícone</span>
                            <div class="custom-link-icon-grid">${optionsHtml}</div>
                        </div>
                    </div>
                    <div class="custom-link-modal__footer">
                        <button type="button" class="btn-small btn-outline" data-action="cancel">Cancelar</button>
                        <button type="button" class="btn-small btn-primary" data-action="save">Salvar</button>
                    </div>
                </div>
            `;

            const finish = (result) => {
                modal.remove();
                resolve(result);
            };

            const nameInput = modal.querySelector('#customLinkName');
            const urlInput = modal.querySelector('#customLinkUrl');
            const saveButton = modal.querySelector('[data-action="save"]');

            modal.addEventListener('click', (event) => {
                const closeButton = event.target.closest('.custom-link-modal__close, [data-action="cancel"]');
                if (closeButton || event.target === modal) {
                    finish(null);
                    return;
                }

                const iconButton = event.target.closest('.custom-link-icon-option');
                if (iconButton) {
                    current.iconKey = iconButton.dataset.iconKey || 'link';
                    modal.querySelectorAll('.custom-link-icon-option').forEach((button) => {
                        button.classList.toggle('active', button === iconButton);
                    });
                    return;
                }

                if (event.target === saveButton) {
                    const name = nameInput.value.trim();
                    const url = urlInput.value.trim();

                    if (!name) {
                        nameInput.focus();
                        return;
                    }

                    if (!url) {
                        urlInput.focus();
                        return;
                    }

                    finish({
                        name,
                        url,
                        iconKey: current.iconKey
                    });
                }
            });

            modal.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    finish(null);
                }
                if (event.key === 'Enter' && !event.shiftKey) {
                    const name = nameInput.value.trim();
                    const url = urlInput.value.trim();
                    if (!name || !url) return;
                    finish({
                        name,
                        url,
                        iconKey: current.iconKey
                    });
                }
            });

            document.body.appendChild(modal);
            nameInput.focus();
            nameInput.select();
        });
    }

    function carregarLinks() {
        if (window.TrilistaDB) {
            links = TrilistaDB.getLinks() || [];
            atualizarDisplay();
            atualizarPreview();
        }
        return links;
    }

    async function addLink(type) {
        let promptMessage = '';
        let placeholder = '';
        
        switch(type) {
            case 'whatsapp':
                promptMessage = 'Digite o nÃºmero do WhatsApp (com DDD):';
                placeholder = 'Ex: 28999139303';
                break;
            case 'instagram':
                promptMessage = 'Digite o usuÃ¡rio do Instagram:';
                placeholder = 'Ex: @seuusuario';
                break;
            case 'telefone':
                promptMessage = 'Digite o nÃºmero de telefone:';
                placeholder = 'Ex: 2833334444';
                break;
            case 'site':
                promptMessage = 'Digite a URL do site:';
                placeholder = 'Ex: https://seusite.com.br';
                break;
            case 'facebook':
                promptMessage = 'Digite a URL do Facebook:';
                placeholder = 'Ex: https://facebook.com/suapagina';
                break;
            case 'email':
                promptMessage = 'Digite o e-mail:';
                placeholder = 'Ex: contato@exemplo.com';
                break;
            case 'maps':
                promptMessage = 'Digite o endereÃ§o ou link do Maps:';
                placeholder = 'Ex: Rua Exemplo, 123';
                break;
            case 'custom':
                const customData = await openCustomLinkModal();
                if (!customData) return;
                links.push({
                    id: Date.now(),
                    type: type,
                    value: customData.url,
                    displayText: formatDisplayText(type, customData.url),
                    customName: customData.name,
                    customIconKey: resolveCustomIconOption(customData.iconKey).key
                });
                if (window.TrilistaDB) {
                    TrilistaDB.saveLinks(links);
                }
                atualizarDisplay();
                atualizarPreview();
                return;
        }
        
        const valor = prompt(`${promptMessage}\n\n${placeholder}`);
        
        if (valor && valor.trim() !== '') {
            const novoLink = {
                id: Date.now(),
                type: type,
                value: valor.trim(),
                displayText: formatDisplayText(type, valor.trim())
            };
            links.push(novoLink);
            if (window.TrilistaDB) {
                TrilistaDB.saveLinks(links);
            }
            atualizarDisplay();
            atualizarPreview();
        }
    }

    function formatDisplayText(type, value) {
        switch(type) {
            case 'whatsapp':
            case 'telefone':
                const nums = value.replace(/\D/g, '');
                if (nums.length === 11) {
                    return `(${nums.substring(0,2)}) ${nums.substring(2,7)}-${nums.substring(7)}`;
                } else if (nums.length === 10) {
                    return `(${nums.substring(0,2)}) ${nums.substring(2,6)}-${nums.substring(6)}`;
                }
                return value;
            case 'instagram':
                const user = value.replace('@', '');
                return `@${user}`;
            default:
                return value;
        }
    }

    function getLinkInfo(type, link) {
        const linkTypes = {
            whatsapp: { icon: 'fa-whatsapp', style: 'fa-brands', name: 'WhatsApp', color: '#25D366' },
            instagram: { icon: 'fa-instagram', style: 'fa-brands', name: 'Instagram', color: '#E4405F' },
            telefone: { icon: 'fa-phone', style: 'fa-solid', name: 'Telefone', color: '#3B82F6' },
            site: { icon: 'fa-globe', style: 'fa-solid', name: 'Site', color: '#8B5CF6' },
            facebook: { icon: 'fa-facebook', style: 'fa-brands', name: 'Facebook', color: '#1877F2' },
            email: { icon: 'fa-envelope', style: 'fa-solid', name: 'E-mail', color: '#EF4444' },
            maps: { icon: 'fa-map-location-dot', style: 'fa-solid', name: 'Google Maps', color: '#34D399' },
            custom: { icon: 'fa-link', style: 'fa-solid', name: 'Personalizado', color: '#0F766E' }
        };

        if (type === 'custom' && link && link.customIconKey) {
            const customIcon = resolveCustomIconOption(link.customIconKey);
            return { ...linkTypes.custom, ...customIcon };
        }

        return linkTypes[type] || { icon: 'fa-link', style: 'fa-solid', name: 'Link', color: '#667eea' };
    }

    function getLinkLabel(link) {
        const info = getLinkInfo(link && link.type, link);
        return (link && link.customName && link.customName.trim()) || info.name || 'Link';
    }

    function getCustomThemeLinkDefaults() {
        const config = window.CustomAppearanceManager && typeof window.CustomAppearanceManager.getConfig === 'function'
            ? window.CustomAppearanceManager.getConfig()
            : null;

        if (!config) {
            return {
                mode: 'full',
                bg: '#6366F1',
                text: '#FFFFFF',
                bgLabel: 'Cor do Botão',
                textLabel: 'Cor do Texto/Ícone'
            };
        }

        const isCompact = config.linkMode === 'compact';
        return {
            mode: isCompact ? 'compact' : 'full',
            bg: isCompact
                ? (config.btnIconColorBg || config.btnColor || '#6366F1')
                : (config.btnListColor || config.btnColor || '#6366F1'),
            text: config.btnIconColor || config.btnTextColor || '#FFFFFF',
            bgLabel: isCompact ? 'Cor da Área' : 'Cor do Botão',
            textLabel: isCompact ? 'Cor do Ícone' : 'Cor do Texto/Ícone'
        };
    }

    function atualizarDisplay() {
        const linksList = document.getElementById('linksList');
        
        if (!linksList) return;
        
        if (links.length === 0) {
            linksList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-link"></i>
                    <p>Nenhum link adicionado</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        links.forEach((link, index) => {
            const info = getLinkInfo(link.type, link);
            const isCustomTemplate = (window.currentTemplate === 'custom');
            const customDefaults = getCustomThemeLinkDefaults();
            const panelAccent = isCustomTemplate
                ? (link.customColor || customDefaults.bg)
                : (info.color || '#667eea');
            
            const iconHtml = link.customIcon ? 
                `<img src="${link.customIcon}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">` : 
                `<i class="${info.style} ${info.icon}"></i>`;

            const colorPaletteBtn = isCustomTemplate ? `
                <button class="link-action-btn" onclick="LinksManager.toggleColorPicker(${index})" title="Personalizar Cores">
                    <i class="fa-solid fa-palette"></i>
                </button>` : '';

            const iconBg = isCustomTemplate ? (link.customColor || customDefaults.bg) : (info.color || '#667eea');
            const iconColor = isCustomTemplate ? (link.customTextColor || customDefaults.text) : '#ffffff';

            html += `
                <div class="link-item-container">
                    <div class="link-item" style="border-left-color: ${panelAccent};">
                        <div class="link-info">
                            <div class="link-icon" style="background: ${iconBg}; color: ${iconColor}">
                                ${iconHtml}
                            </div>
                    <div class="link-details">
                        <div class="link-title">${getLinkLabel(link)}</div>
                    </div>
                </div>
                        <div class="link-actions">
                            ${colorPaletteBtn}
                            ${index > 0 ? `<button class="link-action-btn" onclick="LinksManager.moveUp(${index})" title="Mover para cima">
                                <i class="fa-solid fa-arrow-up"></i>
                            </button>` : ''}
                            ${index < links.length - 1 ? `<button class="link-action-btn" onclick="LinksManager.moveDown(${index})" title="Mover para baixo">
                                <i class="fa-solid fa-arrow-down"></i>
                            </button>` : ''}
                            <button class="link-action-btn" onclick="LinksManager.editLink(${index})" title="Editar">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="link-action-btn" onclick="LinksManager.deleteLink(${index})" title="Excluir">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${isCustomTemplate ? `
                    <div class="link-color-picker-panel" id="color-picker-${index}" style="display: none;">
                        <div class="color-picker-row">
                            <div class="color-field">
                                <label>${customDefaults.bgLabel}</label>
                                <div class="picker-wrapper">
                                    <input type="color" value="${link.customColor || customDefaults.bg}" oninput="LinksManager.updateLinkColor(${index}, 'customColor', this.value)">
                                    <span>${(link.customColor || customDefaults.bg).toUpperCase()}</span>
                                </div>
                            </div>
                            <div class="color-field">
                                <label>${customDefaults.textLabel}</label>
                                <div class="picker-wrapper">
                                    <input type="color" value="${link.customTextColor || customDefaults.text}" oninput="LinksManager.updateLinkColor(${index}, 'customTextColor', this.value)">
                                    <span>${(link.customTextColor || customDefaults.text).toUpperCase()}</span>
                                </div>
                            </div>
                            <button class="btn-reset-color" onclick="LinksManager.resetLinkColor(${index})">
                                <i class="fa-solid fa-rotate-left"></i> Resetar
                            </button>
                        </div>
                    </div>` : ''}
                </div>
            `;
        });
        
        linksList.innerHTML = html;
    }

    function toggleColorPicker(index) {
        const panel = document.getElementById(`color-picker-${index}`);
        if (panel) {
            const isHidden = panel.style.display === 'none';
            panel.style.display = isHidden ? 'block' : 'none';
        }
    }

    function updateLinkColor(index, prop, value) {
        if (links[index]) {
            links[index][prop] = value;
            
            // Atualizar o texto do hex ao lado do input
            const panel = document.getElementById(`color-picker-${index}`);
            if (panel) {
                const inputs = panel.querySelectorAll('input[type="color"]');
                const spans = panel.querySelectorAll('span');
                if (prop === 'customColor' && spans[0]) spans[0].textContent = value.toUpperCase();
                if (prop === 'customTextColor' && spans[1]) spans[1].textContent = value.toUpperCase();
            }

            if (window.TrilistaDB) {
                TrilistaDB.saveLinks(links);
            }
            
            // Atualizar o Ã­cone na lista (display) sem renderizar tudo de novo para nÃ£o fechar o painel
            const linkItem = document.querySelectorAll('.link-item')[index];
            if (linkItem) {
                const icon = linkItem.querySelector('.link-icon');
                if (icon) {
                    if (prop === 'customColor') icon.style.background = value;
                    if (prop === 'customTextColor') icon.style.color = value;
                }
                if (prop === 'customColor') {
                    linkItem.style.borderLeftColor = value;
                }
            }
            
            atualizarPreview();
        }
    }

    function resetLinkColor(index) {
        if (links[index]) {
            delete links[index].customColor;
            delete links[index].customTextColor;
            if (window.TrilistaDB) {
                TrilistaDB.saveLinks(links);
            }
            atualizarDisplay();
            atualizarPreview();
        }
    }

    function uploadCustomIcon(index) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                links[index].customIcon = event.target.result;
                if (window.TrilistaDB) {
                    TrilistaDB.saveLinks(links);
                }
                atualizarDisplay();
                atualizarPreview();
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    async function editLink(index) {
        const link = links[index];
        const info = getLinkInfo(link.type, link);
        if (link.type === 'custom') {
            const customData = await openCustomLinkModal({
                name: link.customName || info.name,
                url: link.value,
                iconKey: link.customIconKey || 'link'
            });
            if (!customData) return;

            links[index].customName = customData.name;
            links[index].customIconKey = resolveCustomIconOption(customData.iconKey).key;
            links[index].value = customData.url;
            links[index].displayText = formatDisplayText(link.type, customData.url);
            if (window.TrilistaDB) {
                TrilistaDB.saveLinks(links);
            }
            atualizarDisplay();
            atualizarPreview();
            return;
        }
        const novoValor = prompt(`Editar ${info.name}:`, link.value);
        
        if (novoValor !== null && novoValor.trim() !== '') {
            links[index].value = novoValor.trim();
            links[index].displayText = formatDisplayText(link.type, novoValor.trim());
            if (window.TrilistaDB) {
                TrilistaDB.saveLinks(links);
            }
            atualizarDisplay();
            atualizarPreview();
        }
    }

    function deleteLink(index) {
        if (confirm('Tem certeza que deseja excluir este link?')) {
            links.splice(index, 1);
            if (window.TrilistaDB) {
                TrilistaDB.saveLinks(links);
            }
            atualizarDisplay();
            atualizarPreview();
        }
    }

    // copy the phone/whatsapp number to clipboard
    function copyNumber(index) {
        const link = links[index];
        if (!link) return;
        const text = link.value;
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            alert('NÃºmero copiado: ' + text);
        }).catch(() => {
            alert('NÃ£o foi possÃ­vel copiar o nÃºmero');
        });
    }

    // move item one position up
    function moveUp(index) {
        if (index <= 0 || index >= links.length) return;
        [links[index - 1], links[index]] = [links[index], links[index - 1]];
        if (window.TrilistaDB) {
            TrilistaDB.saveLinks(links);
        }
        atualizarDisplay();
        atualizarPreview();
    }

    // move item one position down
    function moveDown(index) {
        if (index < 0 || index >= links.length - 1) return;
        [links[index], links[index + 1]] = [links[index + 1], links[index]];
        if (window.TrilistaDB) {
            TrilistaDB.saveLinks(links);
        }
        atualizarDisplay();
        atualizarPreview();
    }

    function atualizarPreview() {
        const phoneLinksContainer = document.getElementById('phoneLinksPreview');
        const section = document.getElementById('links-preview-section');
        
        if (!phoneLinksContainer) {
            if (section) section.style.display = 'none';
            return;
        }
        
        if (!links || links.length === 0) {
            if (section) section.style.display = 'none';
            phoneLinksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-plus-circle"></i>
                    <p>Adicione conteÃºdo para ver o preview</p>
                </div>
            `;
            return;
        }
        
        if (section) section.style.display = 'block';
        let html = '';
        
        const currentTpl = window.currentTemplate || 'classico';
        const isCustomTemplate = (currentTpl === 'custom');
        const isClassicoTemplate = (currentTpl === 'classico');

        // Detectar o modo uma Ãºnica vez para performance e consistÃªncia
        const previewEl = document.querySelector('.store-content');
        const isCompactMode = previewEl ? previewEl.classList.contains('links-compact') : false;
        const isListaMode = !isCompactMode;

        const customDefaults = isCustomTemplate ? getCustomThemeLinkDefaults() : null;
        const classicoDefaults = isClassicoTemplate
            ? {
                bg: 'var(--theme-button-list-bg, #d1d5db)',
                text: 'var(--theme-button-text, #000000)',
                icon: 'var(--theme-icon-color, #000000)'
            }
            : null;

        links.forEach((link) => {
            if (!link) return;
            
            const info = getLinkInfo(link.type, link);
            const url = getLinkUrl(link);
            
            const iconHtml = link.customIcon ? 
                `<img src="${link.customIcon}" alt="${getLinkLabel(link) || 'Icon'}">` : 
                `<i class="${info.style || 'fa-solid'} ${info.icon || 'fa-link'}"></i>`;
            
            const hasCustomBg = isCustomTemplate && link.customColor;
            const hasCustomText = isCustomTemplate && link.customTextColor;
            
            // Usar as novas variÃ¡veis dinÃ¢micas que se ajustam por tema
            const activeCustomAccent = isCustomTemplate
                ? (isCompactMode
                    ? (customDefaults?.bg || '#6366F1')
                    : (customDefaults?.bg || '#6366F1'))
                : '';

            const itemBg = isCompactMode
                ? 'transparent'
                : isClassicoTemplate
                    ? classicoDefaults.bg
                    : (hasCustomBg ? link.customColor : (customDefaults?.bg || 'var(--theme-button-list-bg, #ffffff)'));
            const itemColor = isCompactMode
                ? 'inherit'
                : isClassicoTemplate
                    ? classicoDefaults.text
                    : (hasCustomText ? link.customTextColor : (customDefaults?.text || 'var(--theme-button-list-text, #1F2937)'));
            
            // LÃ³gica de Ã­cones:
            let iconBgStyle = '';
            let iconColorStyle = '';
            
            if (isCustomTemplate) {
                // SincronizaÃ§Ã£o entre modos: No template custom, SEMPRE usamos as variÃ¡veis do painel 
                if (isListaMode) {
                    // Modo Lista: O fundo do cÃ­rculo pequeno Ã  esquerda
                    // Agora removemos o fundo por completo para deixar apenas a imagem/Ã­cone
                    iconBgStyle = `background-color: transparent !important;`;
                    
                    iconColorStyle = hasCustomText ? 
                        `color: ${link.customTextColor} !important;` : 
                        `color: ${customDefaults?.text || '#6366F1'} !important;`;
                } else {
                    // Modo Ícone (Compact): a cor individual substitui a área do botão, no mesmo tamanho
                    iconBgStyle = hasCustomBg
                        ? `background-color: ${link.customColor} !important;`
                        : `background-color: ${customDefaults?.bg || '#6366F1'} !important; opacity: ${(window.CustomAppearanceManager?.getConfig?.().btnIconOpacity || 100) / 100};`;

                    // A cor individual de texto/ícone continua se sobrepondo à geral
                    iconColorStyle = hasCustomText
                        ? `color: ${link.customTextColor} !important;`
                        : `color: ${customDefaults?.text || '#ffffff'} !important;`;
                }
            } else if (isClassicoTemplate) {
                iconBgStyle = `background-color: transparent !important;`;
                iconColorStyle = `color: ${classicoDefaults.icon} !important;`;
            } else {
                // Nos outros 3 templates, forÃ§amos a cor original da marca (como estava antes)
                iconBgStyle = `background-color: ${info.color || '#667eea'} !important;`;
                iconColorStyle = `color: #ffffff !important;`;
            }

            // Estilos do item: sÃ³ usamos !important se for uma cor customizada individual.
            const itemBgStyle = isCompactMode
                ? 'background-color: transparent !important;'
                : (hasCustomBg ? `background-color: ${itemBg} !important;` : `background-color: ${itemBg};`);
            const itemColorStyle = isCompactMode
                ? ''
                : (hasCustomText ? `color: ${itemColor} !important;` : `color: ${itemColor};`);
            const textContainerStyle = isClassicoTemplate
                ? 'display:flex !important; align-items:center !important; flex:1 1 auto !important; min-width:0 !important;'
                : '';
            const titleStyle = isClassicoTemplate
                ? `color:${classicoDefaults.text} !important; display:block !important; opacity:1 !important; visibility:visible !important; font-size:14px !important; font-weight:500 !important; line-height:1.5 !important;`
                : itemColorStyle;

            html += `
                <a href="${url}" target="_blank" rel="noopener noreferrer" class="phone-link-item" 
                   style="border-left-color: ${isCustomTemplate ? activeCustomAccent : (info.color || '#667eea')}; text-decoration: none; ${itemBgStyle} ${itemColorStyle}">
                    <div class="phone-link-icon" style="${link.customIcon ? 'background: transparent !important;' : iconBgStyle} ${iconColorStyle}">
                        ${iconHtml}
                    </div>
                    <div class="phone-link-text" style="${textContainerStyle}">
                        <div class="phone-link-title" style="${titleStyle}">${getLinkLabel(link)}</div>
                    </div>
                    <div class="phone-link-arrow">
                        <i class="fa-solid fa-chevron-right" style="${itemColorStyle}"></i>
                    </div>
                </a>
            `;
        });
        
        phoneLinksContainer.innerHTML = html;
    }

    function getLinkUrl(link) {
        if (!link || !link.value) return '#';
        const val = String(link.value);
        const num = val.replace(/\D/g, '');
        switch(link.type) {
            case 'whatsapp':
                const message = encodeURIComponent('Olá, te encontrei no Trilista!');
                return 'https://wa.me/55' + num + '?text=' + message;
            case 'telefone':
                return 'tel:+55' + num;
            case 'instagram':
                const user = val.replace('@', '').replace(/\s/g, '').replace(/https?:\/\/(www\.)?instagram\.com\/?/i, '').replace(/\//g, '');
                return 'https://www.instagram.com/' + user + '/';
            case 'facebook':
                return val.startsWith('http') ? val : 'https://' + val;
            case 'site':
                return val.startsWith('http') ? val : 'https://' + val;
            case 'email':
                return 'mailto:' + val;
            case 'maps':
                if (val.startsWith('http')) return val;
                return 'https://www.google.com/maps/search/' + encodeURIComponent(val);
            case 'custom':
                return val.startsWith('http') ? val : 'https://' + val;
            default:
                return '#';
        }
    }

    return {
        carregarLinks,
        addLink,
        editLink,
        deleteLink,
        copyNumber,
        moveUp,
        moveDown,
        uploadCustomIcon,
        toggleColorPicker,
        updateLinkColor,
        resetLinkColor,
        getLinkInfo,
        atualizarDisplay,
        atualizarPreview,
        getLinks: () => links
    };
})();

window.LinksManager = LinksManager;

