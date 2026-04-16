// src/javascript/script.js

// Função de logout global
function fazerLogout() {
    if (window.Auth) {
        if (confirm('Deseja realmente sair?')) {
            Auth.logout();
        }
    } else {
        localStorage.removeItem('trilista_current_user');
        window.location.href = 'index.html#auth';
    }
}

window.fazerLogout = fazerLogout;

// ====================
// FUNÇÕES DE UTILIDADE
// ====================

const passwordIcons = document.querySelectorAll('.password-icon');

passwordIcons.forEach(icon => {
    icon.addEventListener('click', function () {
        const input = this.parentElement.querySelector('.form-control');
        input.type = input.type === 'password' ? 'text' : 'password';
        this.classList.toggle('fa-eye');
    })
});

// ====================
// FUNÇÕES GLOBAIS
// ====================

// Array para armazenar os links
let links = [];

// Função para adicionar links (simplificada)
function addLink(type) {
    let promptMessage = '';
    let placeholder = '';
    
    // Configurar mensagem conforme o tipo
    switch(type) {
        case 'whatsapp':
            promptMessage = 'Digite o número do WhatsApp (com DDD):';
            placeholder = 'Ex: 28999139303';
            break;
        case 'instagram':
            promptMessage = 'Digite o usuário do Instagram:';
            placeholder = 'Ex: @seuusuario';
            break;
        case 'telefone':
            promptMessage = 'Digite o número de telefone:';
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
            promptMessage = 'Digite o endereço ou link do Maps:';
            placeholder = 'Ex: Rua Exemplo, 123';
            break;
        default:
            promptMessage = 'Digite o valor:';
            placeholder = '';
    }
    
    // Usar prompt simples
    const valor = prompt(`${promptMessage}\n\n${placeholder}`);
    
    if (valor && valor.trim() !== '') {
        // Criar objeto do link
        const novoLink = {
            id: Date.now(), // ID único
            type: type,
            value: valor.trim(),
            displayText: formatDisplayText(type, valor.trim())
        };
        
        // Adicionar ao array
        links.push(novoLink);
        
        // Salvar no banco de dados do usuário
        if (window.TrilistaDB) {
            TrilistaDB.saveLinks(links);
        }
        
        // Atualizar a interface
        updateLinksDisplay();
        updatePhonePreview();
        
        console.log('Link adicionado:', novoLink);
    }
}

// Formatar texto para exibição
function formatDisplayText(type, value) {
    switch(type) {
        case 'whatsapp':
        case 'telefone':
            // Formatar número de telefone
            const nums = value.replace(/\D/g, '');
            if (nums.length === 11) {
                return `(${nums.substring(0,2)}) ${nums.substring(2,7)}-${nums.substring(7)}`;
            } else if (nums.length === 10) {
                return `(${nums.substring(0,2)}) ${nums.substring(2,6)}-${nums.substring(6)}`;
            }
            return value;
        case 'instagram':
            // Remover @ se o usuário digitou
            const user = value.replace('@', '');
            return `@${user}`;
        default:
            return value;
    }
}

// Obter ícone e nome do tipo de link
function getLinkInfo(type) {
    const linkTypes = {
        whatsapp: { icon: 'fa-whatsapp', name: 'WhatsApp', color: '#25D366' },
        instagram: { icon: 'fa-instagram', name: 'Instagram', color: '#E4405F' },
        telefone: { icon: 'fa-phone', name: 'Telefone', color: '#3B82F6' },
        site: { icon: 'fa-globe', name: 'Site', color: '#8B5CF6' },
        facebook: { icon: 'fa-facebook', name: 'Facebook', color: '#1877F2' },
        email: { icon: 'fa-envelope', name: 'E-mail', color: '#EF4444' },
        maps: { icon: 'fa-map-location-dot', name: 'Google Maps', color: '#34D399' }
    };
    
    return linkTypes[type] || { icon: 'fa-link', name: 'Link', color: '#667eea' };
}

