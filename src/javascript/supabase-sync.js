const TrilistaSupabaseSync = (function() {
    const USERS_KEY = 'trilista_users';
    const CURRENT_USER_KEY = 'trilista_current_user';

    function isConfigured() {
        return Boolean(window.TrilistaSupabase && window.TrilistaSupabase.isConfigured());
    }

    function getClient() {
        return window.TrilistaSupabase ? window.TrilistaSupabase.client : null;
    }

    function getLocalUsers() {
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
        } catch (error) {
            console.error('Erro ao ler usuarios locais:', error);
            return [];
        }
    }

    function setLocalUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
        } catch (error) {
            console.error('Erro ao ler usuario atual:', error);
            return null;
        }
    }

    function getLocalStore(dbKey) {
        if (!dbKey) return null;

        try {
            const raw = localStorage.getItem(dbKey);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error('Erro ao ler loja local:', error);
            return null;
        }
    }

    function saveLocalStore(dbKey, data) {
        if (!dbKey || !data) return;
        if (data._pendingRemoteHydration) {
            delete data._pendingRemoteHydration;
        }
        localStorage.setItem(dbKey, JSON.stringify(data));
    }

    function readTimestamp(value) {
        if (!value) return 0;

        const parsed = new Date(value).getTime();
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function shouldApplyRemoteStore(dbKey, remoteData, remoteUpdatedAt) {
        const localStore = getLocalStore(dbKey);
        if (!localStore) return true;

        const localUpdatedAt = readTimestamp(localStore._updatedAt);
        const remoteTimestamp = readTimestamp(remoteUpdatedAt || remoteData?._updatedAt);

        if (!remoteTimestamp) return true;
        return remoteTimestamp >= localUpdatedAt;
    }

    function hasKnownBoolean(value) {
        return value === true || value === false;
    }

    function localToRemoteUser(user) {
        const normalizedCreatedBy = Number.isFinite(Number(user.createdBy))
            ? Number(user.createdBy)
            : null;

        return {
            id: user.id,
            nome_empresa: user.nomeEmpresa,
            nome_responsavel: user.nomeResponsavel,
            email: user.email,
            password_hash: user.passwordHash || user.senha_hash || user.password_hash || null,
            google_id: user.googleId || user.google_id || null,
            role: user.role || 'user',
            status: user.status || 'active',
            force_password_change: Boolean(user.forcePasswordChange || user.force_password_change),
            created_by: normalizedCreatedBy,
            db_key: user.dbKey,
            created_at: user.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    function remoteToLocalUser(user) {
        return {
            id: user.id,
            nomeEmpresa: user.nome_empresa,
            nomeResponsavel: user.nome_responsavel,
            email: user.email,
            passwordHash: user.password_hash || user.senha_hash || '',
            googleId: user.google_id || null,
            role: user.role || 'user',
            status: user.status || 'active',
            forcePasswordChange: Boolean(user.force_password_change),
            createdBy: user.created_by || 'system',
            dbKey: user.db_key,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        };
    }

    function toSafeTextId(value, fallbackPrefix, index) {
        if (value === null || value === undefined || value === '') {
            return `${fallbackPrefix}-${index}`;
        }
        return String(value);
    }

    function toScopedTextId(userId, value, fallbackPrefix, index) {
        const baseId = toSafeTextId(value, fallbackPrefix, index);
        return `${userId}-${baseId}`;
    }

    function sanitizeGalleryItem(item) {
        if (!item || typeof item !== 'object') return {};

        return {
            id: item.id ?? null,
            createdAt: item.createdAt ?? null,
            name: item.name ?? null,
            size: item.size ?? null,
            originalSize: item.originalSize ?? null,
            reduction: item.reduction ?? null,
            uploaded: item.uploaded ?? null,
            caption: item.caption ?? null,
            alt: item.alt ?? null
        };
    }

    function normalizeTimestamp(value) {
        if (!value) return new Date().toISOString();

        if (typeof value === 'number') {
            return new Date(value).toISOString();
        }

        const asNumber = Number(value);
        if (Number.isFinite(asNumber) && String(value).trim() !== '') {
            return new Date(asNumber).toISOString();
        }

        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString();
        }

        return new Date().toISOString();
    }

    function chunkArray(items, chunkSize) {
        const chunks = [];
        for (let i = 0; i < items.length; i += chunkSize) {
            chunks.push(items.slice(i, i + chunkSize));
        }
        return chunks;
    }

    async function syncRows(table, matchColumn, matchValue, rows, options = {}) {
        if (!isConfigured()) return;

        const client = getClient();
        const conflictColumn = options.conflictColumn || 'id';
        const chunkSize = options.chunkSize || 25;

        const { data: existingRows, error: selectError } = await client
            .from(table)
            .select(conflictColumn)
            .eq(matchColumn, matchValue);

        if (selectError) throw selectError;

        const existingIds = new Set((existingRows || []).map((row) => String(row[conflictColumn])));
        const incomingIds = new Set(rows.map((row) => String(row[conflictColumn])));

        if (rows.length) {
            const chunks = chunkArray(rows, chunkSize);
            for (const chunk of chunks) {
                const { error: upsertError } = await client
                    .from(table)
                    .upsert(chunk, { onConflict: conflictColumn });

                if (upsertError) throw upsertError;
            }
        }

        const staleIds = Array.from(existingIds).filter((id) => !incomingIds.has(id));
        if (!staleIds.length) return;

        const deleteChunks = chunkArray(staleIds, 100);
        for (const deleteChunk of deleteChunks) {
            const { error: deleteError } = await client
                .from(table)
                .delete()
                .in(conflictColumn, deleteChunk);

            if (deleteError) throw deleteError;
        }
    }

    async function upsertUser(user) {
        if (!isConfigured() || !user) return null;

        const payload = localToRemoteUser(user);

        const { data, error } = await getClient()
            .from('app_users')
            .upsert(payload, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async function deleteUser(userId) {
        if (!isConfigured()) return;

        const { error } = await getClient()
            .from('app_users')
            .delete()
            .eq('id', userId);

        if (error) throw error;
    }

    async function upsertStorePage(userId, dbKey, data) {
        if (!isConfigured() || !userId || !dbKey || !data) return null;

        const payload = {
            user_id: userId,
            db_key: dbKey,
            data,
            updated_at: new Date().toISOString()
        };

        const { data: saved, error } = await getClient()
            .from('store_pages')
            .upsert(payload, { onConflict: 'db_key' })
            .select()
            .single();

        if (error) throw error;
        return saved;
    }

    async function syncNormalizedStoreData(userId, dbKey, data) {
        if (!isConfigured() || !userId || !dbKey || !data) return;

        const profile = data.profile || {};
        const theme = data.theme || {};
        const template = data.template || {};
        const pix = data.pix || {};
        const links = Array.isArray(data.links) ? data.links : [];
        const gallery = Array.isArray(data.gallery) ? data.gallery : [];
        const videos = Array.isArray(data.videos) ? data.videos : [];

        const client = getClient();

        const profilePayload = {
            user_id: userId,
            db_key: dbKey,
            store_name: profile.storeName || null,
            bio: profile.bio || null,
            profile_photo: profile.profilePhoto || null,
            cover_photo: profile.coverPhoto || null,
            show_view_counter: Boolean(profile.showViewCounter),
            categoria1: profile.categoria1 || null,
            categoria2: profile.categoria2 || null,
            categoria3: profile.categoria3 || null,
            categoria4: profile.categoria4 || null,
            address: profile.address || null,
            neighborhood: profile.neighborhood || null,
            city: profile.city || null,
            updated_at: new Date().toISOString()
        };

        const themePayload = {
            user_id: userId,
            db_key: dbKey,
            name: theme.name || null,
            primary_color: theme.colors?.primary || null,
            secondary_color: theme.colors?.secondary || null,
            text_color: theme.colors?.text || null,
            font: theme.font || null,
            raw_data: theme,
            updated_at: new Date().toISOString()
        };

        const templatePayload = {
            user_id: userId,
            db_key: dbKey,
            name: template.name || null,
            raw_data: template,
            updated_at: new Date().toISOString()
        };

        const pixPayload = {
            user_id: userId,
            db_key: dbKey,
            enabled: Boolean(pix.enabled),
            key_type: pix.keyType || null,
            key_value: pix.keyValue || null,
            raw_data: pix,
            updated_at: new Date().toISOString()
        };

        const linkRows = links.map((link, index) => ({
            id: Number.isFinite(Number(link.id)) ? Number(link.id) : Date.now() + index,
            user_id: userId,
            db_key: dbKey,
            type: link.type || null,
            label: link.label || null,
            title: link.title || null,
            value: link.value || null,
            url: link.url || null,
            icon: link.icon || null,
            position: index,
            active: link.active !== false,
            raw_data: link,
            created_at: link.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));

        const galleryRows = gallery.map((item, index) => ({
            id: toScopedTextId(userId, item.id, `gallery-${userId}`, index),
            user_id: userId,
            db_key: dbKey,
            image_url: item.data || item.url || item.src || item.imageUrl || null,
            caption: item.caption || item.title || null,
            alt_text: item.alt || null,
            position: index,
            raw_data: sanitizeGalleryItem(item),
            created_at: normalizeTimestamp(item.createdAt),
            updated_at: new Date().toISOString()
        }));

        const videoRows = videos.map((item, index) => ({
            id: toScopedTextId(userId, item.id, `video-${userId}`, index),
            user_id: userId,
            db_key: dbKey,
            title: item.title || null,
            url: item.url || item.value || null,
            thumbnail: item.thumbnail || null,
            position: index,
            raw_data: item,
            created_at: normalizeTimestamp(item.createdAt),
            updated_at: new Date().toISOString()
        }));

        let profileResult = client.from('store_profiles').upsert(profilePayload, { onConflict: 'user_id' });
        const themeResult = client.from('store_themes').upsert(themePayload, { onConflict: 'user_id' });
        const templateResult = client.from('store_templates').upsert(templatePayload, { onConflict: 'user_id' });
        const pixResult = client.from('store_pix_settings').upsert(pixPayload, { onConflict: 'user_id' });

        let results = await Promise.all([profileResult, themeResult, templateResult, pixResult]);
        if (results[0]?.error && String(results[0].error.message || '').includes('show_view_counter')) {
            const legacyProfilePayload = { ...profilePayload };
            delete legacyProfilePayload.show_view_counter;

            profileResult = client.from('store_profiles').upsert(legacyProfilePayload, { onConflict: 'user_id' });
            results = await Promise.all([profileResult, themeResult, templateResult, pixResult]);
        }

        for (const result of results) {
            if (result.error) throw result.error;
        }

        await syncRows('store_links', 'user_id', userId, linkRows, { conflictColumn: 'id', chunkSize: 25 });
        await syncRows('store_gallery_items', 'user_id', userId, galleryRows, { conflictColumn: 'id', chunkSize: 1 });
        await syncRows('store_videos', 'user_id', userId, videoRows, { conflictColumn: 'id', chunkSize: 2 });
    }

    async function syncCurrentGallery(gallery) {
        if (!isConfigured()) return;

        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.dbKey) return;

        const galleryItems = Array.isArray(gallery) ? gallery : [];
        const galleryRows = galleryItems.map((item, index) => ({
            id: toScopedTextId(currentUser.id, item.id, `gallery-${currentUser.id}`, index),
            user_id: currentUser.id,
            db_key: currentUser.dbKey,
            image_url: item.data || item.url || item.src || item.imageUrl || null,
            caption: item.caption || item.title || null,
            alt_text: item.alt || null,
            position: index,
            raw_data: sanitizeGalleryItem(item),
            created_at: normalizeTimestamp(item.createdAt),
            updated_at: new Date().toISOString()
        }));

        await syncRows('store_gallery_items', 'user_id', currentUser.id, galleryRows, { conflictColumn: 'id', chunkSize: 1 });
    }

    async function loadCurrentVideosFromSupabase() {
        if (!isConfigured()) return [];

        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.dbKey) return [];

        const { data, error } = await getClient()
            .from('store_videos')
            .select('*')
            .eq('db_key', currentUser.dbKey)
            .order('position', { ascending: true });

        if (error) throw error;

        const currentStore = getLocalStore(currentUser.dbKey) || {};
        currentStore.videos = (data || []).map((item) => ({
            ...(item.raw_data || {}),
            id: item.id,
            title: item.title || item.raw_data?.title || null,
            caption: item.raw_data?.caption || item.title || null,
            url: item.url || item.raw_data?.url || item.raw_data?.value || null,
            value: item.url || item.raw_data?.value || item.raw_data?.url || null,
            thumbnail: item.thumbnail || item.raw_data?.thumbnail || null,
            data: item.raw_data?.data || null,
            type: item.raw_data?.type || (item.raw_data?.data ? 'upload' : 'link'),
            uploadedAt: item.raw_data?.uploadedAt || item.created_at || null,
            createdAt: item.created_at || item.raw_data?.createdAt || null,
            expiresAt: item.raw_data?.expiresAt || null,
            duration: item.raw_data?.duration || null
        }));

        saveLocalStore(currentUser.dbKey, currentStore);
        window.dispatchEvent(new CustomEvent('trilista:videos-loaded', {
            detail: {
                dbKey: currentUser.dbKey,
                videos: currentStore.videos
            }
        }));
        return currentStore.videos;
    }

    async function syncCurrentVideos(videos) {
        if (!isConfigured()) return;

        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.dbKey) return;

        const videoItems = Array.isArray(videos) ? videos : [];
        const videoRows = videoItems.map((item, index) => ({
            id: toScopedTextId(currentUser.id, item.id, `video-${currentUser.id}`, index),
            user_id: currentUser.id,
            db_key: currentUser.dbKey,
            title: item.caption || item.title || null,
            url: item.url || item.value || null,
            thumbnail: item.thumbnail || null,
            position: index,
            raw_data: item,
            created_at: normalizeTimestamp(item.createdAt || item.uploadedAt),
            updated_at: new Date().toISOString()
        }));

        await syncRows('store_videos', 'user_id', currentUser.id, videoRows, { conflictColumn: 'id', chunkSize: 1 });
    }

    async function loadUsersFromSupabase() {
        if (!isConfigured()) return [];

        const { data, error } = await getClient()
            .from('app_users')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        const users = (data || []).map(remoteToLocalUser);
        if (users.length) {
            setLocalUsers(users);
        }
        return users;
    }

    async function loadCurrentStoreFromSupabase() {
        if (!isConfigured()) return null;

        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.dbKey) return null;

        const { data, error } = await getClient()
            .from('store_pages')
            .select('data, updated_at')
            .eq('db_key', currentUser.dbKey)
            .maybeSingle();

        if (error) throw error;
        if (data && data.data && shouldApplyRemoteStore(currentUser.dbKey, data.data, data.updated_at)) {
            localStorage.setItem(currentUser.dbKey, JSON.stringify(data.data));
            return data.data;
        }

        return getLocalStore(currentUser.dbKey);
    }

    async function loadStoreByDbKeyFromSupabase(dbKey) {
        if (!isConfigured() || !dbKey) return null;

        const { data: pageRow, error: pageError } = await getClient()
            .from('store_pages')
            .select('data')
            .eq('db_key', dbKey)
            .maybeSingle();

        if (pageError) throw pageError;

        const localStore = pageRow && pageRow.data ? pageRow.data : {};

        const [
            profileResult,
            themeResult,
            templateResult,
            linksResult,
            galleryResult,
            videosResult,
            pixResult
        ] = await Promise.all([
            getClient().from('store_profiles').select('*').eq('db_key', dbKey).maybeSingle(),
            getClient().from('store_themes').select('*').eq('db_key', dbKey).maybeSingle(),
            getClient().from('store_templates').select('*').eq('db_key', dbKey).maybeSingle(),
            getClient().from('store_links').select('*').eq('db_key', dbKey).order('position', { ascending: true }),
            getClient().from('store_gallery_items').select('*').eq('db_key', dbKey).order('position', { ascending: true }),
            getClient().from('store_videos').select('*').eq('db_key', dbKey).order('position', { ascending: true }),
            getClient().from('store_pix_settings').select('*').eq('db_key', dbKey).maybeSingle()
        ]);

        const results = [profileResult, themeResult, templateResult, linksResult, galleryResult, videosResult, pixResult];
        for (const result of results) {
            if (result.error) throw result.error;
        }

        localStore.profile = {
            ...(localStore.profile || {}),
            ...(profileResult.data ? {
                storeName: profileResult.data.store_name || '',
                bio: profileResult.data.bio || '',
                profilePhoto: profileResult.data.profile_photo || null,
                coverPhoto: profileResult.data.cover_photo || null,
                showViewCounter: hasKnownBoolean(profileResult.data.show_view_counter)
                    ? profileResult.data.show_view_counter
                    : localStore.profile?.showViewCounter,
                categoria1: profileResult.data.categoria1 || '',
                categoria2: profileResult.data.categoria2 || '',
                categoria3: profileResult.data.categoria3 || '',
                categoria4: profileResult.data.categoria4 || '',
                address: profileResult.data.address || '',
                neighborhood: profileResult.data.neighborhood || '',
                city: profileResult.data.city || ''
            } : {})
        };

        if (themeResult.data) {
            localStore.theme = {
                ...(localStore.theme || {}),
                ...(themeResult.data.raw_data || {}),
                name: themeResult.data.name || localStore.theme?.name || 'default',
                colors: {
                    ...(localStore.theme?.colors || {}),
                    ...((themeResult.data.raw_data && themeResult.data.raw_data.colors) || {}),
                    primary: themeResult.data.primary_color || themeResult.data.raw_data?.colors?.primary || localStore.theme?.colors?.primary || '#667eea',
                    secondary: themeResult.data.secondary_color || themeResult.data.raw_data?.colors?.secondary || localStore.theme?.colors?.secondary || '#764ba2',
                    text: themeResult.data.text_color || themeResult.data.raw_data?.colors?.text || localStore.theme?.colors?.text || '#2d3748'
                },
                font: themeResult.data.font || themeResult.data.raw_data?.font || localStore.theme?.font || "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            };
        }

        if (templateResult.data) {
            localStore.template = {
                ...(localStore.template || {}),
                ...(templateResult.data.raw_data || {}),
                name: templateResult.data.name || templateResult.data.raw_data?.name || localStore.template?.name || 'classico'
            };
        }

        localStore.links = (linksResult.data || []).map((item) => ({
            ...(item.raw_data || {}),
            id: item.id,
            type: item.type || item.raw_data?.type || 'custom',
            label: item.label || item.raw_data?.label || null,
            title: item.title || item.raw_data?.title || null,
            value: item.value || item.raw_data?.value || '',
            url: item.url || item.raw_data?.url || null,
            icon: item.icon || item.raw_data?.icon || null,
            active: item.active !== false,
            createdAt: item.created_at || item.raw_data?.createdAt || null
        }));

        localStore.gallery = (galleryResult.data || []).map((item) => ({
            ...(item.raw_data || {}),
            id: item.id,
            data: item.image_url || item.raw_data?.data || item.raw_data?.url || item.raw_data?.src || item.raw_data?.imageUrl || null,
            url: item.image_url || item.raw_data?.url || item.raw_data?.data || item.raw_data?.src || item.raw_data?.imageUrl || null,
            imageUrl: item.image_url || item.raw_data?.imageUrl || item.raw_data?.data || item.raw_data?.url || item.raw_data?.src || null,
            src: item.image_url || item.raw_data?.src || item.raw_data?.data || item.raw_data?.url || item.raw_data?.imageUrl || null,
            caption: item.caption || item.raw_data?.caption || item.raw_data?.title || null,
            alt: item.alt_text || item.raw_data?.alt || null,
            createdAt: item.created_at || item.raw_data?.createdAt || null
        }));

        localStore.videos = (videosResult.data || []).map((item) => ({
            ...(item.raw_data || {}),
            id: item.id,
            title: item.title || item.raw_data?.title || null,
            caption: item.raw_data?.caption || item.title || null,
            url: item.url || item.raw_data?.url || item.raw_data?.value || null,
            value: item.url || item.raw_data?.value || item.raw_data?.url || null,
            thumbnail: item.thumbnail || item.raw_data?.thumbnail || null,
            data: item.raw_data?.data || null,
            type: item.raw_data?.type || (item.raw_data?.data ? 'upload' : 'link'),
            uploadedAt: item.raw_data?.uploadedAt || item.created_at || null,
            createdAt: item.created_at || item.raw_data?.createdAt || null,
            expiresAt: item.raw_data?.expiresAt || null,
            duration: item.raw_data?.duration || null
        }));

        if (pixResult.data) {
            localStore.pix = {
                ...(localStore.pix || {}),
                ...(pixResult.data.raw_data || {}),
                enabled: Boolean(pixResult.data.enabled),
                keyType: pixResult.data.key_type || pixResult.data.raw_data?.keyType || null,
                keyValue: pixResult.data.key_value || pixResult.data.raw_data?.keyValue || null
            };
        }

        localStorage.setItem(dbKey, JSON.stringify(localStore));
        return localStore;
    }

    async function incrementStoreViewByDbKey(dbKey) {
        if (!isConfigured() || !dbKey) return null;

        const { data: pageRow, error } = await getClient()
            .from('store_pages')
            .select('data')
            .eq('db_key', dbKey)
            .maybeSingle();

        if (error) throw error;

        const storeData = pageRow && pageRow.data ? pageRow.data : {};
        const stats = storeData.stats && typeof storeData.stats === 'object'
            ? storeData.stats
            : { views: 0, lastView: null };

        const nextData = {
            ...storeData,
            stats: {
                ...stats,
                views: Number(stats.views || 0) + 1,
                lastView: new Date().toISOString()
            }
        };

        const { error: updateError } = await getClient()
            .from('store_pages')
            .update({
                data: nextData,
                updated_at: new Date().toISOString()
            })
            .eq('db_key', dbKey);

        if (updateError) throw updateError;

        localStorage.setItem(dbKey, JSON.stringify(nextData));
        return nextData.stats;
    }

    async function loadCurrentProfileFromSupabase() {
        if (!isConfigured()) return null;

        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.dbKey) return null;

        const { data, error } = await getClient()
            .from('store_profiles')
            .select('*')
            .eq('db_key', currentUser.dbKey)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        const currentStore = getLocalStore(currentUser.dbKey) || {};
        currentStore.profile = {
            ...(currentStore.profile || {}),
            storeName: data.store_name || '',
            bio: data.bio || '',
            profilePhoto: data.profile_photo || null,
            coverPhoto: data.cover_photo || null,
            showViewCounter: hasKnownBoolean(data.show_view_counter)
                ? data.show_view_counter
                : currentStore.profile?.showViewCounter,
            categoria1: data.categoria1 || '',
            categoria2: data.categoria2 || '',
            categoria3: data.categoria3 || '',
            categoria4: data.categoria4 || '',
            address: data.address || '',
            neighborhood: data.neighborhood || '',
            city: data.city || ''
        };

        saveLocalStore(currentUser.dbKey, currentStore);
        return currentStore.profile;
    }

    async function loadCurrentThemeFromSupabase() {
        if (!isConfigured()) return null;

        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.dbKey) return null;

        const { data, error } = await getClient()
            .from('store_themes')
            .select('*')
            .eq('db_key', currentUser.dbKey)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        const currentStore = getLocalStore(currentUser.dbKey) || {};
        currentStore.theme = {
            ...(currentStore.theme || {}),
            ...(data.raw_data || {}),
            name: data.name || currentStore.theme?.name || 'default',
            colors: {
                ...(currentStore.theme?.colors || {}),
                ...((data.raw_data && data.raw_data.colors) || {}),
                primary: data.primary_color || data.raw_data?.colors?.primary || currentStore.theme?.colors?.primary || '#667eea',
                secondary: data.secondary_color || data.raw_data?.colors?.secondary || currentStore.theme?.colors?.secondary || '#764ba2',
                text: data.text_color || data.raw_data?.colors?.text || currentStore.theme?.colors?.text || '#2d3748'
            },
            font: data.font || data.raw_data?.font || currentStore.theme?.font || "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        };

        saveLocalStore(currentUser.dbKey, currentStore);
        return currentStore.theme;
    }

    async function loadCurrentTemplateFromSupabase() {
        if (!isConfigured()) return null;

        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.dbKey) return null;

        const { data, error } = await getClient()
            .from('store_templates')
            .select('*')
            .eq('db_key', currentUser.dbKey)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        const currentStore = getLocalStore(currentUser.dbKey) || {};
        currentStore.template = {
            ...(currentStore.template || {}),
            ...(data.raw_data || {}),
            name: data.name || data.raw_data?.name || currentStore.template?.name || 'classico'
        };

        saveLocalStore(currentUser.dbKey, currentStore);
        return currentStore.template;
    }

    async function loadCurrentLinksFromSupabase() {
        if (!isConfigured()) return [];

        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.dbKey) return [];

        const { data, error } = await getClient()
            .from('store_links')
            .select('*')
            .eq('db_key', currentUser.dbKey)
            .order('position', { ascending: true });

        if (error) throw error;

        const currentStore = getLocalStore(currentUser.dbKey) || {};
        currentStore.links = (data || []).map((item) => ({
            ...(item.raw_data || {}),
            id: item.id,
            type: item.type || item.raw_data?.type || 'custom',
            label: item.label || item.raw_data?.label || null,
            title: item.title || item.raw_data?.title || null,
            value: item.value || item.raw_data?.value || '',
            url: item.url || item.raw_data?.url || null,
            icon: item.icon || item.raw_data?.icon || null,
            active: item.active !== false,
            createdAt: item.created_at || item.raw_data?.createdAt || null
        }));

        saveLocalStore(currentUser.dbKey, currentStore);
        return currentStore.links;
    }

    async function loadCurrentGalleryFromSupabase() {
        if (!isConfigured()) return [];

        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.dbKey) return [];

        const { data, error } = await getClient()
            .from('store_gallery_items')
            .select('*')
            .eq('db_key', currentUser.dbKey)
            .order('position', { ascending: true });

        if (error) throw error;

        const currentStore = getLocalStore(currentUser.dbKey) || {};
        currentStore.gallery = (data || []).map((item) => ({
            ...(item.raw_data || {}),
            id: item.id,
            data: item.image_url || item.raw_data?.data || item.raw_data?.url || item.raw_data?.src || item.raw_data?.imageUrl || null,
            url: item.image_url || item.raw_data?.url || item.raw_data?.data || item.raw_data?.src || item.raw_data?.imageUrl || null,
            imageUrl: item.image_url || item.raw_data?.imageUrl || item.raw_data?.data || item.raw_data?.url || item.raw_data?.src || null,
            src: item.image_url || item.raw_data?.src || item.raw_data?.data || item.raw_data?.url || item.raw_data?.imageUrl || null,
            caption: item.caption || item.raw_data?.caption || item.raw_data?.title || null,
            alt: item.alt_text || item.raw_data?.alt || null,
            createdAt: item.created_at || item.raw_data?.createdAt || null
        }));

        saveLocalStore(currentUser.dbKey, currentStore);
        window.dispatchEvent(new CustomEvent('trilista:gallery-loaded', {
            detail: {
                dbKey: currentUser.dbKey,
                gallery: currentStore.gallery
            }
        }));
        return currentStore.gallery;
    }

    async function migrateAllLocalData() {
        if (!isConfigured()) {
            throw new Error(window.TrilistaSupabase.getStatusMessage());
        }

        const users = getLocalUsers();
        const report = {
            migratedUsers: 0,
            migratedStores: 0,
            skippedStores: 0
        };

        for (const user of users) {
            await upsertUser(user);
            report.migratedUsers += 1;

            const raw = localStorage.getItem(user.dbKey);
            if (!raw) {
                report.skippedStores += 1;
                continue;
            }

            try {
                const parsed = JSON.parse(raw);
                await upsertStorePage(user.id, user.dbKey, parsed);
                await syncNormalizedStoreData(user.id, user.dbKey, parsed);
                report.migratedStores += 1;
            } catch (error) {
                console.error('Erro ao migrar loja para o Supabase:', error);
                report.skippedStores += 1;
            }
        }

        return report;
    }

    window.addEventListener('trilista:db-saved', async function(event) {
        if (!isConfigured() || !event.detail) return;
        if (event.detail.data && event.detail.data._pendingRemoteHydration) return;

        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.dbKey !== event.detail.dbKey) return;

        try {
            await upsertStorePage(currentUser.id, event.detail.dbKey, event.detail.data);
            await syncNormalizedStoreData(currentUser.id, event.detail.dbKey, event.detail.data);
        } catch (error) {
            console.warn('Nao foi possivel sincronizar a loja com o Supabase:', error.message);
        }
    });

    document.addEventListener('DOMContentLoaded', async function() {
        if (!isConfigured()) return;

        try {
            await loadUsersFromSupabase();
            await loadCurrentStoreFromSupabase();
            await loadCurrentProfileFromSupabase();
            await loadCurrentThemeFromSupabase();
            await loadCurrentTemplateFromSupabase();
            await loadCurrentLinksFromSupabase();
            await loadCurrentGalleryFromSupabase();
            await loadCurrentVideosFromSupabase();
        } catch (error) {
            console.warn('Falha ao carregar dados do Supabase:', error.message);
        }
    });

    return {
        isConfigured,
        upsertUser,
        deleteUser,
        upsertStorePage,
        syncNormalizedStoreData,
        loadUsersFromSupabase,
        loadCurrentStoreFromSupabase,
        loadStoreByDbKeyFromSupabase,
        incrementStoreViewByDbKey,
        loadCurrentProfileFromSupabase,
        loadCurrentThemeFromSupabase,
        loadCurrentTemplateFromSupabase,
        loadCurrentLinksFromSupabase,
        loadCurrentGalleryFromSupabase,
        syncCurrentGallery,
        loadCurrentVideosFromSupabase,
        syncCurrentVideos,
        migrateAllLocalData
    };
})();

window.TrilistaSupabaseSync = TrilistaSupabaseSync;
