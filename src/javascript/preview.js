// preview.js - carrega snapshot salvo em localStorage e renderiza a página de preview
(function(){
    function repairVisibleText(value, fallback = '') {
        if (typeof value !== 'string') {
            return fallback;
        }

        let repaired = value;
        const knownBrokenDefaults = [
            'Bem-vindo Ã  minha loja! Aqui vocÃª encontra os melhores produtos.',
            'Bem-vindo ÃƒÂ  minha loja! Aqui vocÃƒÂª encontra os melhores produtos.',
            'Bem-vindo ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  minha loja! Aqui vocÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âª encontra os melhores produtos.'
        ];

        if (knownBrokenDefaults.includes(repaired.trim())) {
            return 'Bem-vindo à minha loja! Aqui você encontra os melhores produtos.';
        }

        for (let index = 0; index < 3; index += 1) {
            if (!/(?:Ã.|Â.|�|Ãƒ.|Ã‚.|ï¿½)/.test(repaired)) {
                break;
            }

            try {
                repaired = decodeURIComponent(escape(repaired));
            } catch (error) {
                break;
            }
        }

        return repaired.trim() || fallback;
    }

    async function hydratePreviewData(snapshotKey) {
        if (!window.TrilistaSupabaseSync || !window.TrilistaSupabaseSync.isConfigured()) {
            return;
        }

        try {
            if (snapshotKey && window.TrilistaDB && typeof TrilistaDB.refreshCurrentStoreFromSupabase === 'function') {
                await TrilistaDB.refreshCurrentStoreFromSupabase();
                return;
            }

            if (window.TrilistaDB && typeof TrilistaDB.refreshCurrentStoreFromSupabase === 'function') {
                await TrilistaDB.refreshCurrentStoreFromSupabase();
            }
        } catch (error) {
            console.warn('Nao foi possivel hidratar o preview via Supabase:', error.message);
        }
    }

    function qParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    function loadSnapshot() {
        const key = qParam('preview');
        if (key) {
            const raw = localStorage.getItem(key);
            if (raw) return JSON.parse(raw);
        }
        // fallback: se usuário logado, tentar usar banco atual
        if (window.Auth && window.TrilistaDB && Auth.isAuthenticated()) {
            try {
                const db = TrilistaDB.getDB();
                return db;
            } catch(e) { console.warn('Não foi possível carregar DB:', e); }
        }
        return null;
    }

    function renderProfile(snapshot) {
        const profile = snapshot.profile || {};
        const template = snapshot.template || snapshot.theme || {};
        const storeNameEl = document.getElementById('previewStoreName');
        const storeBioEl = document.getElementById('previewStoreBio');
        const avatarEl = document.querySelector('.store-avatar');
        const coverEl = document.getElementById('storeCover');

        if (storeNameEl) storeNameEl.textContent = profile.storeName || 'Minha Loja Incrível';
        if (storeBioEl) storeBioEl.textContent = profile.bio || '';

        if (storeNameEl) storeNameEl.textContent = repairVisibleText(storeNameEl.textContent, 'Minha Loja Incr\u00edvel');
        if (storeBioEl) storeBioEl.textContent = repairVisibleText(storeBioEl.textContent, '');

        if (profile.profilePhoto) {
            if (avatarEl) avatarEl.innerHTML = `<img src="${profile.profilePhoto}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-store"></i>';
        }

        if (profile.coverPhoto) {
            if (coverEl) {
                coverEl.style.backgroundImage = 'url("' + profile.coverPhoto + '")';
                coverEl.classList.add('has-cover');
            }
        }

        if (coverEl) {
            coverEl.classList.remove('cover-shape-rect', 'cover-shape-curve-down', 'cover-shape-curve-up');
            const coverShape = template.coverShape || 'rect';
            const shapeClassMap = {
                rect: 'cover-shape-rect',
                'curve-down': 'cover-shape-curve-down',
                'curve-up': 'cover-shape-curve-up'
            };
            coverEl.classList.add(shapeClassMap[coverShape] || 'cover-shape-rect');

            if (coverEl.classList.contains('has-cover')) {
                const coverHeight = Math.min(420, Math.max(80, parseInt(template.coverHeight, 10) || 124));
                const overlap = Math.round(coverHeight * 0.32);
                coverEl.style.height = `${coverHeight}px`;
                coverEl.style.marginBottom = `-${overlap}px`;
            } else {
                coverEl.style.height = '';
                coverEl.style.marginBottom = '';
            }
        }

        // Logo (Tamanho e Posição)
        if (avatarEl && snapshot.theme) {
            const baseSize = 80;
            const baseMargin = 8;
            const yOffset = parseInt(template.logoYOffset || 0);
            const scale = (template.logoSize || 100) / 100;
            const scaledGrowth = Math.max(0, ((baseSize * scale) - baseSize) / 2);
            const extraSpacing = Math.max(0, yOffset) + scaledGrowth;

            avatarEl.style.setProperty('transform', `translateY(${yOffset}px) scale(${scale})`, 'important');
            avatarEl.style.zIndex = "10";
            avatarEl.style.marginBottom = `${Math.round(baseMargin + extraSpacing)}px`;
        }

        if (profile.address || profile.neighborhood || profile.city) {
            const loc = document.getElementById('previewStoreLocation');
            if (loc) loc.style.display = 'flex';
            const a = document.getElementById('previewStoreAddress'); if (a) a.textContent = profile.address || '';
            const n = document.getElementById('previewStoreNeighborhood'); if (n) n.textContent = profile.neighborhood || '';
            const c = document.getElementById('previewStoreCity'); if (c) c.textContent = profile.city || '';
            
            const comma = document.getElementById('addressComma');
            if (comma) {
                comma.style.display = (profile.address && (profile.neighborhood || profile.city)) ? 'inline' : 'none';
            }
            
            const separator = document.getElementById('neighborhoodSeparator');
            if (separator) {
                separator.style.display = (profile.neighborhood && profile.city) ? 'inline' : 'none';
            }
        }
    }

    function renderLinks(snapshot) {
        const container = document.getElementById('phoneLinksPreview');
        const section = document.getElementById('links-preview-section');
        if (!container) return;
        container.innerHTML = '';
        const links = snapshot.links || [];
        if (!links.length) {
            // não mostrar seção se não houver links
            if (section) section.remove();
            return;
        }
        if (section) section.style.display = 'block';
        links.forEach(link => {
            const a = document.createElement('a');
            a.className = 'phone-link';
            a.href = link.url || '#';
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            const label = document.createElement('div');
            label.className = 'phone-link-label';
            label.textContent = link.title || (link.number ? link.number : 'Link');
            a.appendChild(label);
            container.appendChild(a);
        });
    }

    function renderSegments(snapshot) {
        const container = document.getElementById('phoneSegmentsPreview');
        const section = document.getElementById('segments-preview-section');
        if (!container) return;
        container.innerHTML = '';
        const profile = snapshot.profile || {};
        const cats = [];
        ['categoria1Text','categoria2Text','categoria3Text','categoria4Text'].forEach(key => {
            let txt = profile[key] || '';
            // Filtrar valores vazios e placeholders
            if (txt && txt.trim() && txt !== 'Selecione uma opção') {
                cats.push(txt);
            }
        });
        // fallback: show raw value if text not present (older records)
        if (!cats.length) {
            ['categoria1','categoria2','categoria3','categoria4'].forEach(key => {
                let txt = profile[key] || '';
                if (txt && txt.trim() && txt !== 'Selecione uma opção') cats.push(txt);
            });
        }
        if (!cats.length) {
            // Remover completamente a seção quando não há segmentos
            if (section) section.remove();
            return;
        }
        if (section) section.style.display = 'block';
        cats.forEach(txt => {
            const tag = document.createElement('div');
            tag.className = 'segment-tag';
            tag.textContent = txt;
            container.appendChild(tag);
        });
    }

    function renderGallery(snapshot) {
        const track = document.getElementById('galleryTrack');
        if (!track) return;
        track.innerHTML = '';
        const gallery = snapshot.gallery || [];
        if (!gallery.length) {
            track.innerHTML = `<div class="empty-gallery-state"><i class="fa-solid fa-images"></i><p>Nenhuma foto</p></div>`;
            return;
        }
        gallery
            .slice()
            .sort((a, b) => Number(b.createdAt || b.id || 0) - Number(a.createdAt || a.id || 0))
            .slice(0, 4)
            .forEach(img => {
                const item = document.createElement('article');
                item.className = 'gallery-story-card';

                const image = document.createElement('img');
                image.src = img.data || img.url || img;
                image.alt = img.alt || img.caption || '';
                item.appendChild(image);

                if (img.caption) {
                    const caption = document.createElement('div');
                    caption.className = 'gallery-story-caption';
                    const text = document.createElement('span');
                    text.textContent = img.caption;
                    caption.appendChild(text);
                    item.appendChild(caption);
                }

                track.appendChild(item);
            });
    }

    function renderVideos(snapshot) {
        const container = document.getElementById('phoneVideosPreview');
        const section = document.getElementById('videos-preview-section');
        if (!container) return;

        const videos = snapshot.videos || [];

        // Filtrar vídeos não expirados
        const activeVideos = videos.filter(video => {
            if (video.expiresAt && new Date(video.expiresAt) < new Date()) {
                return false;
            }
            return true;
        });

        container.innerHTML = '';

        if (activeVideos.length === 0) {
            // Remover completamente a seção quando não há vídeos
            if (section) section.remove();
            return;
        }

        if (section) section.style.display = 'block';

        activeVideos.forEach(video => {
            const videoElement = document.createElement('div');
            videoElement.className = 'phone-video-item';
            videoElement.style.marginBottom = '12px';

            if (video.type === 'upload') {
                videoElement.innerHTML = `
                    <video controls style="width: 100%; max-height: 180px; border-radius: 8px;">
                        <source src="${video.data}" type="video/mp4">
                        Seu navegador não suporta vídeos.
                    </video>
                `;
            } else {
                // Para links externos, criar embed básico
                const embedUrl = getEmbedUrl(video.url);
                if (embedUrl) {
                    videoElement.innerHTML = `
                        <iframe src="${embedUrl}" style="width: 100%; height: 180px; border-radius: 8px; border: none;" allowfullscreen></iframe>
                    `;
                } else {
                    videoElement.innerHTML = `
                        <div style="width: 100%; height: 180px; background: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <a href="${video.url}" target="_blank" style="color: #667eea; text-decoration: none; text-align: center;">
                                <i class="fa-solid fa-external-link-alt" style="font-size: 20px; margin-bottom: 4px;"></i><br>
                                <small>Ver vídeo externo</small>
                            </a>
                        </div>
                    `;
                }
            }

            container.appendChild(videoElement);
        });
    }

    function getEmbedUrl(url) {
        // YouTube
        const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
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

    // inicialização
    document.addEventListener('DOMContentLoaded', async function(){
        await hydratePreviewData(qParam('preview'));
        const snapshot = loadSnapshot();
        if (!snapshot) return;
        renderProfile(snapshot);
        renderLinks(snapshot);
        renderSegments(snapshot);
        renderGallery(snapshot);
        renderVideos(snapshot);
        // aplicar cores de tema se existirem
        if (snapshot.theme && snapshot.theme.colors) {
            document.documentElement.style.setProperty('--primary-color', snapshot.theme.colors.primary || '');
            document.documentElement.style.setProperty('--text-color', snapshot.theme.colors.text || '');
        }
    });
})();