// Atualizar lista de links na interface
function updateLinksDisplay() {
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
        const info = getLinkInfo(link.type);
        
        html += `
            <div class="link-item">
                <div class="link-info">
                    <div class="link-icon" style="background: ${info.color}">
                        <i class="fa-brands ${info.icon}"></i>
                    </div>
                    <div class="link-details">
                        <div class="link-title">${info.name}</div>
                        <div class="link-value">${link.displayText}</div>
                    </div>
                </div>
                <div class="link-actions">
                    <button class="link-action-btn" onclick="editLink(${index})" title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="link-action-btn" onclick="deleteLink(${index})" title="Excluir">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    linksList.innerHTML = html;
}

// Editar link
function editLink(index) {
    const link = links[index];
    const info = getLinkInfo(link.type);
    
    const novoValor = prompt(`Editar ${info.name}:`, link.value);
    
    if (novoValor !== null && novoValor.trim() !== '') {
        links[index].value = novoValor.trim();
        links[index].displayText = formatDisplayText(link.type, novoValor.trim());
        
        if (window.TrilistaDB) {
            TrilistaDB.saveLinks(links);
        }
        
        updateLinksDisplay();
        updatePhonePreview();
    }
}

// Excluir link
function deleteLink(index) {
    if (confirm('Tem certeza que deseja excluir este link?')) {
        links.splice(index, 1);
        
        if (window.TrilistaDB) {
            TrilistaDB.saveLinks(links);
        }
        
        updateLinksDisplay();
        updatePhonePreview();
    }
}

// Atualizar preview no celular
function updatePhonePreview() {
    // Encontrar ou criar a seção de links no celular
    let phoneLinksContainer = document.getElementById('phoneLinksPreview');
    
    if (!phoneLinksContainer) return;
    
    // Limpar container
    phoneLinksContainer.innerHTML = '';
    
    if (links.length === 0) {
        phoneLinksContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-plus-circle"></i>
                <p>Adicione links para ver aqui</p>
            </div>
        `;
        return;
    }
    
    // Adicionar cada link como um "botão" no celular
    links.forEach((link, index) => {
        const info = getLinkInfo(link.type);
        const isCustomTemplate = (window.currentTemplate === 'custom');
        
        const linkElement = document.createElement('div');
        linkElement.className = 'phone-link-item';
        linkElement.style.borderLeftColor = info.color;
        
        // Aplicar cores individuais apenas no template custom
        const hasCustomBg = isCustomTemplate && link.customColor;
        const hasCustomText = isCustomTemplate && link.customTextColor;
        
        const itemBg = hasCustomBg ? link.customColor : 'var(--theme-button-bg, #ffffff)';
        const itemColor = hasCustomText ? link.customTextColor : 'var(--theme-button-text, #1F2937)';
        
        // Estilos do ícone
        let iconBgStyle = '';
        let iconColorStyle = '';
        
        // Detectar o modo
        const previewEl = document.querySelector('.store-content');
        const isCompactMode = previewEl ? previewEl.classList.contains('links-compact') : false;
        const isListaMode = !isCompactMode;

        if (isCustomTemplate) {
            // No template custom, se tiver cor individual usa ela. 
            if (hasCustomBg) iconBgStyle = `background-color: ${link.customColor} !important;`;
            
            // Sincronização entre modos: No template custom, SEMPRE usamos as variáveis do painel 
            // e ignoramos as cores padrão da marca.
            if (isListaMode) {
                iconBgStyle = hasCustomBg ? 
                    `background-color: ${link.customColor} !important;` : 
                    `background-color: var(--theme-icon-bg, color-mix(in srgb, var(--theme-button-text, #ffffff) 15%, transparent)) !important;`;
                
                iconColorStyle = hasCustomText ? 
                    `color: ${link.customTextColor} !important;` : 
                    `color: var(--theme-icon-color, var(--theme-button-text, #ffffff)) !important;`;
            } else {
                // Modo Ícone (Compact): A cor ao redor do desenho segue a "Cor Fundo Botão"
                iconBgStyle = hasCustomBg ? 
                    `background-color: ${link.customColor} !important;` : 
                    `background-color: var(--theme-button-bg) !important;`;
                
                iconColorStyle = hasCustomText ? 
                    `color: ${link.customTextColor} !important;` : 
                    `color: var(--theme-icon-color, var(--theme-button-text, #ffffff)) !important;`;
            }
        } else {
            // Nos outros 3 templates, forçamos a cor original da marca (como estava antes)
            iconBgStyle = `background-color: ${info.color || '#667eea'} !important;`;
            iconColorStyle = `color: #ffffff !important;`;
        }
        
        // Estilos do item: só usamos !important se for uma cor customizada individual.
        if (hasCustomBg) {
            linkElement.style.setProperty('background-color', itemBg, 'important');
        } else {
            linkElement.style.setProperty('background-color', itemBg);
        }

        if (hasCustomText) {
            linkElement.style.setProperty('color', itemColor, 'important');
        } else {
            linkElement.style.setProperty('color', itemColor);
        }
        
        const finalItemColorStyle = hasCustomText ? `color: ${itemColor} !important;` : `color: ${itemColor};`;
        
        // Tornar clicável
        linkElement.onclick = function() {
            // Simular ação do link
            let actionUrl = '';
            let actionText = '';
            
            switch(link.type) {
                case 'whatsapp':
                    const whatsappNum = link.value.replace(/\D/g, '');
                    const whatsappMessage = encodeURIComponent('Olá, te encontrei no Trilista!');
                    actionUrl = `https://wa.me/55${whatsappNum}?text=${whatsappMessage}`;
                    actionText = `Abrir WhatsApp para ${link.displayText}`;
                    break;
                case 'telefone':
                    const telNum = link.value.replace(/\D/g, '');
                    actionUrl = `tel:${telNum}`;
                    actionText = `Ligar para ${link.displayText}`;
                    break;
                case 'email':
                    actionUrl = `mailto:${link.value}`;
                    actionText = `Enviar e-mail para ${link.displayText}`;
                    break;
                case 'instagram':
                case 'facebook':
                case 'site':
                case 'maps':
                    actionUrl = link.value.startsWith('http') ? link.value : `https://${link.value}`;
                    actionText = `Abrir ${info.name}`;
                    break;
            }
            
            if (actionUrl) {
                window.open(actionUrl, '_blank');
            } else {
                alert(`${actionText}\n\nURL: ${actionUrl}`);
            }
        };
        
        const iconHtml = link.customIcon ? 
            `<img src="${link.customIcon}" alt="${info.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">` : 
            `<i class="${info.style} ${info.icon}"></i>`;
            
        linkElement.innerHTML = `
            <div class="phone-link-icon" style="${link.customIcon ? 'background: transparent !important;' : iconBgStyle} ${iconColorStyle}">
                ${iconHtml}
            </div>
            <div class="phone-link-text">
                <div class="phone-link-title" style="${finalItemColorStyle}">${info.name}</div>
            </div>
            <div class="phone-link-arrow">
                <i class="fa-solid fa-chevron-right" style="${finalItemColorStyle}"></i>
            </div>
        `;
        
        phoneLinksContainer.appendChild(linkElement);
    });
}

