// videos.js - Gerenciamento de vídeos
const VideosManager = (function() {
    let videos = [];
    const VIDEO_STORAGE_KEY = 'trilista_videos';
    let currentVideoSlide = 0;
    let currentLightboxIndex = 0;

    function carregarVideos() {
        if (window.TrilistaDB) {
            videos = TrilistaDB.getVideos() || [];
            atualizarDisplay();
            atualizarPreview();
            atualizarContador();
        }
        return videos;
    }

    function salvarVideos() {
        if (window.TrilistaDB) {
            TrilistaDB.saveVideos(videos);
        }
        try {
            localStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(videos));
        } catch (e) {
            console.warn('Não foi possível salvar vídeos no localStorage:', e);
        }
        if (window.TrilistaSupabaseSync && window.TrilistaSupabaseSync.isConfigured()) {
            window.TrilistaSupabaseSync.syncCurrentVideos(videos).catch((error) => {
                console.warn('Nao foi possivel sincronizar os videos com o Supabase:', error.message);
            });
        }
    }

    window.addEventListener('trilista:videos-loaded', (event) => {
        if (!event.detail || !Array.isArray(event.detail.videos)) return;
        videos = event.detail.videos;
        atualizarDisplay();
        atualizarPreview();
        atualizarContador();
    });

    function adicionarVideo(tipo) {
        if (tipo === 'upload') {
            adicionarVideoUpload();
        } else if (tipo === 'link') {
            adicionarVideoLink();
        }
    }

    function nextSlide() {
        if (videos.length <= 1) return;
        currentVideoSlide = (currentVideoSlide + 1) % videos.length;
        updateVideoCarrosselPosicao();
    }

    function prevSlide() {
        if (videos.length <= 1) return;
        currentVideoSlide = (currentVideoSlide - 1 + videos.length) % videos.length;
        updateVideoCarrosselPosicao();
    }

    function goToSlide(index) {
        if (index >= 0 && index < videos.length) {
            currentVideoSlide = index;
            updateVideoCarrosselPosicao();
        }
    }

    function updateVideoCarrosselPosicao() {
        const track = document.getElementById('phoneVideosPreview');
        const indicators = document.querySelectorAll('#videoIndicators .carousel-indicator');
        
        // Pausar todos os vídeos antes de trocar de slide
        pausarTodosOsVideos();

        if (track) {
            track.style.transform = `translateX(-${currentVideoSlide * 100}%)`;
        }
        
        indicators.forEach((ind, idx) => {
            ind.classList.toggle('active', idx === currentVideoSlide);
        });
    }

    function pausarTodosOsVideos() {
        const track = document.getElementById('phoneVideosPreview');
        if (!track) return;

        // Pausar vídeos de upload (tag <video>)
        const nativeVideos = track.querySelectorAll('video');
        nativeVideos.forEach(v => {
            v.pause();
        });

        // Pausar vídeos externos (YouTube/Vimeo via iframe)
        // O método mais seguro sem a API oficial é recarregar o src para forçar o stop
        const iframes = track.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const src = iframe.src;
            iframe.src = '';
            iframe.src = src;
        });
    }

    function adicionarVideoUpload() {
        // Criar modal para upload
        const modal = document.createElement('div');
        modal.className = 'video-modal';
        modal.innerHTML = `
            <div class="video-modal-content">
                <div class="video-modal-header">
                    <h3>Adicionar Vídeo Curto</h3>
                    <button class="video-modal-close" onclick="this.closest('.video-modal').remove()">&times;</button>
                </div>
                <div class="video-modal-body">
                    <div class="video-upload-area">
                        <div class="video-upload-instructions">
                            <i class="fa-solid fa-video"></i>
                            <h4>Enviar Vídeo</h4>
                            <p>Clique para selecionar ou arraste um vídeo</p>
                            <small>Duração recomendada: até 1 minuto<br>Tamanho máximo: 50MB<br>Formatos: MP4, WebM, MOV</small>
                        </div>
                        <input type="file" id="videoUploadInput" accept="video/*" style="display: none;">
                        <button class="btn-small btn-primary" onclick="document.getElementById('videoUploadInput').click()">
                            <i class="fa-solid fa-plus"></i>
                            Selecionar Vídeo
                        </button>
                    </div>
                    <div class="video-duration-options">
                        <h5>Duração de exibição:</h5>
                        <div class="duration-options">
                            <label><input type="radio" name="videoDuration" value="1" checked> 1 dia</label>
                            <label><input type="radio" name="videoDuration" value="3"> 3 dias</label>
                        </div>
                    </div>
                </div>
                <div class="video-modal-footer">
                    <button class="btn-small btn-outline" onclick="this.closest('.video-modal').remove()">Cancelar</button>
                    <button class="btn-small btn-primary" id="confirmVideoUpload" disabled>
                        <i class="fa-solid fa-upload"></i>
                        Enviar Vídeo
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Configurar drag & drop
        const uploadArea = modal.querySelector('.video-upload-area');
        const fileInput = modal.querySelector('#videoUploadInput');

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleVideoFile(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleVideoFile(e.target.files[0]);
            }
        });

        function handleVideoFile(file) {
            if (!file.type.startsWith('video/')) {
                alert('Por favor, selecione um arquivo de vídeo válido.');
                return;
            }

            if (file.size > 50 * 1024 * 1024) { // 50MB
                alert('O vídeo deve ter no máximo 50MB.');
                return;
            }

            // Verificar duração do vídeo
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = function() {
                if (video.duration > 60) { // 1 minuto
                    alert('O vídeo deve ter no máximo 1 minuto de duração.');
                    return;
                }

                // Arquivo válido
                modal.querySelector('.video-upload-instructions').innerHTML = `
                    <i class="fa-solid fa-check-circle" style="color: #10B981;"></i>
                    <h4>Vídeo Selecionado</h4>
                    <p>${file.name}</p>
                    <small>Duração: ${Math.round(video.duration)}s</small>
                `;

                modal.querySelector('#confirmVideoUpload').disabled = false;
                modal.querySelector('#confirmVideoUpload').onclick = () => {
                    processarVideoUpload(file, modal);
                };
            };
            video.src = URL.createObjectURL(file);
        }
    }

    function processarVideoUpload(file, modal) {
        const duration = parseInt(modal.querySelector('input[name="videoDuration"]:checked').value);

        // Comprimir vídeo (simulação - em produção usaria FFmpeg ou similar)
        const reader = new FileReader();
        reader.onload = function(e) {
            const videoData = e.target.result;

            const novoVideo = {
                id: Date.now(),
                type: 'upload',
                data: videoData,
                fileName: file.name,
                fileSize: file.size,
                duration: duration,
                uploadedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
            };

            videos.push(novoVideo);
            salvarVideos();
            atualizarDisplay();
            atualizarPreview();
            atualizarContador();

            modal.remove();
            alert('Vídeo enviado com sucesso! Ele será exibido por ' + duration + ' dia(s).');
        };
        reader.readAsDataURL(file);
    }

    function adicionarVideoLink() {
        const link = prompt('Cole o link do vídeo (YouTube, Vimeo, etc.):');
        if (!link || !link.trim()) return;

        // Validar se é um link válido
        const urlPattern = /^https?:\/\/.+/i;
        if (!urlPattern.test(link.trim())) {
            alert('Por favor, insira um link válido começando com http:// ou https://');
            return;
        }

        // Modal para escolher duração
        const modal = document.createElement('div');
        modal.className = 'video-modal';
        modal.innerHTML = `
            <div class="video-modal-content">
                <div class="video-modal-header">
                    <h3>Adicionar Vídeo por Link</h3>
                    <button class="video-modal-close" onclick="this.closest('.video-modal').remove()">&times;</button>
                </div>
                <div class="video-modal-body">
                    <div class="video-link-preview">
                        <p><strong>Link:</strong> ${link}</p>
                    </div>
                    <div class="video-duration-options">
                        <h5>Duração de exibição:</h5>
                        <div class="duration-options">
                            <label><input type="radio" name="linkVideoDuration" value="1"> 1 dia</label>
                            <label><input type="radio" name="linkVideoDuration" value="3"> 3 dias</label>
                            <label><input type="radio" name="linkVideoDuration" value="permanent" checked> Permanente</label>
                        </div>
                    </div>
                </div>
                <div class="video-modal-footer">
                    <button class="btn-small btn-outline" onclick="this.closest('.video-modal').remove()">Cancelar</button>
                    <button class="btn-small btn-primary" onclick="confirmarVideoLink('${link.replace(/'/g, "\\'")}', this.closest('.video-modal'))">
                        <i class="fa-solid fa-plus"></i>
                        Adicionar Vídeo
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    window.confirmarVideoLink = function(link, modal) {
        const durationOption = modal.querySelector('input[name="linkVideoDuration"]:checked').value;
        let expiresAt = null;

        if (durationOption !== 'permanent') {
            const duration = parseInt(durationOption);
            expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();
        }

        const novoVideo = {
            id: Date.now(),
            type: 'link',
            url: link,
            duration: durationOption,
            uploadedAt: new Date().toISOString(),
            expiresAt: expiresAt
        };

        videos.push(novoVideo);
        salvarVideos();
        atualizarDisplay();
        atualizarPreview();
        atualizarContador();

        modal.remove();
        const durationText = durationOption === 'permanent' ? 'permanentemente' : `por ${durationOption} dia(s)`;
        alert(`Vídeo adicionado com sucesso! Ele será exibido ${durationText}.`);
    };

    function removerVideo(index) {
        if (confirm('Tem certeza que deseja remover este vídeo?')) {
            videos.splice(index, 1);
            salvarVideos();
            atualizarDisplay();
            atualizarPreview();
            atualizarContador();
        }
    }

    function updateCaption(index, value) {
        if (videos[index]) {
            videos[index].caption = value;
            salvarVideos();
            atualizarPreview();
        }
    }

    // Drag & Drop Handlers
    let draggedItemIndex = null;

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

        const movedItem = videos.splice(draggedItemIndex, 1)[0];
        videos.splice(targetIndex, 0, movedItem);

        salvarVideos();
        draggedItemIndex = null;
        atualizarDisplay();
        atualizarPreview();
    }

    function atualizarDisplay() {
        const videosList = document.getElementById('videosList');

        if (!videosList) return;

        // Limpar vídeos expirados
        const now = new Date();
        videos = videos.filter(video => {
            if (video.expiresAt && new Date(video.expiresAt) < now) {
                return false;
            }
            return true;
        });

        if (videos.length === 0) {
            videosList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-video"></i>
                    <p>Nenhum vídeo adicionado</p>
                </div>
            `;
            return;
        }

        let html = '';

        videos.forEach((video, index) => {
            const isExpired = video.expiresAt && new Date(video.expiresAt) < now;
            const expiration = getExpirationInfo(video);
            const thumbnail = getThumbnailHTML(video);

            html += `
                <div class="video-item-card" draggable="true" 
                    ondragstart="VideosManager.handleDragStart(event, ${index})" 
                    ondragover="VideosManager.handleDragOver(event)" 
                    ondrop="VideosManager.handleDrop(event, ${index})">
                    
                    <div class="video-drag-handle">
                        <i class="fa-solid fa-grip-vertical"></i>
                    </div>

                    <div class="video-main-content">
                        <div class="video-thumbnail-wrapper">
                            ${thumbnail}
                            <div class="video-type-badge">
                                <span>${video.type === 'upload' ? 'Upload' : 'Link'}</span>
                            </div>
                        </div>
                        
                        <div class="video-item-details">
                            <input type="text" 
                                class="video-caption-input" 
                                placeholder="Título ou Descrição do vídeo" 
                                value="${video.caption || ''}" 
                                onchange="VideosManager.updateCaption(${index}, this.value)"
                            >
                            
                            <div class="video-footer-actions">
                                <span class="video-expiration-info ${expiration.class}">
                                    <i class="fa-solid ${expiration.icon}"></i> ${expiration.text}
                                </span>
                                <button class="btn-icon-delete-video" onclick="VideosManager.removerVideo(${index})" title="Excluir">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        videosList.innerHTML = html;
    }

    function getThumbnailHTML(video) {
        if (video.type === 'upload') {
            return `<video src="${video.data}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`;
        }

        const youtubeId = getYouTubeVideoId(video.url);
        if (youtubeId) {
            return `<img src="https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg" alt="YouTube Thumb">`;
        }

        const vimeoId = getVimeoVideoId(video.url);
        if (vimeoId) {
            return `<i class="fa-brands fa-vimeo-v" style="font-size: 24px; color: #94a3b8;"></i>`;
        }

        return `<i class="fa-solid fa-link" style="font-size: 24px; color: #94a3b8;"></i>`;
    }

    function getExpirationInfo(video) {
        if (video.duration === 'permanent') {
            return { text: 'Permanente', class: '', icon: 'fa-infinity' };
        }
        
        const expires = new Date(video.expiresAt);
        const now = new Date();
        const diffMs = expires - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

        if (diffMs <= 0) {
            return { text: 'Expirado', class: 'expired', icon: 'fa-clock' };
        }
        
        if (diffDays <= 1) {
            return { text: `Expira em ${diffHours}h`, class: 'urgent', icon: 'fa-bolt' };
        }

        return { text: `Expira em ${diffDays} dias`, class: '', icon: 'fa-calendar-check' };
    }

    function atualizarPreview() {
        const container = document.getElementById('phoneVideosPreview');
        const section = document.getElementById('videos-preview-section');
        const indicators = document.getElementById('videoIndicators');
        const prevBtn = document.querySelector('.video-prev');
        const nextBtn = document.querySelector('.video-next');
        const carouselContainer = document.querySelector('.video-carousel');

        if (videos.length === 0) {
            if (section) section.style.display = 'none';
            if (container) container.innerHTML = '';
            return;
        }

        if (section) section.style.display = 'block';
        if (!container) return;

        if (carouselContainer) {
            carouselContainer.style.aspectRatio = '1';
            carouselContainer.style.minHeight = 'auto';
            carouselContainer.style.background = '#000';
            carouselContainer.style.borderRadius = '12px';
            carouselContainer.style.overflow = 'hidden';
        }

        container.innerHTML = '';
        if (currentVideoSlide >= videos.length) {
            currentVideoSlide = 0;
        }

        const hasMultiple = videos.length > 1;
        if (prevBtn) prevBtn.style.display = hasMultiple ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = hasMultiple ? 'flex' : 'none';

        videos.forEach((video, index) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            slide.style.cssText = `
                flex: 0 0 100%;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            `;

            const mediaHTML = video.type === 'upload'
                ? `
                    <video controls style="width: 100%; height: 100%; object-fit: contain;">
                        <source src="${video.data}" type="video/mp4">
                    </video>
                `
                : getLinkPreviewHTML(video);

            slide.innerHTML = `
                <div class="phone-video-card" style="width: 100%; height: 100%; margin: 0; border-radius: 0; background: transparent; cursor: pointer;" onclick="VideosManager.openLightbox(${index})">
                    <div class="phone-video-wrapper" style="height: 100%; display: flex; align-items: center; justify-content: center; pointer-events: none;">
                        ${mediaHTML}
                    </div>
                    ${video.caption ? `
                        <div class="phone-video-caption" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: #fff; padding: 10px; font-size: 12px; text-align: center; backdrop-filter: blur(4px);">
                            ${video.caption}
                        </div>
                    ` : ''}
                </div>
            `;

            container.appendChild(slide);
        });

        if (indicators) {
            indicators.innerHTML = '';
            if (hasMultiple) {
                videos.forEach((_, idx) => {
                    const dot = document.createElement('button');
                    dot.className = `carousel-indicator ${idx === currentVideoSlide ? 'active' : ''}`;
                    dot.onclick = () => goToSlide(idx);
                    indicators.appendChild(dot);
                });
            }
        }

        updateVideoCarrosselPosicao();
    }

    function getEmbedUrl(url) {
        if (!url) return null;

        // YouTube (Comum, Shorts, etc)
        const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (youtubeMatch) {
            return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        }

        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }

        return null;
    }

    function getYouTubeVideoId(url) {
        if (!url) return null;
        const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return youtubeMatch ? youtubeMatch[1] : null;
    }

    function getVimeoVideoId(url) {
        if (!url) return null;
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        return vimeoMatch ? vimeoMatch[1] : null;
    }

    function getLinkPreviewHTML(video) {
        const youtubeId = getYouTubeVideoId(video.url);
        if (youtubeId) {
            return `
                <div class="phone-video-link-preview">
                    <img src="https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg" alt="Preview do vídeo">
                    <div class="phone-video-play-badge">
                        <i class="fa-solid fa-play"></i>
                    </div>
                </div>
            `;
        }

        const vimeoId = getVimeoVideoId(video.url);
        if (vimeoId) {
            return `
                <div class="phone-video-link-preview phone-video-link-fallback">
                    <i class="fa-brands fa-vimeo-v"></i>
                    <span>Assistir vídeo</span>
                </div>
            `;
        }

        return `
            <div class="phone-video-link-preview phone-video-link-fallback">
                <i class="fa-solid fa-circle-play"></i>
                <span>Assistir vídeo</span>
            </div>
        `;
    }

    function atualizarContador() {
        const contador = document.getElementById('videos-count');
        if (contador) {
            const activeCount = videos.filter(video => {
                if (video.expiresAt && new Date(video.expiresAt) < new Date()) {
                    return false;
                }
                return true;
            }).length;
            contador.textContent = `${activeCount} vídeo${activeCount !== 1 ? 's' : ''}`;
        }
    }

    // --- LÓGICA DO LIGHTBOX (TELA CHEIA) ---
    function openLightbox(index) {
        currentLightboxIndex = index;
        const lightbox = document.getElementById('videoLightbox');
        if (lightbox) {
            lightbox.classList.add('active');
            updateLightboxContent();
        }
    }

    function closeLightbox() {
        const lightbox = document.getElementById('videoLightbox');
        const container = document.getElementById('videoLightboxContainer');
        if (lightbox) {
            lightbox.classList.remove('active');
            if (container) container.innerHTML = ''; // Limpar iframe ao fechar
        }
    }

    function nextLightbox() {
        if (videos.length <= 1) return;
        currentLightboxIndex = (currentLightboxIndex + 1) % videos.length;
        updateLightboxContent();
    }

    function prevLightbox() {
        if (videos.length <= 1) return;
        currentLightboxIndex = (currentLightboxIndex - 1 + videos.length) % videos.length;
        updateLightboxContent();
    }

    function updateLightboxContent() {
        const container = document.getElementById('videoLightboxContainer');
        const caption = document.getElementById('videoLightboxCaption');
        const lightbox = document.getElementById('videoLightbox');
        const video = videos[currentLightboxIndex];
        
        if (!container || !video) return;

        lightbox.classList.remove('shorts-mode');

        let mediaHTML = '';
        if (video.type === 'upload') {
            mediaHTML = `
                <video controls autoplay style="width: 100%; height: 100%; object-fit: contain;">
                    <source src="${video.data}" type="video/mp4">
                </video>
            `;
            lightbox.classList.add('shorts-mode');
        } else {
            const providerName = getYouTubeVideoId(video.url) ? 'YouTube' : (getVimeoVideoId(video.url) ? 'Vimeo' : 'link original');
            mediaHTML = `
                <div class="video-link-lightbox-fallback">
                    ${getLinkPreviewHTML(video)}
                    <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="video-link-lightbox-button">
                        <i class="fa-solid fa-up-right-from-square"></i>
                        Assistir no ${providerName}
                    </a>
                </div>
            `;
        }

        container.innerHTML = mediaHTML;
        
        if (caption) {
            caption.textContent = video.caption || '';
        }

        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');
        if (prevBtn && nextBtn) {
            const showNav = videos.length > 1;
            prevBtn.style.display = showNav ? 'flex' : 'none';
            nextBtn.style.display = showNav ? 'flex' : 'none';
        }
    }

    // API pública
    return {
        carregarVideos,
        adicionarVideo,
        removerVideo,
        atualizarDisplay,
        atualizarPreview,
        atualizarContador,
        handleDragStart,
        handleDragOver,
        handleDrop,
        updateCaption,
        nextSlide,
        prevSlide,
        goToSlide,
        openLightbox,
        closeLightbox,
        nextLightbox,
        prevLightbox,
        getVideos: () => videos
    };
})();

// Expor globalmente
window.VideosManager = VideosManager;



