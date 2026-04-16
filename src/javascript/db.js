// src/javascript/db.js

const TrilistaDB = (function() {
    const DB_VERSION = 1;
    let refreshInFlight = null;
    const DEFAULT_STORE_NAME = 'Minha Loja Incr\u00edvel';
    const DEFAULT_STORE_BIO = 'Bem-vindo \u00e0 minha loja! Aqui voc\u00ea encontra os melhores produtos.';
    const CORRUPTED_DEFAULT_BIOS = [
        'Bem-vindo Ã  minha loja! Aqui vocÃª encontra os melhores produtos.',
        'Bem-vindo ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  minha loja! Aqui vocÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âª encontra os melhores produtos.',
        'Bem-vindo ÃƒÆ’Ã‚Â  minha loja! Aqui vocÃƒÆ’Ã‚Âª encontra os melhores produtos.'
    ];

    function looksLikeMojibake(value) {
        return typeof value === 'string' && /(?:Ã.|Â.|�)/.test(value);
    }

    function repairMojibake(value) {
        if (!looksLikeMojibake(value)) {
            return value;
        }

        let repaired = value;

        for (let index = 0; index < 2; index += 1) {
            if (!looksLikeMojibake(repaired)) {
                break;
            }

            try {
                repaired = decodeURIComponent(escape(repaired));
            } catch (error) {
                break;
            }
        }

        if (CORRUPTED_DEFAULT_BIOS.includes(repaired) || CORRUPTED_DEFAULT_BIOS.includes(value)) {
            return DEFAULT_STORE_BIO;
        }

        return repaired;
    }

    function sanitizeProfileText(profile) {
        if (!profile || typeof profile !== 'object') {
            return profile;
        }

        const nextProfile = { ...profile };
        let changed = false;

        Object.keys(nextProfile).forEach((key) => {
            if (typeof nextProfile[key] !== 'string') {
                return;
            }

            const repaired = repairMojibake(nextProfile[key]);
            if (repaired !== nextProfile[key]) {
                nextProfile[key] = repaired;
                changed = true;
            }
        });

        return changed ? nextProfile : profile;
    }

    function sanitizeDbText(db) {
        if (!db || typeof db !== 'object' || !db.profile) {
            return { db, changed: false };
        }

        const sanitizedProfile = sanitizeProfileText(db.profile);
        if (sanitizedProfile === db.profile) {
            return { db, changed: false };
        }

        return {
            db: { ...db, profile: sanitizedProfile },
            changed: true
        };
    }

    // Função para obter a chave do banco de dados atual baseada no usuário logado
    function getCurrentDBKey() {
        // 1. Tenta pegar do usuário logado via Auth (prioridade máxima)
        if (window.Auth) {
            const user = Auth.getCurrentUser();
            if (user && user.dbKey) {
                // Se estiver logado, usa a chave do usuário
                return user.dbKey;
            }
        }
        
        // 2. Se não estiver logado, mas estiver no painel, redireciona (isso será tratado no HTML)
        // Por enquanto, retorna null para indicar que não há usuário.
        console.warn('Nenhum usuário logado encontrado para acessar o banco de dados.');
        return null; 
    }

    function getDB(dbKeyOverride = null) {
        const dbKey = dbKeyOverride || getCurrentDBKey();
        
        // Se não houver chave, não podemos acessar o banco. Isso será tratado no painel.html.
        if (!dbKey) {
            throw new Error('Usuário não autenticado. Não é possível acessar o banco de dados.');
        }

        try {
            const raw = localStorage.getItem(dbKey);
            if (raw) {
                const db = JSON.parse(raw);
                if (db._version === DB_VERSION) {
                    const sanitized = sanitizeDbText(db);
                    if (sanitized.changed) {
                        saveDB(sanitized.db, dbKey, { suppressSync: true });
                    }
                    return sanitized.db;
                }
            }
        } catch (e) {
            console.error('Erro ao ler banco de dados:', e);
        }
        if (window.TrilistaSupabaseSync && window.TrilistaSupabaseSync.isConfigured()) {
            const fallbackDb = createDB(dbKey, {
                suppressSync: true,
                markPendingHydration: true
            });

            if (!dbKeyOverride) {
                refreshCurrentStoreFromSupabase().catch((error) => {
                    console.warn('Nao foi possivel restaurar a loja do Supabase antes de usar fallback local:', error.message);
                });
            }

            return fallbackDb;
        }

        return createDB(dbKey);
    }

    async function refreshCurrentStoreFromSupabase() {
        if (!window.TrilistaSupabaseSync || !window.TrilistaSupabaseSync.isConfigured()) {
            return null;
        }

        if (refreshInFlight) {
            return refreshInFlight;
        }

        refreshInFlight = (async function() {
            try {
                await window.TrilistaSupabaseSync.loadCurrentStoreFromSupabase();
                await window.TrilistaSupabaseSync.loadCurrentProfileFromSupabase();
                await window.TrilistaSupabaseSync.loadCurrentThemeFromSupabase();
                await window.TrilistaSupabaseSync.loadCurrentTemplateFromSupabase();
                await window.TrilistaSupabaseSync.loadCurrentLinksFromSupabase();
                await window.TrilistaSupabaseSync.loadCurrentGalleryFromSupabase();
                await window.TrilistaSupabaseSync.loadCurrentVideosFromSupabase();
                return getDB();
            } finally {
                refreshInFlight = null;
            }
        })();

        return refreshInFlight;
    }

    function buildDefaultDB() {
        return {
            _version: DB_VERSION,
            _createdAt: new Date().toISOString(),
            _updatedAt: new Date().toISOString(),
            profile: {
                storeName: 'Minha Loja Incrível',
                bio: 'Bem-vindo à minha loja! Aqui você encontra os melhores produtos.',
                profilePhoto: null,
                coverPhoto: null,
                showViewCounter: false,
                // category selections
                categoria1: '',
                categoria2: '',
                categoria3: '',
                categoria4: ''
            },
            theme: {
                name: 'default',
                colors: {
                    primary: '#667eea',
                    secondary: '#764ba2',
                    text: '#2d3748'
                },
                font: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            template: {
                name: 'classico'
            },
            links: [],
            gallery: [],
            pix: {
                enabled: false,
                keyType: null,
                keyValue: null
            },
            stats: {
                views: 0,
                lastView: null
            },
            videos: []
        };
    }

    function createDB(dbKey, options = {}) {
        const db = buildDefaultDB();
        if (db.profile) {
            db.profile.storeName = DEFAULT_STORE_NAME;
            db.profile.bio = DEFAULT_STORE_BIO;
        }
        if (options.markPendingHydration) {
            db._pendingRemoteHydration = true;
        }
        saveDB(db, dbKey, { suppressSync: Boolean(options.suppressSync) });
        return db;
    }

    function recordView(dbKey = null) {
        try {
            const key = dbKey || getCurrentDBKey();
            if (!key) return false;

            const db = getDB(key);
            if (!db) return false;

            if (!db.stats) {
                db.stats = { views: 0, lastView: null };
            }

            db.stats.views = (db.stats.views || 0) + 1;
            db.stats.lastView = new Date().toISOString();

            const saved = saveDB(db, key);
            if (!saved) return false;

            const currentUser = window.Auth && typeof Auth.getCurrentUser === 'function'
                ? Auth.getCurrentUser()
                : null;
            const shouldSyncPublicView = !currentUser || currentUser.dbKey !== key;

            if (shouldSyncPublicView && window.TrilistaSupabaseSync && window.TrilistaSupabaseSync.isConfigured()) {
                window.TrilistaSupabaseSync.incrementStoreViewByDbKey(key).catch((error) => {
                    console.warn('Nao foi possivel sincronizar visualizacao no Supabase:', error.message);
                });
            }

            return true;
        } catch (e) {
            console.error('Erro ao registrar visualização:', e);
            return false;
        }
    }

    function getStats() {
        try {
            const db = getDB();
            return db.stats || { views: 0, lastView: null };
        } catch (e) {
            console.error('Erro ao obter estatísticas:', e);
            return { views: 0, lastView: null };
        }
    }

    function saveDB(db, dbKey = null, options = {}) {
        try {
            const key = dbKey || getCurrentDBKey();
            if (!key) {
                console.error('Não é possível salvar: usuário não autenticado');
                return false;
            }
            if (!options.suppressSync && db && db._pendingRemoteHydration) {
                delete db._pendingRemoteHydration;
            }
            db._updatedAt = new Date().toISOString();
            localStorage.setItem(key, JSON.stringify(db));
            if (!options.suppressSync) {
                window.dispatchEvent(new CustomEvent('trilista:db-saved', {
                    detail: {
                        dbKey: key,
                        data: JSON.parse(JSON.stringify(db))
                    }
                }));
            }
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                alert('Espaço de armazenamento esgotado. Remova algumas imagens da galeria.');
            } else {
                console.error('Erro ao salvar banco de dados:', e);
            }
            return false;
        }
    }

    function getTable(tableName) {
        try {
            const db = getDB();
            return db[tableName] !== undefined ? JSON.parse(JSON.stringify(db[tableName])) : null;
        } catch (e) {
            console.error('Erro ao acessar tabela:', e);
            return null;
        }
    }

    function setTable(tableName, data) {
        try {
            const db = getDB();
            // Permite criar a tabela se ela não existir
            db[tableName] = data;
            return saveDB(db);
        } catch (e) {
            console.error('Erro ao salvar tabela:', e);
            return false;
        }
    }

    function updateTable(tableName, updates) {
        try {
            const db = getDB();
            if (db[tableName] === undefined || typeof db[tableName] !== 'object' || Array.isArray(db[tableName])) return false;
            Object.assign(db[tableName], updates);
            return saveDB(db);
        } catch (e) {
            console.error('Erro ao atualizar tabela:', e);
            return false;
        }
    }

    function getProfile() { 
        try {
            return getTable('profile'); 
        } catch (e) {
            console.error('Erro ao acessar perfil:', e);
            return null;
        }
    }
    
    function saveProfile(data) { 
        try {
            return updateTable('profile', sanitizeProfileText(data)); 
        } catch (e) {
            console.error('Erro ao salvar perfil:', e);
            return false;
        }
    }

    function getTheme() { 
        try {
            return getTable('theme'); 
        } catch (e) {
            console.error('Erro ao acessar tema:', e);
            return null;
        }
    }
    
    function saveThemeData(data) { 
        try {
            return setTable('theme', data); 
        } catch (e) {
            console.error('Erro ao salvar tema:', e);
            return false;
        }
    }

    function getTemplate() { 
        try {
            return getTable('template'); 
        } catch (e) {
            console.error('Erro ao acessar template:', e);
            return null;
        }
    }
    
    function saveTemplate(data) { 
        try {
            return setTable('template', data); 
        } catch (e) {
            console.error('Erro ao salvar template:', e);
            return false;
        }
    }

    function getLinks() { 
        try {
            return getTable('links') || []; 
        } catch (e) {
            console.error('Erro ao acessar links:', e);
            return [];
        }
    }
    
    function saveLinks(arr) { 
        try {
            return setTable('links', arr); 
        } catch (e) {
            console.error('Erro ao salvar links:', e);
            return false;
        }
    }

    function addLink(link) {
        try {
            const links = getLinks();
            link.id = Date.now();
            link.createdAt = new Date().toISOString();
            links.push(link);
            return saveLinks(links) ? link : null;
        } catch (e) {
            console.error('Erro ao adicionar link:', e);
            return null;
        }
    }

    function updateLink(id, updates) {
        try {
            const links = getLinks();
            const i = links.findIndex(l => l.id === id);
            if (i === -1) return false;
            Object.assign(links[i], updates);
            return saveLinks(links);
        } catch (e) {
            console.error('Erro ao atualizar link:', e);
            return false;
        }
    }

    function deleteLink(id) {
        try {
            const links = getLinks();
            return saveLinks(links.filter(l => l.id !== id));
        } catch (e) {
            console.error('Erro ao deletar link:', e);
            return false;
        }
    }

    function getGallery() { 
        try {
            return getTable('gallery') || []; 
        } catch (e) {
            console.error('Erro ao acessar galeria:', e);
            return [];
        }
    }
    
    function saveGallery(images) { 
        try {
            return setTable('gallery', images); 
        } catch (e) {
            console.error('Erro ao salvar galeria:', e);
            return false;
        }
    }

    function addGalleryImage(image) {
        try {
            const gallery = getGallery();
            image.id = Date.now() + Math.random();
            image.createdAt = new Date().toISOString();
            gallery.unshift(image);
            return saveGallery(gallery) ? image : null;
        } catch (e) {
            console.error('Erro ao adicionar imagem:', e);
            return null;
        }
    }

    function deleteGalleryImage(id) {
        try {
            const gallery = getGallery();
            return saveGallery(gallery.filter(img => img.id !== id));
        } catch (e) {
            console.error('Erro ao deletar imagem:', e);
            return false;
        }
    }

    function reorderGallery(fromIndex, toIndex) {
        try {
            const gallery = getGallery();
            if (fromIndex < 0 || fromIndex >= gallery.length || toIndex < 0 || toIndex >= gallery.length) return false;
            const [item] = gallery.splice(fromIndex, 1);
            gallery.splice(toIndex, 0, item);
            return saveGallery(gallery);
        } catch (e) {
            console.error('Erro ao reordenar galeria:', e);
            return false;
        }
    }

    function getPix() { 
        try {
            return getTable('pix'); 
        } catch (e) {
            console.error('Erro ao acessar pix:', e);
            return null;
        }
    }
    
    function savePix(data) { 
        try {
            return updateTable('pix', data); 
        } catch (e) {
            console.error('Erro ao salvar pix:', e);
            return false;
        }
    }

    function getVideos() { 
        try {
            return getTable('videos') || []; 
        } catch (e) {
            console.error('Erro ao acessar vídeos:', e);
            return [];
        }
    }
    
    function saveVideos(videos) { 
        try {
            return setTable('videos', videos); 
        } catch (e) {
            console.error('Erro ao salvar vídeos:', e);
            return false;
        }
    }

    function getStorageUsage() {
        try {
            const dbKey = getCurrentDBKey();
            if (!dbKey) return { bytes: 0, kb: '0', mb: '0', percentage: '0' };
            
            const raw = localStorage.getItem(dbKey) || '';
            const bytes = new Blob([raw]).size;
            return {
                bytes: bytes,
                kb: (bytes / 1024).toFixed(1),
                mb: (bytes / (1024 * 1024)).toFixed(2),
                percentage: ((bytes / (5 * 1024 * 1024)) * 100).toFixed(1)
            };
        } catch (e) {
            console.error('Erro ao calcular uso de armazenamento:', e);
            return { bytes: 0, kb: '0', mb: '0', percentage: '0' };
        }
    }

    function exportDB() {
        try {
            const db = getDB();
            const storeName = (db?.profile?.storeName || 'minha-loja')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .toLowerCase();
            const exportDate = new Date().toISOString().slice(0,10);
            const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${storeName}_backup_${exportDate}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Erro ao exportar banco:', e);
            alert('Erro ao exportar backup.');
        }
    }

    function importDB(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data._version) {
                        const dbKey = getCurrentDBKey();
                        if (!dbKey) {
                            reject('Usuário não autenticado.');
                            return;
                        }
                        saveDB(data, dbKey);
                        resolve(true);
                    } else {
                        reject('Arquivo de backup inválido.');
                    }
                } catch (err) {
                    reject('Erro ao ler arquivo: ' + err.message);
                }
            };
            reader.onerror = function() { reject('Erro ao ler arquivo.'); };
            reader.readAsText(file);
        });
    }

    function resetDB() {
        try {
            const dbKey = getCurrentDBKey();
            if (!dbKey) return null;
            
            localStorage.removeItem(dbKey);
            return createDB(dbKey);
        } catch (e) {
            console.error('Erro ao resetar banco:', e);
            return null;
        }
    }

    function getDBRaw(key = null) {
        try {
            // Se uma chave for passada, tenta carregar especificamente essa loja
            if (key) {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const db = JSON.parse(raw);
                    return db;
                }
                return null;
            }
            // Caso contrário, segue o fluxo normal do usuário logado
            return getDB();
        } catch (e) {
            console.error('Erro ao acessar banco:', e);
            return null;
        }
    }

    function getUsers() {
        try {
            const raw = localStorage.getItem('trilista_users');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Erro ao acessar usuários:', e);
            return [];
        }
    }

    function getContactCardData(key = null) {
        try {
            const dbKey = key || getCurrentDBKey();
            if (!dbKey) return null;

            const db = getDBRaw(dbKey);
            if (!db) return null;

            const profile = db.profile || {};
            const links = Array.isArray(db.links) ? db.links : [];
            const users = getUsers();
            const user = users.find(item => item.dbKey === dbKey) || null;

            const phoneLink = links.find(link => link && (link.type === 'telefone' || link.type === 'whatsapp') && link.value);
            const emailLink = links.find(link => link && link.type === 'email' && link.value);

            const addressParts = [];
            if (profile.address) addressParts.push(profile.address);
            if (profile.neighborhood) addressParts.push(profile.neighborhood);
            if (profile.city) addressParts.push(profile.city);

            const phone = phoneLink ? String(phoneLink.value).trim() : '';
            const email = emailLink ? String(emailLink.value).trim() : (user?.email || '').trim();
            const address = addressParts.join(', ').trim();
            const name = (profile.storeName || user?.nomeEmpresa || 'Minha Loja').trim();

            return {
                name,
                phone,
                email,
                address,
                hasMinimumData: Boolean(name && (phone || email || address))
            };
        } catch (e) {
            console.error('Erro ao montar dados do contato:', e);
            return null;
        }
    }

    return {
        getProfile, saveProfile,
        getTheme, saveThemeData,
        getTemplate, saveTemplate,
        getLinks, saveLinks, addLink, updateLink, deleteLink,
        getGallery, saveGallery, addGalleryImage, deleteGalleryImage, reorderGallery,
        getPix, savePix,
        getVideos, saveVideos,
        refreshCurrentStoreFromSupabase,
        getStorageUsage, exportDB, importDB, resetDB,
        recordView, getStats,
        getDB: getDBRaw,
        getCurrentDBKey,
        getContactCardData
    };
})();

// Exportar para uso global
window.TrilistaDB = TrilistaDB;

document.addEventListener('DOMContentLoaded', function() {
    if (window.TrilistaSupabaseSync && window.TrilistaSupabaseSync.isConfigured()) {
        TrilistaDB.refreshCurrentStoreFromSupabase().catch((error) => {
            console.warn('Nao foi possivel atualizar a leitura inicial do banco via Supabase:', error.message);
        });
    }
});

window.addEventListener('focus', function() {
    if (window.TrilistaSupabaseSync && window.TrilistaSupabaseSync.isConfigured()) {
        TrilistaDB.refreshCurrentStoreFromSupabase().catch(() => {});
    }
});