// Função para alternar seções (colapsar/expandir)
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId + '-section');
    const content = document.getElementById(sectionId + '-content');
    const arrow = section?.querySelector('.toggle-arrow');
    
    // Alternar classes
    if (content) {
        content.classList.toggle('open');
        if (arrow) arrow.classList.toggle('open');
    }
}

// ====================
// FUNÇÕES PARA GALERIA
// ====================

let galleryImages = []; // Array de imagens salvas
let selectedImages = []; // Array de imagens selecionadas para upload
let currentGallerySlide = 0;

// Compressão de imagens
function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Redimensionar se necessário
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Converter para WebP (melhor compressão)
                canvas.toBlob(
                    (blob) => {
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + '.webp', {
                            type: 'image/webp',
                            lastModified: Date.now()
                        });
                        
                        resolve({
                            file: compressedFile,
                            originalSize: file.size,
                            compressedSize: blob.size,
                            reduction: Math.round((1 - blob.size / file.size) * 100)
                        });
                    },
                    'image/webp',
                    quality
                );
            };
            
            img.onerror = reject;
        };
        
        reader.onerror = reject;
    });
}

// Lidar com upload de imagens
async function handleGalleryUpload(event) {
    const files = Array.from(event.target.files);
    
    // Limitar a 6 imagens
    if (files.length > 6) {
        alert('Máximo de 6 imagens por vez. As primeiras 6 serão selecionadas.');
        files.splice(6);
    }
    
    // Limpar preview anterior
    selectedImages = [];
    clearPreview();
    
    // Processar cada imagem
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Verificar tamanho máximo (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(`A imagem "${file.name}" excede o limite de 5MB. Será pulada.`);
            continue;
        }
        
        // Criar preview imediata
        const reader = new FileReader();
        reader.onload = function(e) {
            selectedImages.push({
                id: Date.now() + i,
                original: file,
                preview: e.target.result,
                name: file.name,
                size: file.size,
                compressed: null
            });
            
            updatePreview();
            updateSaveButton();
        };
        reader.readAsDataURL(file);
    }
    
    // Limpar input
    event.target.value = '';
}

