// galeria.js - Feed vertical de galeria inspirado em stories
const GaleriaManager = (function() {
    let galleryImages = [];
    let selectedImages = [];
    let draggedItemIndex = null;
    let currentGallerySlide = 0;
    let currentLightboxIndex = 0;
    let galleryViewMode = 1;
    const VIEW_MODE_STORAGE_KEY = 'trilista_gallery_view_mode';

    function salvarModoVisao(mode) {
        try {
            localStorage.setItem(VIEW_MODE_STORAGE_KEY, String(mode || 1));
        } catch (e) {
            console.warn('Nao foi possivel salvar o modo de visualizacao:', e);
        }
    }

    function carregarModoVisaoSalvo() {
        try {
            const modeSalvo = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
            return modeSalvo ? parseInt(modeSalvo, 10) : 1;
        } catch (e) {
            console.warn('Nao foi possivel carregar o modo de visualizacao salvo:', e);
            return 1;
        }
    }

    function changeViewMode(mode) {
        galleryViewMode = parseInt(mode, 10) || 1;
        salvarModoVisao(galleryViewMode);
        atualizarCarrossel();
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getOrderedGallery() {
        return galleryImages
            .map((image, index) => ({ image, index }))
            .sort((a, b) => {
                const timeA = Number(a.image.createdAt || a.image.id || 0);
                const timeB = Number(b.image.createdAt || b.image.id || 0);
                if (timeA !== timeB) return timeB - timeA;
                return b.index - a.index;
            })
            .map(({ image }) => image);
    }

    function createStoryCard(image, index, modal = false) {
        const src = image.data || image.url || '';
        const storeName = document.getElementById('previewStoreName')?.textContent?.trim() || 'Sua loja';
        const avatarImg = document.querySelector('.store-avatar img')?.getAttribute('src') || '';
        const avatarMarkup = avatarImg
            ? `<img src="${avatarImg}" alt="${escapeHtml(storeName)}">`
            : `<span class="gallery-story-avatar-fallback"><i class="fa-solid fa-store"></i></span>`;
        const caption = image.caption && image.caption.trim()
            ? `<div class="gallery-story-text"><p>${escapeHtml(image.caption)}</p></div>`
            : '';
        const openAction = modal ? '' : ` onclick="GaleriaManager.openLightbox(${index})"`;
        return `
            <article class="gallery-story-card"${openAction}>
                <div class="gallery-story-head">
                    <div class="gallery-story-avatar">${avatarMarkup}</div>
                    <div class="gallery-story-meta">
                        <strong>${escapeHtml(storeName)}</strong>
                        <span>Galeria</span>
                    </div>
                </div>
                ${caption}
                <div class="gallery-story-media">
                    <img src="${src}" alt="${escapeHtml(image.name || `Foto ${index + 1}`)}">
                </div>
            </article>
        `;
    }

    function renderGalleryFeedModal() {
        const feed = document.getElementById('lightboxFeed');
        if (!feed) return;

        const orderedGallery = getOrderedGallery();
        if (!orderedGallery.length) {
            feed.innerHTML = `
                <div class="gallery-feed-empty">
                    <i class="fa-solid fa-images"></i>
                    <p>Nenhuma foto publicada ainda.</p>
                </div>
            `;
            return;
        }

        feed.innerHTML = orderedGallery
            .map((image, index) => createStoryCard(image, index, true))
            .join('');
    }

    function carregarGaleria() {
        if (window.TrilistaDB) {
            galleryImages = TrilistaDB.getGallery() || [];
            const modoSalvo = carregarModoVisaoSalvo();
            const dropdownViewMode = document.getElementById('galleryViewMode');
            galleryViewMode = modoSalvo;
            if (dropdownViewMode) dropdownViewMode.value = String(modoSalvo);
            atualizarUI();
        }
    }

    function persistGallery() {
        let savedLocally = true;

        if (window.TrilistaDB) {
            savedLocally = TrilistaDB.saveGallery(galleryImages);
        }

        if (window.TrilistaSupabaseSync && window.TrilistaSupabaseSync.isConfigured()) {
            window.TrilistaSupabaseSync.syncCurrentGallery(galleryImages).catch((error) => {
                console.warn('Nao foi possivel sincronizar a galeria com o Supabase:', error.message);
            });
        }

        return savedLocally;
    }

    window.addEventListener('trilista:gallery-loaded', (event) => {
        if (!event.detail || !Array.isArray(event.detail.gallery)) return;
        galleryImages = event.detail.gallery;
        atualizarUI();
    });

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

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
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

    async function handleUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        if (files.length > 6) {
            alert('Maximo de 6 imagens por vez. As primeiras 6 serao processadas.');
            files.splice(6);
        }

        const uploadBtn = event.target.closest('.upload-gallery-area')?.querySelector('.btn-primary');
        const originalBtnHTML = uploadBtn ? uploadBtn.innerHTML : '';

        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (file.size > 5 * 1024 * 1024) {
                console.warn(`A imagem "${file.name}" excede o limite de 5MB. Pulada.`);
                continue;
            }

            try {
                const compressed = await compressImage(file);
                const reader = new FileReader();

                await new Promise((resolve) => {
                    reader.onload = (e) => {
                        galleryImages.unshift({
                            id: Date.now() + i,
                            createdAt: Date.now() + i,
                            name: file.name,
                            data: e.target.result,
                            size: compressed.compressedSize,
                            originalSize: compressed.originalSize,
                            reduction: compressed.reduction,
                            uploaded: new Date().toLocaleDateString('pt-BR'),
                            caption: ''
                        });
                        resolve();
                    };
                    reader.readAsDataURL(compressed.file);
                });
            } catch (error) {
                console.error('Erro ao processar imagem:', error);
            }
        }

        persistGallery();

        atualizarUI();

        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = originalBtnHTML;
        }

        event.target.value = '';
    }

    function atualizarUI() {
        atualizarContagem();
        atualizarLista();
        atualizarCarrossel();
    }

    function atualizarContagem() {
        const countElement = document.getElementById('photos-count');
        const listCountElement = document.getElementById('galleryListCount');
        const total = galleryImages.length;
        if (countElement) countElement.textContent = `${total} foto${total !== 1 ? 's' : ''}`;
        if (listCountElement) listCountElement.textContent = `${total} foto${total !== 1 ? 's' : ''}`;
    }

    function atualizarLista() {
        const galleryItems = document.getElementById('galleryItems');
        if (!galleryItems) return;

        if (galleryImages.length === 0) {
            galleryItems.innerHTML = `
                <div class="empty-gallery">
                    <i class="fa-solid fa-camera"></i>
                    <p>A galeria esta vazia</p>
                    <small>Adicione fotos para ver aqui</small>
                </div>
            `;
            return;
        }

        let html = '';
        galleryImages.forEach((image, index) => {
            const sizeKB = Math.round((image.size || 0) / 1024);
            html += `
                <div class="gallery-item-card" draggable="true" ondragstart="GaleriaManager.handleDragStart(event, ${index})" ondragover="GaleriaManager.handleDragOver(event)" ondrop="GaleriaManager.handleDrop(event, ${index})">
                    <div class="drag-handle">
                        <i class="fa-solid fa-grip-vertical"></i>
                    </div>
                    <div class="item-main-content">
                        <div class="item-image-wrapper">
                            <img src="${image.data}" alt="${escapeHtml(image.name || `Foto ${index + 1}`)}">
                            <div class="compression-badge">
                                <span>${sizeKB}KB</span>
                            </div>
                        </div>
                        <div class="item-details">
                            <input type="text"
                                class="item-caption-input"
                                placeholder="Legenda visivel sobre a foto"
                                value="${escapeHtml(image.caption || '')}"
                                onchange="GaleriaManager.updateCaption(${index}, this.value)">
                            <div class="item-footer-actions">
                                <span class="upload-date"><i class="fa-solid fa-calendar-day"></i> ${image.uploaded || '-'}</span>
                                <button class="btn-icon-delete" onclick="GaleriaManager.deleteImage(${index})" title="Excluir">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        galleryItems.innerHTML = html;
    }

    function updateCaption(index, value) {
        if (!galleryImages[index]) return;
        galleryImages[index].caption = value;
        persistGallery();
        atualizarCarrossel();
    }

    function handleDragStart(e, index) {
        draggedItemIndex = index;
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e, targetIndex) {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === targetIndex) return;

        const movedItem = galleryImages.splice(draggedItemIndex, 1)[0];
        galleryImages.splice(targetIndex, 0, movedItem);

        persistGallery();

        draggedItemIndex = null;
        atualizarUI();
    }

    function deleteImage(index) {
        if (!confirm('Tem certeza que deseja excluir esta imagem?')) return;
        galleryImages.splice(index, 1);
        persistGallery();
        atualizarUI();
    }

    function moveImage(index, direction) {
        if (direction === 'up' && index > 0) {
            [galleryImages[index], galleryImages[index - 1]] = [galleryImages[index - 1], galleryImages[index]];
        } else if (direction === 'down' && index < galleryImages.length - 1) {
            [galleryImages[index], galleryImages[index + 1]] = [galleryImages[index + 1], galleryImages[index]];
        } else {
            return;
        }

        persistGallery();

        atualizarUI();
    }

    function atualizarCarrossel() {
        const galleryTrack = document.getElementById('galleryTrack');
        const galleryIndicators = document.getElementById('galleryIndicators');
        const gallerySection = galleryTrack?.closest('.store-section');
        const carouselContainer = document.querySelector('#phoneGallery .carousel-container');
        const prevBtn = document.querySelector('#phoneGallery .prev-btn');
        const nextBtn = document.querySelector('#phoneGallery .next-btn');
        if (!galleryTrack) return;

        if (galleryImages.length === 0) {
            galleryTrack.innerHTML = `<div class="empty-gallery-state"><i class="fa-solid fa-images"></i><p>Nenhuma foto na galeria</p></div>`;
            if (gallerySection) gallerySection.style.display = 'none';
            if (galleryIndicators) galleryIndicators.innerHTML = '';
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            renderGalleryFeedModal();
            return;
        }

        if (gallerySection) gallerySection.style.display = 'block';

        const orderedGallery = getOrderedGallery();
        const imagesPerPage = galleryViewMode;
        const totalPages = Math.ceil(orderedGallery.length / imagesPerPage);
        currentGallerySlide = Math.min(currentGallerySlide, Math.max(0, totalPages - 1));

        if (galleryViewMode === 1) {
            if (carouselContainer) {
                carouselContainer.style.aspectRatio = '1';
                carouselContainer.style.minHeight = 'auto';
            }

            galleryTrack.innerHTML = orderedGallery.map((image, index) => `
                <div class="carousel-slide" data-index="${index}" onclick="GaleriaManager.openLightbox(${index})">
                    <img src="${image.data || image.url || ''}" alt="${escapeHtml(image.name || `Foto ${index + 1}`)}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;">
                    ${image.caption ? `<div class="carousel-caption-overlay"><span>${escapeHtml(image.caption)}</span></div>` : ''}
                </div>
            `).join('');
        } else {
            if (carouselContainer) {
                carouselContainer.style.aspectRatio = 'auto';
                carouselContainer.style.minHeight = '340px';
            }

            let pagesHTML = '';
            for (let page = 0; page < totalPages; page++) {
                const start = page * imagesPerPage;
                const pageImages = orderedGallery.slice(start, start + imagesPerPage);
                const cols = galleryViewMode === 4 ? 2 : 3;
                const rows = 2;

                pagesHTML += `
                    <div class="carousel-slide" style="flex: 0 0 100%; width: 100%;">
                        <div class="gallery-grid" style="display:grid; grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr); gap: 10px; width: 100%; height: 100%; padding: 8px;">
                            ${pageImages.map((image, idx) => {
                                const imageIndex = start + idx;
                                return `
                                    <div class="grid-item" style="width:100%; height:100%; position:relative; cursor:pointer;" onclick="GaleriaManager.openLightbox(${imageIndex})">
                                        <img src="${image.data || image.url || ''}" alt="${escapeHtml(image.name || `Foto ${imageIndex + 1}`)}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">
                                        ${image.caption ? `<div class="grid-caption-badge"><span>${escapeHtml(image.caption)}</span></div>` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
            galleryTrack.innerHTML = pagesHTML;
        }

        if (galleryIndicators) {
            if (totalPages > 1) {
                galleryIndicators.innerHTML = Array.from({ length: totalPages }).map((_, index) =>
                    `<button class="carousel-indicator ${index === currentGallerySlide ? 'active' : ''}" onclick="GaleriaManager.goToSlide(${index})"></button>`
                ).join('');
                galleryIndicators.style.display = 'flex';
            } else {
                galleryIndicators.innerHTML = '';
                galleryIndicators.style.display = 'none';
            }
        }

        if (prevBtn) prevBtn.style.display = totalPages > 1 ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = totalPages > 1 ? 'flex' : 'none';
        updateCarrosselPosicao();

        renderGalleryFeedModal();
    }

    function openLightbox(index = 0) {
        currentLightboxIndex = index;
        const lightbox = document.getElementById('galleryLightbox');
        if (!lightbox) return;
        lightbox.classList.add('active');
        renderGalleryFeedModal();
    }

    function closeLightbox() {
        const lightbox = document.getElementById('galleryLightbox');
        if (lightbox) {
            lightbox.classList.remove('active');
        }
    }

    function nextLightbox() {}
    function prevLightbox() {}

    function nextSlide() {
        const totalPages = Math.ceil(getOrderedGallery().length / galleryViewMode);
        if (totalPages <= 1) return;
        currentGallerySlide = (currentGallerySlide + 1) % totalPages;
        updateCarrosselPosicao();
    }

    function prevSlide() {
        const totalPages = Math.ceil(getOrderedGallery().length / galleryViewMode);
        if (totalPages <= 1) return;
        currentGallerySlide = (currentGallerySlide - 1 + totalPages) % totalPages;
        updateCarrosselPosicao();
    }

    function goToSlide(index) {
        const totalPages = Math.ceil(getOrderedGallery().length / galleryViewMode);
        if (index < 0 || index >= totalPages) return;
        currentGallerySlide = index;
        updateCarrosselPosicao();
    }

    function updateCarrosselPosicao() {
        const galleryTrack = document.getElementById('galleryTrack');
        const indicators = document.querySelectorAll('#galleryIndicators .carousel-indicator');
        if (!galleryTrack) return;
        galleryTrack.style.transform = `translateX(-${currentGallerySlide * 100}%)`;
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentGallerySlide);
        });
    }

    return {
        carregarGaleria,
        handleUpload,
        deleteImage,
        moveImage,
        changeViewMode,
        nextSlide,
        prevSlide,
        goToSlide,
        handleDragStart,
        handleDragOver,
        handleDrop,
        updateCaption,
        openLightbox,
        closeLightbox,
        nextLightbox,
        prevLightbox,
        getGallery: () => galleryImages
    };
})();

window.GaleriaManager = GaleriaManager;