// Atualizar pré-visualização
function updatePreview() {
    const previewGrid = document.getElementById('previewGrid');
    const previewCount = document.querySelector('.preview-count');
    
    if (!previewGrid) return;
    
    if (selectedImages.length === 0) {
        previewGrid.innerHTML = `
            <div class="empty-preview">
                <i class="fa-solid fa-images"></i>
                <p>Nenhuma foto selecionada</p>
            </div>
        `;
        if (previewCount) previewCount.textContent = '0 fotos selecionadas';
        return;
    }
    
    let html = '';
    selectedImages.forEach((image, index) => {
        html += `
            <div class="preview-item">
                <img src="${image.preview}" alt="Preview ${index + 1}">
                <button class="remove-btn" onclick="removeSelectedImage(${index})">
                    <i class="fa-solid fa-times"></i>
                </button>
                ${image.compressed ? `
                    <div class="compression-badge">
                        <i class="fa-solid fa-compress"></i>
                        <span>${image.compressed.reduction}% menor</span>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    previewGrid.innerHTML = html;
    if (previewCount) previewCount.textContent = `${selectedImages.length} foto${selectedImages.length !== 1 ? 's' : ''} selecionada${selectedImages.length !== 1 ? 's' : ''}`;
}

// Remover imagem selecionada
function removeSelectedImage(index) {
    selectedImages.splice(index, 1);
    updatePreview();
    updateSaveButton();
}

// Atualizar botão de salvar
function updateSaveButton() {
    const saveBtn = document.getElementById('saveGalleryBtn');
    if (saveBtn) {
        saveBtn.disabled = selectedImages.length === 0;
    }
}

// Limpar preview
function clearPreview() {
    selectedImages = [];
    updatePreview();
    updateSaveButton();
}

// Salvar imagens na galeria
async function saveGallery() {
    if (selectedImages.length === 0) return;
    
    const saveBtn = document.getElementById('saveGalleryBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Comprimindo...';
    }
    
    // Adicionar loader ao preview
    const previewGrid = document.getElementById('previewGrid');
    if (previewGrid) {
        previewGrid.innerHTML = `
            <div class="compression-loader" style="grid-column: 1 / -1;">
                <div class="loader-spinner"></div>
                <p>Comprimindo imagens...</p>
                <small>Aguarde, isso pode levar alguns segundos</small>
            </div>
        `;
    }
    
    // Processar cada imagem
    for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        
        try {
            // Comprimir imagem
            const compressed = await compressImage(image.original);
            image.compressed = compressed;
            
            // Converter para base64 para armazenamento
            const reader = new FileReader();
            reader.readAsDataURL(compressed.file);
            
            reader.onload = function(e) {
                // Adicionar à galeria
                galleryImages.unshift({
                    id: image.id,
                    name: image.name,
                    data: e.target.result,
                    size: compressed.compressedSize,
                    originalSize: compressed.originalSize,
                    reduction: compressed.reduction,
                    uploaded: new Date().toLocaleDateString('pt-BR'),
                    createdAt: Date.now()
                });
                
                // Salvar no banco de dados do usuário
                if (window.TrilistaDB) {
                    TrilistaDB.saveGallery(galleryImages);
                }
                
                // Atualizar contagem
                updateGalleryCount();
                
                // Atualizar lista
                updateGalleryList();
                
                // Atualizar carrossel no celular
                updatePhoneGallery();
            };
        } catch (error) {
            console.error('Erro ao comprimir imagem:', error);
            // Usar imagem original se falhar
            const reader = new FileReader();
            reader.readAsDataURL(image.original);
            
            reader.onload = function(e) {
                galleryImages.unshift({
                    id: image.id,
                    name: image.name,
                    data: e.target.result,
                    size: image.size,
                    originalSize: image.size,
                    reduction: 0,
                    uploaded: new Date().toLocaleDateString('pt-BR'),
                    createdAt: Date.now()
                });
                
                if (window.TrilistaDB) {
                    TrilistaDB.saveGallery(galleryImages);
                }
                
                updateGalleryCount();
                updateGalleryList();
                updatePhoneGallery();
            };
        }
    }
    
    // Restaurar botão
    setTimeout(() => {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-save"></i> Salvar na Galeria';
        }
        
        // Limpar preview
        clearPreview();
        
        // Mostrar mensagem
        alert(`${selectedImages.length} foto${selectedImages.length !== 1 ? 's' : ''} salva${selectedImages.length !== 1 ? 's' : ''} na galeria!`);
    }, 1000);
}

// Atualizar contagem de fotos
function updateGalleryCount() {
    const countElement = document.getElementById('photos-count');
    const listCountElement = document.getElementById('galleryListCount');
    
    if (countElement) {
        countElement.textContent = `${galleryImages.length} foto${galleryImages.length !== 1 ? 's' : ''}`;
    }
    if (listCountElement) {
        listCountElement.textContent = `${galleryImages.length} foto${galleryImages.length !== 1 ? 's' : ''}`;
    }
}

// Atualizar lista de fotos salvas
function updateGalleryList() {
    const galleryItems = document.getElementById('galleryItems');
    
    if (!galleryItems) return;
    
    if (galleryImages.length === 0) {
        galleryItems.innerHTML = `
            <div class="empty-gallery">
                <i class="fa-solid fa-camera"></i>
                <p>A galeria está vazia</p>
                <small>Adicione fotos para ver aqui</small>
            </div>
        `;
        return;
    }
    
    let html = '';
    galleryImages.forEach((image, index) => {
        const sizeKB = Math.round(image.size / 1024);
        
        html += `
            <div class="gallery-item">
                <img src="${image.data}" alt="${image.name}">
                <div class="item-actions">
                    <button class="delete-btn" onclick="deleteGalleryImage(${index})" title="Excluir">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    <button class="move-btn" onclick="moveGalleryImage(${index}, 'up')" title="Mover para cima">
                        <i class="fa-solid fa-arrow-up"></i>
                    </button>
                    <button class="move-btn" onclick="moveGalleryImage(${index}, 'down')" title="Mover para baixo">
                        <i class="fa-solid fa-arrow-down"></i>
                    </button>
                </div>
                <div class="compression-badge">
                    <i class="fa-solid fa-database"></i>
                    <span>${sizeKB}KB</span>
                </div>
            </div>
        `;
    });
    
    galleryItems.innerHTML = html;
}

// Excluir imagem da galeria
function deleteGalleryImage(index) {
    if (confirm('Tem certeza que deseja excluir esta imagem?')) {
        galleryImages.splice(index, 1);
        
        if (window.TrilistaDB) {
            TrilistaDB.saveGallery(galleryImages);
        }
        
        updateGalleryCount();
        updateGalleryList();
        updatePhoneGallery();
    }
}

// Mover imagem na galeria
function moveGalleryImage(index, direction) {
    if (direction === 'up' && index > 0) {
        // Mover para cima
        [galleryImages[index], galleryImages[index - 1]] = [galleryImages[index - 1], galleryImages[index]];
    } else if (direction === 'down' && index < galleryImages.length - 1) {
        // Mover para baixo
        [galleryImages[index], galleryImages[index + 1]] = [galleryImages[index + 1], galleryImages[index]];
    } else {
        return;
    }
    
    if (window.TrilistaDB) {
        TrilistaDB.saveGallery(galleryImages);
    }
    
    updateGalleryList();
    updatePhoneGallery();
}

// Atualizar galeria no celular
function updatePhoneGallery() {
    const galleryTrack = document.getElementById('galleryTrack');
    const galleryIndicators = document.getElementById('galleryIndicators');
    
    if (!galleryTrack) return;
    
    if (galleryImages.length === 0) {
        galleryTrack.innerHTML = `
            <div class="empty-gallery-state">
                <i class="fa-solid fa-images"></i>
                <p>Nenhuma foto na galeria</p>
            </div>
        `;
        if (galleryIndicators) galleryIndicators.innerHTML = '';
        return;
    }
    
    // Criar slides
    let slidesHTML = '';
    galleryImages.forEach((image, index) => {
        slidesHTML += `
            <div class="carousel-slide" data-index="${index}">
                <img src="${image.data}" alt="Foto ${index + 1}">
            </div>
        `;
    });
    galleryTrack.innerHTML = slidesHTML;
    
    if (galleryIndicators) {
        // Criar indicadores
        let indicatorsHTML = '';
        galleryImages.forEach((_, index) => {
            indicatorsHTML += `
                <button class="carousel-indicator ${index === 0 ? 'active' : ''}" 
                        onclick="goToGallerySlide(${index})"></button>
            `;
        });
        galleryIndicators.innerHTML = indicatorsHTML;
    }
    
    // Resetar slide atual
    currentGallerySlide = 0;
    updateGalleryCarousel();
}

// Navegação do carrossel
function nextGallerySlide() {
    if (galleryImages.length <= 1) return;
    currentGallerySlide = (currentGallerySlide + 1) % galleryImages.length;
    updateGalleryCarousel();
}

function prevGallerySlide() {
    if (galleryImages.length <= 1) return;
    currentGallerySlide = (currentGallerySlide - 1 + galleryImages.length) % galleryImages.length;
    updateGalleryCarousel();
}

function goToGallerySlide(index) {
    if (index >= 0 && index < galleryImages.length) {
        currentGallerySlide = index;
        updateGalleryCarousel();
    }
}

function updateGalleryCarousel() {
    const galleryTrack = document.getElementById('galleryTrack');
    const indicators = document.querySelectorAll('.carousel-indicator');
    
    if (!galleryTrack) return;
    
    // Mover track
    galleryTrack.style.transform = `translateX(-${currentGallerySlide * 100}%)`;
    
    // Atualizar indicadores
    indicators.forEach((indicator, index) => {
        if (index === currentGallerySlide) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

// Carregar galeria salva
function loadGallery() {
    if (window.TrilistaDB) {
        const savedGallery = TrilistaDB.getGallery();
        if (savedGallery && savedGallery.length > 0) {
            galleryImages = savedGallery;
            updateGalleryCount();
            updateGalleryList();
            updatePhoneGallery();
        }
    }
}

// Salvar galeria
function saveGalleryToStorage() {
    if (window.TrilistaDB) {
        TrilistaDB.saveGallery(galleryImages);
    }
}

// ====================
// FUNÇÕES DE TEMA
// ====================

let currentTheme = 'default';
let customColors = {
    primary: '#667eea',
    secondary: '#764ba2',
    text: '#2d3748'
};
let currentFont = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

// Temas pré-definidos
const themes = {
    default: {
        primary: '#667eea',
        secondary: '#764ba2',
        text: '#2d3748'
    },
    green: {
        primary: '#10B981',
        secondary: '#059669',
        text: '#064E3B'
    },
    red: {
        primary: '#EF4444',
        secondary: '#DC2626',
        text: '#7F1D1D'
    },
    orange: {
        primary: '#F59E0B',
        secondary: '#D97706',
        text: '#78350F'
    },
    teal: {
        primary: '#06B6D4',
        secondary: '#0891B2',
        text: '#134E4A'
    },
    pink: {
        primary: '#EC4899',
        secondary: '#DB2777',
        text: '#831843'
    }
};

// Aplicar tema
function applyTheme(themeName) {
    currentTheme = themeName;
    
    // Atualizar check icons
    document.querySelectorAll('.theme-item').forEach(item => {
        item.classList.remove('active');
    });
    const themeItem = document.querySelector(`.theme-item[data-theme="${themeName}"]`);
    if (themeItem) themeItem.classList.add('active');
    
    // Aplicar cores do tema
    if (themeName !== 'custom') {
        const theme = themes[themeName];
        customColors = { ...theme };
        
        // Atualizar color pickers
        const primaryColor = document.getElementById('primaryColor');
        const secondaryColor = document.getElementById('secondaryColor');
        const textColor = document.getElementById('textColor');
        const primaryColorValue = document.getElementById('primaryColorValue');
        const secondaryColorValue = document.getElementById('secondaryColorValue');
        const textColorValue = document.getElementById('textColorValue');
        
        if (primaryColor) primaryColor.value = theme.primary;
        if (secondaryColor) secondaryColor.value = theme.secondary;
        if (textColor) textColor.value = theme.text;
        
        if (primaryColorValue) primaryColorValue.textContent = theme.primary.toUpperCase();
        if (secondaryColorValue) secondaryColorValue.textContent = theme.secondary.toUpperCase();
        if (textColorValue) textColorValue.textContent = theme.text.toUpperCase();
        
        updateCustomTheme();
    }
    
    updateThemePreview();
    applyThemeToPhone();
}

// Atualizar tema personalizado
function updateCustomTheme() {
    currentTheme = 'custom';
    
    // Obter valores dos color pickers
    const primaryColor = document.getElementById('primaryColor');
    const secondaryColor = document.getElementById('secondaryColor');
    const textColor = document.getElementById('textColor');
    const primaryColorValue = document.getElementById('primaryColorValue');
    const secondaryColorValue = document.getElementById('secondaryColorValue');
    const textColorValue = document.getElementById('textColorValue');
    
    if (primaryColor) customColors.primary = primaryColor.value;
    if (secondaryColor) customColors.secondary = secondaryColor.value;
    if (textColor) customColors.text = textColor.value;
    
    if (primaryColorValue) primaryColorValue.textContent = customColors.primary.toUpperCase();
    if (secondaryColorValue) secondaryColorValue.textContent = customColors.secondary.toUpperCase();
    if (textColorValue) textColorValue.textContent = customColors.text.toUpperCase();
    
    // Remover tema ativo dos temas pré-definidos
    document.querySelectorAll('.theme-item').forEach(item => {
        item.classList.remove('active');
    });
    
    updateThemePreview();
    applyThemeToPhone();
}

// Atualizar preview do tema
function updateThemePreview() {
    const previewHeader = document.querySelector('.preview-header');
    const previewLinkIcon = document.querySelector('.preview-link-icon');
    const previewTitle = document.querySelector('.preview-title');
    
    if (previewHeader) {
        previewHeader.style.background = `linear-gradient(135deg, ${customColors.primary} 0%, ${customColors.secondary} 100%)`;
    }
    
    if (previewLinkIcon) {
        previewLinkIcon.style.background = customColors.primary;
    }
    
    if (previewTitle) {
        previewTitle.style.color = customColors.text;
    }
}

// Aplicar tema ao celular
function applyThemeToPhone() {
    const phoneStatusBar = document.querySelector('.phone-status-bar');
    const storeAvatar = document.querySelector('.store-avatar');
    const sectionItems = document.querySelectorAll('.section-item');
    const storeName = document.querySelector('.store-name');
    
    if (phoneStatusBar) {
        phoneStatusBar.style.background = `linear-gradient(135deg, ${customColors.primary} 0%, ${customColors.secondary} 100%)`;
    }
    
    if (storeAvatar) {
        storeAvatar.style.background = `linear-gradient(135deg, ${customColors.primary} 0%, ${customColors.secondary} 100%)`;
    }
    
    if (sectionItems) {
        sectionItems.forEach(item => {
            item.style.borderLeftColor = customColors.primary;
            const icon = item.querySelector('i');
            if (icon) {
                icon.style.color = customColors.primary;
            }
        });
    }
    
    if (storeName) {
        storeName.style.color = customColors.text;
    }
    
    // Aplicar aos botões
    const buttons = document.querySelectorAll('.btn-primary');
    buttons.forEach(btn => {
        btn.style.background = customColors.primary;
        btn.style.borderColor = customColors.primary;
    });
    
    // Aplicar aos ícones das seções
    const sectionIcons = document.querySelectorAll('.section-icon');
    sectionIcons.forEach(icon => {
        icon.style.background = `linear-gradient(135deg, ${customColors.primary} 0%, ${customColors.secondary} 100%)`;
    });
}

// Mudar fonte
function changeFont(element) {
    const font = element.getAttribute('data-font');
    currentFont = font;
    
    // Atualizar seleção
    document.querySelectorAll('.font-option').forEach(option => {
        option.classList.remove('active');
    });
    element.classList.add('active');
    
    // Aplicar fonte ao preview
    document.querySelectorAll('.font-preview').forEach(preview => {
        preview.style.fontFamily = font;
    });
    
    // Aplicar fonte ao celular
    applyFontToPhone();
}

// Aplicar fonte ao celular
function applyFontToPhone() {
    const phoneContent = document.querySelector('.store-content');
    if (phoneContent) {
        phoneContent.style.fontFamily = currentFont;
    }
    
    // Aplicar fonte ao título da loja
    const storeName = document.querySelector('.store-name');
    if (storeName) {
        storeName.style.fontFamily = currentFont;
    }
}

// Salvar tema
function saveTheme() {
    const themeData = {
        name: currentTheme,
        colors: customColors,
        font: currentFont
    };
    
    if (window.TrilistaDB) {
        TrilistaDB.saveThemeData(themeData);
        alert('Tema salvo com sucesso!');
    }
}

// Aplicar tema a todo o site
function applyThemeToAll() {
    // Aplicar cores principais
    document.documentElement.style.setProperty('--primary-color', customColors.primary);
    document.documentElement.style.setProperty('--secondary-color', customColors.secondary);
    document.documentElement.style.setProperty('--text-color', customColors.text);
    
    // Aplicar fonte
    document.body.style.fontFamily = currentFont;
}

// Resetar tema
function resetTheme() {
    if (confirm('Resetar para tema padrão?')) {
        applyTheme('default');
        document.querySelectorAll('.font-option').forEach(option => {
            option.classList.remove('active');
        });
        const firstFont = document.querySelector('.font-option');
        if (firstFont) firstFont.classList.add('active');
        currentFont = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        applyFontToPhone();
    }
}

// Carregar tema salvo
function loadSavedTheme() {
    if (window.TrilistaDB) {
        const themeData = TrilistaDB.getTheme();
        if (themeData) {
            // Aplicar tema
            if (themeData.name !== 'custom') {
                applyTheme(themeData.name);
            } else {
                customColors = themeData.colors;
                const primaryColor = document.getElementById('primaryColor');
                const secondaryColor = document.getElementById('secondaryColor');
                const textColor = document.getElementById('textColor');
                
                if (primaryColor) primaryColor.value = customColors.primary;
                if (secondaryColor) secondaryColor.value = customColors.secondary;
                if (textColor) textColor.value = customColors.text;
                
                updateCustomTheme();
            }
            
            // Aplicar fonte
            if (themeData.font) {
                currentFont = themeData.font;
                document.querySelectorAll('.font-option').forEach(option => {
                    if (option.getAttribute('data-font') === themeData.font) {
                        option.classList.add('active');
                    } else {
                        option.classList.remove('active');
                    }
                });
                applyFontToPhone();
            }
        }
    }
}

// ====================
// FUNÇÕES DE PERFIL
// ====================

function saveProfileData() {
    const storeName = document.getElementById('store_name')?.value;
    const bio = document.getElementById('store_bio')?.value;
    
    if (window.TrilistaDB) {
        TrilistaDB.saveProfile({ storeName: storeName, bio: bio });
        alert('Perfil salvo com sucesso!');
    }
}

// ====================
// FUNÇÕES DE STORAGE
// ====================

function updateStorageDisplay() {
    if (window.TrilistaDB) {
        const usage = TrilistaDB.getStorageUsage();
        const el = document.getElementById('storageUsage');
        if (el) {
            el.textContent = usage.kb + ' KB usados (' + usage.percentage + '%)';
        }
    }
}

function saveEntireStore() {
    const storeName = document.getElementById('store_name')?.value;
    const bio = document.getElementById('store_bio')?.value;

    if (!storeName || storeName.trim() === '') {
        alert('Por favor, preencha o nome da loja.');
        toggleSection('profile');
        document.getElementById('store_name')?.focus();
        return;
    }

    if (window.TrilistaDB) {
        TrilistaDB.saveProfile({ storeName: storeName.trim(), bio: bio?.trim() || '' });
        TrilistaDB.saveLinks(links);
        TrilistaDB.saveGallery(galleryImages);

        const themeData = {
            name: currentTheme,
            colors: customColors,
            font: currentFont
        };
        TrilistaDB.saveThemeData(themeData);

        updateStorageDisplay();
        alert('Loja salva com sucesso!');
    }
}

// ====================
// FUNÇÕES DE LOGOUT
// ====================

function fazerLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        if (window.Auth) {
            Auth.logout();
        } else {
            localStorage.removeItem('trilista_current_user');
            window.location.href = 'index.html';
        }
    }
}

// ====================
// INICIALIZAÇÃO
// ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página carregada - Script inicializado!');
    
    // Carregar dados do banco de dados
    if (window.TrilistaDB) {
        // Carregar perfil
        const profile = TrilistaDB.getProfile();
        if (profile) {
            if (profile.storeName) {
                const storeNameInput = document.getElementById('store_name');
                const previewStoreName = document.getElementById('previewStoreName');
                if (storeNameInput) storeNameInput.value = profile.storeName;
                if (previewStoreName) previewStoreName.textContent = profile.storeName;
            }
            if (profile.bio) {
                const storeBioInput = document.getElementById('store_bio');
                const previewStoreBio = document.getElementById('previewStoreBio');
                const charCount = document.getElementById('charCount');
                if (storeBioInput) storeBioInput.value = profile.bio;
                if (previewStoreBio) previewStoreBio.textContent = profile.bio;
                if (charCount) charCount.textContent = profile.bio.length;
            }
            if (profile.profilePhoto) {
                const storeAvatar = document.querySelector('.store-avatar');
                if (storeAvatar) {
                    storeAvatar.innerHTML = '<img src="' + profile.profilePhoto + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
                }
            }
            if (profile.coverPhoto) {
                const cover = document.getElementById('storeCover');
                if (cover) {
                    cover.style.backgroundImage = 'url(' + profile.coverPhoto + ')';
                    cover.classList.add('has-cover');
                }
            }
        }
        
        // Carregar links
        const savedLinks = TrilistaDB.getLinks();
        if (savedLinks && savedLinks.length > 0) {
            links = savedLinks;
            updateLinksDisplay();
            updatePhonePreview();
        }
        
        // Carregar galeria
        loadGallery();
        
        // Carregar tema
        loadSavedTheme();
        
        // Atualizar uso de storage
        updateStorageDisplay();
    }
    
    // Event listeners para inputs
    const storeNameInput = document.getElementById('store_name');
    const storeBioInput = document.getElementById('store_bio');
    const previewStoreName = document.getElementById('previewStoreName');
    const previewStoreBio = document.getElementById('previewStoreBio');
    const charCount = document.getElementById('charCount');

    if (storeNameInput && previewStoreName) {
        storeNameInput.addEventListener('input', function() {
            previewStoreName.textContent = this.value || 'Minha Loja Incrível';
        });
    }

    if (storeBioInput && previewStoreBio) {
        storeBioInput.addEventListener('input', function() {
            previewStoreBio.textContent = this.value || 'Bem-vindo à minha loja! Aqui você encontra os melhores produtos.';
            if (charCount) charCount.textContent = this.value.length;
            
            if (charCount) {
                if (this.value.length > 140) {
                    charCount.classList.add('warning');
                } else {
                    charCount.classList.remove('warning');
                }
            }
        });
    }

    // Event listeners para upload de fotos
    const profilePhoto = document.getElementById('profile_photo');
    if (profilePhoto) {
        profilePhoto.addEventListener('change', function(e) {
            if (e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const storeAvatar = document.querySelector('.store-avatar');
                    if (storeAvatar) {
                        storeAvatar.innerHTML = `<img src="${event.target.result}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                    }
                    if (window.TrilistaDB) {
                        TrilistaDB.saveProfile({ profilePhoto: event.target.result });
                    }
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

    const coverPhoto = document.getElementById('cover_photo');
    if (coverPhoto) {
        coverPhoto.addEventListener('change', function(e) {
            if (e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const cover = document.getElementById('storeCover');
                    if (cover) {
                        cover.style.backgroundImage = 'url(' + event.target.result + ')';
                        cover.classList.add('has-cover');
                    }
                    if (window.TrilistaDB) {
                        TrilistaDB.saveProfile({ coverPhoto: event.target.result });
                    }
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }
});
