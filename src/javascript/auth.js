// src/javascript/auth.js

const Auth = (function() {
    const KEYS = {
        USERS: 'trilista_users',
        CURRENT_USER: 'trilista_current_user',
        ADMIN_SESSION: 'trilista_admin_session',
        OAUTH_ACTION: 'trilista_oauth_action'
    };

    const PASSWORD_MIN_LENGTH = 6;
    const PASSWORD_ALGO = 'pbkdf2';
    const PASSWORD_ITERATIONS = 210000;
    const PASSWORD_SALT_BYTES = 16;
    const PASSWORD_HASH_BYTES = 32;

    function getSupabaseClient() {
        return window.TrilistaSupabase?.client || null;
    }

    function normalizeEmail(value) {
        return String(value || '').trim().toLowerCase();
    }

    function normalizeStoreName(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    function toBase64(bytes) {
        let binary = '';
        bytes.forEach((byte) => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary);
    }

    function fromBase64(value) {
        const binary = atob(value);
        return Uint8Array.from(binary, (char) => char.charCodeAt(0));
    }

    function createRandomString(length = 32) {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }

    async function hashPassword(password) {
        const salt = new Uint8Array(PASSWORD_SALT_BYTES);
        crypto.getRandomValues(salt);

        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(String(password || '')),
            'PBKDF2',
            false,
            ['deriveBits']
        );

        const bits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                hash: 'SHA-256',
                salt,
                iterations: PASSWORD_ITERATIONS
            },
            key,
            PASSWORD_HASH_BYTES * 8
        );

        return `${PASSWORD_ALGO}$${PASSWORD_ITERATIONS}$${toBase64(salt)}$${toBase64(new Uint8Array(bits))}`;
    }

    async function verifyPassword(password, encodedHash) {
        if (!encodedHash || typeof encodedHash !== 'string') {
            return false;
        }

        const parts = encodedHash.split('$');
        if (parts.length !== 4 || parts[0] !== PASSWORD_ALGO) {
            return false;
        }

        const iterations = Number(parts[1]);
        const salt = fromBase64(parts[2]);
        const expected = fromBase64(parts[3]);

        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(String(password || '')),
            'PBKDF2',
            false,
            ['deriveBits']
        );

        const bits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                hash: 'SHA-256',
                salt,
                iterations: Number.isFinite(iterations) ? iterations : PASSWORD_ITERATIONS
            },
            key,
            expected.byteLength * 8
        );

        const candidate = new Uint8Array(bits);
        if (candidate.byteLength !== expected.byteLength) {
            return false;
        }

        let mismatch = 0;
        for (let i = 0; i < candidate.byteLength; i += 1) {
            mismatch |= candidate[i] ^ expected[i];
        }

        return mismatch === 0;
    }

    function getPasswordResetRedirectUrl() {
        const url = new URL(window.location.href);
        url.hash = '';
        url.searchParams.set('mode', 'reset-password');
        return url.toString();
    }

    function getGoogleRedirectUrl() {
        const url = new URL(window.location.href);
        url.hash = '#auth';
        return url.toString();
    }

    function getPendingOAuthAction() {
        try {
            const rawValue = localStorage.getItem(KEYS.OAUTH_ACTION);
            return rawValue ? JSON.parse(rawValue) : null;
        } catch (error) {
            return null;
        }
    }

    function setPendingOAuthAction(action) {
        if (!action) {
            localStorage.removeItem(KEYS.OAUTH_ACTION);
            return;
        }

        localStorage.setItem(KEYS.OAUTH_ACTION, JSON.stringify(action));
    }

    function hasRecoveryParamsInUrl() {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        return (
            window.location.search.includes('mode=reset-password') ||
            hashParams.get('type') === 'recovery' ||
            hashParams.has('access_token') ||
            hashParams.has('refresh_token') ||
            hashParams.has('token_hash')
        );
    }

    function readLocalUsers() {
        try {
            return JSON.parse(localStorage.getItem(KEYS.USERS)) || [];
        } catch (error) {
            console.warn('Aviso: nao foi possivel ler usuarios locais:', error.message);
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }

    function sanitizeSessionUser(user) {
        if (!user) return null;
        const { passwordHash, senha, recoveryEmail, ...safeUser } = user;
        return safeUser;
    }

    function persistSession(user) {
        const safeUser = sanitizeSessionUser(user);
        if (safeUser) {
            localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(safeUser));
        }
        return safeUser;
    }

    function getCurrentUser() {
        try {
            const userJson = localStorage.getItem(KEYS.CURRENT_USER);
            return userJson ? JSON.parse(userJson) : null;
        } catch (error) {
            return null;
        }
    }

    function getCurrentUserDBKey() {
        const user = getCurrentUser();
        return user ? user.dbKey : null;
    }

    function isAuthenticated() {
        return localStorage.getItem(KEYS.CURRENT_USER) !== null;
    }

    function getAllKnownStoreNames() {
        return readLocalUsers()
            .filter((user) => user?.nomeEmpresa)
            .map((user) => ({ userId: user.id, value: user.nomeEmpresa }));
    }

    function isStoreNameTaken(storeName, excludeUserId = null) {
        const normalizedTarget = normalizeStoreName(storeName);
        if (!normalizedTarget) return false;

        return getAllKnownStoreNames().some((entry) => {
            if (!entry?.value) return false;
            if (excludeUserId !== null && String(entry.userId) === String(excludeUserId)) return false;
            return normalizeStoreName(entry.value) === normalizedTarget;
        });
    }

    function isEmailTaken(email, excludeUserId = null) {
        const normalizedTarget = normalizeEmail(email);
        if (!normalizedTarget) return false;

        return readLocalUsers().some((user) => {
            if (!user?.email) return false;
            if (excludeUserId !== null && String(user.id) === String(excludeUserId)) return false;
            return normalizeEmail(user.email) === normalizedTarget;
        });
    }

    async function initializeUserDB(user) {
        if (!user?.dbKey || localStorage.getItem(user.dbKey)) {
            return;
        }

        const initialDB = {
            _version: 1,
            _createdAt: new Date().toISOString(),
            _updatedAt: new Date().toISOString(),
            profile: {
                storeName: user.nomeEmpresa,
                bio: 'Bem-vindo a minha loja! Aqui voce encontra os melhores produtos.',
                profilePhoto: null,
                coverPhoto: null
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
            videos: []
        };

        localStorage.setItem(user.dbKey, JSON.stringify(initialDB));
    }

    async function ensureStoreAvailable(user, options = {}) {
        if (!user || !user.dbKey) return null;

        const localRaw = localStorage.getItem(user.dbKey);
        if (localRaw) {
            try {
                return JSON.parse(localRaw);
            } catch (error) {
                console.warn('Aviso: nao foi possivel ler a loja local:', error.message);
            }
        }

        if (window.TrilistaSupabaseSync?.isConfigured()) {
            try {
                const remoteStore = await window.TrilistaSupabaseSync.loadStoreByDbKeyFromSupabase(user.dbKey);
                if (remoteStore) {
                    return remoteStore;
                }
            } catch (error) {
                console.warn('Aviso: nao foi possivel restaurar a loja do Supabase:', error.message);
            }
        }

        if (options.initializeIfMissing) {
            await initializeUserDB(user);
            return JSON.parse(localStorage.getItem(user.dbKey));
        }

        return null;
    }

    async function normalizeUserRecord(rawUser) {
        if (!rawUser || typeof rawUser !== 'object') return null;

        const email = normalizeEmail(rawUser.email || rawUser.usuario || rawUser.login);
        const nomeEmpresa = String(rawUser.nomeEmpresa || rawUser.nome_empresa || '').replace(/\s+/g, ' ').trim();
        const id = Number(rawUser.id) || Date.now();
        const dbKey = rawUser.dbKey || rawUser.db_key || `trilista_db_${id}`;
        const status = ['active', 'blocked', 'disabled'].includes(rawUser.status) ? rawUser.status : 'active';
        const role = ['admin', 'seller', 'user'].includes(rawUser.role) ? rawUser.role : 'user';

        let passwordHash = String(
            rawUser.passwordHash ||
            rawUser.password_hash ||
            rawUser.senha_hash ||
            ''
        ).trim();

        if (!passwordHash && rawUser.senha) {
            passwordHash = await hashPassword(rawUser.senha);
        }

        if (passwordHash && !passwordHash.startsWith(`${PASSWORD_ALGO}$`)) {
            passwordHash = await hashPassword(passwordHash);
        }

        if (!passwordHash) {
            passwordHash = await hashPassword(createRandomString(24));
        }

        return {
            id,
            nomeEmpresa,
            nomeResponsavel: rawUser.nomeResponsavel || rawUser.nome_responsavel || '',
            email,
            passwordHash,
            googleId: rawUser.googleId || rawUser.google_id || null,
            role,
            status,
            createdBy: rawUser.createdBy || rawUser.created_by || 'system',
            dbKey,
            createdAt: rawUser.createdAt || rawUser.created_at || new Date().toISOString(),
            updatedAt: rawUser.updatedAt || rawUser.updated_at || new Date().toISOString(),
            forcePasswordChange: Boolean(rawUser.forcePasswordChange || rawUser.force_password_change),
            authProvider: rawUser.authProvider || rawUser.auth_provider || (rawUser.googleId || rawUser.google_id ? 'google' : 'password')
        };
    }

    async function normalizeUsersCollection(users, persist = true) {
        const normalizedUsers = [];

        for (const rawUser of Array.isArray(users) ? users : []) {
            const user = await normalizeUserRecord(rawUser);
            if (user?.email) {
                normalizedUsers.push(user);
            }
        }

        if (persist) {
            saveUsers(normalizedUsers);
        }

        return normalizedUsers;
    }

    async function ensureUsersLoaded() {
        let users = readLocalUsers();

        if (!users.length && window.TrilistaSupabaseSync?.isConfigured()) {
            try {
                users = await window.TrilistaSupabaseSync.loadUsersFromSupabase();
            } catch (error) {
                console.warn('Aviso: nao foi possivel reidratar usuarios do Supabase:', error.message);
            }
        }

        return normalizeUsersCollection(users, true);
    }

    function findUserById(users, userId) {
        return (users || []).find((user) => String(user.id) === String(userId));
    }

    function findUserByEmail(users, email) {
        const normalizedEmail = normalizeEmail(email);
        return (users || []).find((user) => normalizeEmail(user.email) === normalizedEmail);
    }

    function findUserByGoogleId(users, googleId) {
        return (users || []).find((user) => user.googleId && user.googleId === googleId);
    }

    async function syncUserToSupabase(user) {
        if (!window.TrilistaSupabaseSync?.isConfigured()) {
            return null;
        }

        return window.TrilistaSupabaseSync.upsertUser(user);
    }

    async function ensureSupabasePasswordAccount(user, passwordOverride = null) {
        const client = getSupabaseClient();
        if (!client || !user?.email) {
            return { success: false, message: 'Supabase nao configurado para operacoes de email.' };
        }

        const password = String(passwordOverride || createRandomString(24)).trim();
        const { error } = await client.auth.signUp({
            email: user.email,
            password,
            options: {
                emailRedirectTo: getPasswordResetRedirectUrl(),
                data: {
                    trilista_user_id: String(user.id),
                    trilista_store_name: user.nomeEmpresa || ''
                }
            }
        });

        if (error) {
            const message = String(error.message || '').toLowerCase();
            if (
                message.includes('already') ||
                message.includes('registered') ||
                message.includes('exist') ||
                message.includes('rate limit') ||
                message.includes('user already')
            ) {
                await client.auth.signOut();
                return { success: true };
            }

            return { success: false, message: error.message || 'Nao foi possivel preparar a autenticacao por email.' };
        }

        await client.auth.signOut();
        return { success: true };
    }

    function getSupabaseUserConflictMessage(error) {
        const message = String(error?.message || '').toLowerCase();

        if (message.includes('email')) {
            return 'Este email ja esta cadastrado.';
        }

        if (message.includes('nome_empresa') || message.includes('store_name')) {
            return 'Este nome de loja ja esta em uso. Escolha outro nome.';
        }

        return 'Nao foi possivel salvar no Supabase agora.';
    }

    function init() {
        if (!localStorage.getItem(KEYS.USERS)) {
            localStorage.setItem(KEYS.USERS, JSON.stringify([]));
        }
    }

    async function register(userData) {
        const users = await ensureUsersLoaded();
        const nomeEmpresa = String(userData.nomeEmpresa || '').replace(/\s+/g, ' ').trim();
        const nomeResponsavel = String(userData.nomeResponsavel || '').trim();
        const email = normalizeEmail(userData.email);
        const senha = String(userData.senha || '');

        if (!nomeEmpresa || !nomeResponsavel || !email || !senha) {
            return { success: false, message: 'Preencha empresa, nome, email e senha.' };
        }

        if (senha.length < PASSWORD_MIN_LENGTH) {
            return { success: false, message: `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.` };
        }

        if (isEmailTaken(email)) {
            return { success: false, message: 'Este email ja esta cadastrado.' };
        }

        if (isStoreNameTaken(nomeEmpresa)) {
            return { success: false, message: 'Este nome de loja ja esta em uso. Escolha outro nome.' };
        }

        const currentUser = getCurrentUser();
        const now = new Date().toISOString();
        const newUser = {
            id: Date.now(),
            nomeEmpresa,
            nomeResponsavel,
            email,
            passwordHash: await hashPassword(senha),
            googleId: null,
            role: userData.role || 'user',
            status: userData.status || 'active',
            createdBy: userData.createdBy || (currentUser ? currentUser.id : 'system'),
            dbKey: `trilista_db_${Date.now()}`,
            createdAt: now,
            updatedAt: now,
            forcePasswordChange: Boolean(userData.forcePasswordChange),
            authProvider: 'password'
        };

        if (getSupabaseClient()) {
            const supabaseResult = await ensureSupabasePasswordAccount(newUser, senha);
            if (!supabaseResult.success) {
                return supabaseResult;
            }
        }

        try {
            await syncUserToSupabase(newUser);
        } catch (error) {
            return { success: false, message: getSupabaseUserConflictMessage(error) };
        }

        users.push(newUser);
        saveUsers(users);
        await initializeUserDB(newUser);

        return {
            success: true,
            message: 'Cadastro realizado com sucesso! Agora voce ja pode entrar.',
            user: sanitizeSessionUser(newUser)
        };
    }

    async function login(email, senha) {
        const users = await ensureUsersLoaded();
        const user = findUserByEmail(users, email);

        if (!user) {
            return { success: false, message: 'Email ou senha incorretos.' };
        }

        if (user.status === 'blocked' || user.status === 'disabled') {
            return { success: false, message: 'Sua conta esta indisponivel. Entre em contato com o suporte.' };
        }

        const matches = await verifyPassword(senha, user.passwordHash);
        if (!matches) {
            return { success: false, message: 'Email ou senha incorretos.' };
        }

        localStorage.removeItem(KEYS.ADMIN_SESSION);
        await ensureStoreAvailable(user, { initializeIfMissing: true });
        const sessionUser = persistSession(user);

        return {
            success: true,
            user: sessionUser,
            mustChangePassword: Boolean(user.forcePasswordChange),
            message: user.forcePasswordChange
                ? 'Acesso liberado. Atualize sua senha nas configuracoes da conta.'
                : 'Login realizado com sucesso.'
        };
    }

    async function signInWithGoogle(options = {}) {
        const client = getSupabaseClient();
        if (!client) {
            return { success: false, message: 'Supabase nao configurado para login com Google.' };
        }

        const redirectTo = typeof options.redirectTo === 'string' && options.redirectTo.trim()
            ? options.redirectTo.trim()
            : getGoogleRedirectUrl();

        const { error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'select_account'
                }
            }
        });

        if (error) {
            return { success: false, message: error.message || 'Nao foi possivel iniciar o login com Google.' };
        }

        return { success: true };
    }

    async function startGoogleAccountLink() {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            return { success: false, message: 'Usuario nao autenticado.' };
        }

        setPendingOAuthAction({
            type: 'link_google',
            targetUserId: currentUser.id,
            redirectTo: window.location.href
        });

        return signInWithGoogle({ redirectTo: window.location.href });
    }

    async function completePendingOAuth() {
        const client = getSupabaseClient();
        if (!client) {
            return { success: false, handled: false };
        }

        const { data, error } = await client.auth.getSession();
        if (error) {
            return { success: false, handled: false, message: error.message || 'Falha ao validar o login com Google.' };
        }

        const sessionUser = data?.session?.user;
        const provider = sessionUser?.app_metadata?.provider;
        if (!sessionUser || provider !== 'google') {
            return { success: false, handled: false };
        }

        const email = normalizeEmail(sessionUser.email);
        const googleId = sessionUser.id;
        if (!email || !googleId) {
            return { success: false, handled: true, message: 'Nao foi possivel validar os dados retornados pelo Google.' };
        }

        const pendingOAuthAction = getPendingOAuthAction();
        if (pendingOAuthAction?.type === 'link_google') {
            setPendingOAuthAction(null);

            const users = await ensureUsersLoaded();
            const targetUser = findUserById(users, pendingOAuthAction.targetUserId);
            if (!targetUser) {
                await client.auth.signOut();
                return { success: false, handled: true, message: 'Conta atual nao encontrada para vincular o Google.' };
            }

            const existingGoogleUser = findUserByGoogleId(users, googleId);
            if (existingGoogleUser && String(existingGoogleUser.id) !== String(targetUser.id)) {
                await client.auth.signOut();
                return { success: false, handled: true, message: 'Esta conta Google ja esta vinculada a outro cadastro.' };
            }

            targetUser.googleId = googleId;
            targetUser.updatedAt = new Date().toISOString();
            targetUser.authProvider = targetUser.authProvider === 'password' ? 'password+google' : 'google';

            if (!targetUser.passwordHash) {
                targetUser.passwordHash = await hashPassword(createRandomString(24));
            }

            const targetIndex = users.findIndex((entry) => String(entry.id) === String(targetUser.id));
            if (targetIndex !== -1) {
                users[targetIndex] = targetUser;
                saveUsers(users);
            }

            try {
                await syncUserToSupabase(targetUser);
            } catch (errorSync) {
                console.warn('Aviso: nao foi possivel sincronizar o vinculo Google com o Supabase:', errorSync.message);
            }

            const safeUser = persistSession(targetUser);
            await client.auth.signOut();
            return { success: true, handled: true, user: safeUser, message: 'Conta Google vinculada com sucesso.' };
        }

        const users = await ensureUsersLoaded();
        let user = findUserByGoogleId(users, googleId) || findUserByEmail(users, email);

        if (!user) {
            const localPart = email.split('@')[0] || 'nova-loja';
            user = {
                id: Date.now(),
                nomeEmpresa: `Loja ${localPart}`,
                nomeResponsavel: sessionUser.user_metadata?.full_name || localPart,
                email,
                passwordHash: await hashPassword(createRandomString(24)),
                googleId,
                role: 'user',
                status: 'active',
                createdBy: 'system',
                dbKey: `trilista_db_${Date.now()}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                forcePasswordChange: false,
                authProvider: 'google'
            };

            users.push(user);
            saveUsers(users);
            await initializeUserDB(user);
        } else {
            user.googleId = googleId;
            if (!user.email || user.authProvider === 'google') {
                user.email = email;
            }
            user.updatedAt = new Date().toISOString();
            user.authProvider = user.authProvider === 'password' ? 'password+google' : 'google';

            if (!user.passwordHash) {
                user.passwordHash = await hashPassword(createRandomString(24));
            }

            const index = users.findIndex((entry) => String(entry.id) === String(user.id));
            if (index !== -1) {
                users[index] = user;
                saveUsers(users);
            }
        }

        if (user.status === 'blocked' || user.status === 'disabled') {
            await client.auth.signOut();
            return { success: false, handled: true, message: 'Sua conta esta indisponivel. Entre em contato com o suporte.' };
        }

        try {
            await syncUserToSupabase(user);
        } catch (errorSync) {
            console.warn('Aviso: nao foi possivel sincronizar o login Google com o Supabase:', errorSync.message);
        }

        await ensureStoreAvailable(user, { initializeIfMissing: true });
        const safeUser = persistSession(user);
        return { success: true, handled: true, user: safeUser };
    }

    async function sendPasswordResetLink(email) {
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) {
            return { success: false, message: 'Informe o email da conta.' };
        }

        const users = await ensureUsersLoaded();
        const user = findUserByEmail(users, normalizedEmail);
        if (!user) {
            return { success: false, message: 'Email nao encontrado.' };
        }

        const client = getSupabaseClient();
        if (!client) {
            return { success: false, message: 'Supabase nao configurado para recuperacao por email.' };
        }

        const prepareAccount = await ensureSupabasePasswordAccount(user);
        if (!prepareAccount.success) {
            return prepareAccount;
        }

        const { error } = await client.auth.resetPasswordForEmail(normalizedEmail, {
            redirectTo: getPasswordResetRedirectUrl()
        });

        if (error) {
            return { success: false, message: error.message || 'Nao foi possivel enviar o link de recuperacao.' };
        }

        await client.auth.signOut();
        return { success: true, message: 'Enviamos um link de redefinicao para o seu email.' };
    }

    async function isRecoveryMode() {
        if (!hasRecoveryParamsInUrl()) {
            return false;
        }

        const client = getSupabaseClient();
        if (!client) {
            return false;
        }

        const { data } = await client.auth.getSession();
        return Boolean(data?.session) || hasRecoveryParamsInUrl();
    }

    async function updatePasswordWithRecovery(newPassword) {
        if (!newPassword) {
            return { success: false, message: 'Informe a nova senha.' };
        }

        if (String(newPassword).length < PASSWORD_MIN_LENGTH) {
            return { success: false, message: `A nova senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.` };
        }

        const client = getSupabaseClient();
        if (!client) {
            return { success: false, message: 'Supabase nao configurado para redefinir senha.' };
        }

        const { data: userData } = await client.auth.getUser();
        const email = normalizeEmail(userData?.user?.email);
        if (!email) {
            return { success: false, message: 'Link de redefinicao invalido ou expirado.' };
        }

        const { error } = await client.auth.updateUser({ password: newPassword });
        if (error) {
            return { success: false, message: error.message || 'Nao foi possivel atualizar a senha.' };
        }

        const users = await ensureUsersLoaded();
        const index = users.findIndex((user) => normalizeEmail(user.email) === email);
        if (index !== -1) {
            users[index].passwordHash = await hashPassword(newPassword);
            users[index].forcePasswordChange = false;
            users[index].updatedAt = new Date().toISOString();
            saveUsers(users);

            try {
                await syncUserToSupabase(users[index]);
            } catch (syncError) {
                console.warn('Aviso: senha atualizada localmente, mas nao sincronizou com Supabase:', syncError.message);
            }
        }

        await client.auth.signOut();

        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete('mode');
        nextUrl.hash = '';
        window.history.replaceState({}, document.title, nextUrl.pathname + nextUrl.search);

        return {
            success: true,
            message: 'Senha redefinida com sucesso. Agora voce ja pode entrar com a nova senha.',
            email
        };
    }

    function logout() {
        localStorage.removeItem(KEYS.CURRENT_USER);
        localStorage.removeItem(KEYS.ADMIN_SESSION);

        const client = getSupabaseClient();
        if (client) {
            client.auth.signOut().catch(() => {});
        }

        window.location.href = 'index.html#auth';
    }

    function isAdmin() {
        const adminSession = localStorage.getItem(KEYS.ADMIN_SESSION);
        if (adminSession) {
            const admin = JSON.parse(adminSession);
            return admin.role === 'admin';
        }

        const user = getCurrentUser();
        return user && user.role === 'admin';
    }

    function isSeller() {
        const user = getCurrentUser();
        return user && user.role === 'seller';
    }

    function isImpersonating() {
        return localStorage.getItem(KEYS.ADMIN_SESSION) !== null;
    }

    function canAccessUser(targetUserId) {
        const currentUser = getCurrentUser();
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true;
        if (currentUser.id === targetUserId) return true;

        if (currentUser.role === 'seller') {
            const users = readLocalUsers();
            const targetUser = users.find((user) => user.id === targetUserId);
            return targetUser && targetUser.createdBy === currentUser.id;
        }

        return false;
    }

    function getAllUsers() {
        const currentUser = getCurrentUser();
        if (!currentUser) return [];

        const allUsers = readLocalUsers();
        if (currentUser.role === 'admin') {
            return allUsers;
        }

        if (currentUser.role === 'seller') {
            return allUsers.filter((user) => user.createdBy === currentUser.id);
        }

        return allUsers.filter((user) => user.id === currentUser.id);
    }

    function impersonateUser(userId) {
        if (!isAdmin() && !isSeller()) {
            return { success: false, message: 'Permissao negada para impersonar.' };
        }

        const users = readLocalUsers();
        const userToImpersonate = findUserById(users, userId);

        if (!userToImpersonate) {
            return { success: false, message: 'Usuario nao encontrado.' };
        }

        if (isSeller() && userToImpersonate.createdBy !== getCurrentUser().id) {
            return { success: false, message: 'Permissao negada: esta conta nao foi criada por voce.' };
        }

        if (userToImpersonate.role === 'admin') {
            return { success: false, message: 'Nao e possivel impersonar um administrador.' };
        }

        if (!isImpersonating()) {
            localStorage.setItem(KEYS.ADMIN_SESSION, localStorage.getItem(KEYS.CURRENT_USER));
        }

        persistSession(userToImpersonate);
        return { success: true, message: `Agora voce esta acessando como ${userToImpersonate.nomeEmpresa}.` };
    }

    function stopImpersonating() {
        const adminSession = localStorage.getItem(KEYS.ADMIN_SESSION);
        if (!adminSession) return false;

        localStorage.setItem(KEYS.CURRENT_USER, adminSession);
        localStorage.removeItem(KEYS.ADMIN_SESSION);
        return true;
    }

    async function updateUser(userId, data) {
        if (!canAccessUser(userId)) {
            return { success: false, message: 'Permissao negada.' };
        }

        const users = await ensureUsersLoaded();
        const index = users.findIndex((user) => String(user.id) === String(userId));
        if (index === -1) {
            return { success: false, message: 'Usuario nao encontrado.' };
        }

        const currentUser = getCurrentUser();
        const nextData = { ...data };

        if (currentUser.role !== 'admin' && nextData.role) {
            delete nextData.role;
        }

        if (typeof nextData.nomeEmpresa === 'string') {
            nextData.nomeEmpresa = nextData.nomeEmpresa.replace(/\s+/g, ' ').trim();
            if (!nextData.nomeEmpresa) {
                return { success: false, message: 'Informe um nome de loja valido.' };
            }
            if (isStoreNameTaken(nextData.nomeEmpresa, userId)) {
                return { success: false, message: 'Este nome de loja ja esta em uso. Escolha outro nome.' };
            }
        }

        if (typeof nextData.email === 'string') {
            nextData.email = normalizeEmail(nextData.email);
            if (!nextData.email) {
                return { success: false, message: 'Informe um email valido.' };
            }
            if (isEmailTaken(nextData.email, userId)) {
                return { success: false, message: 'Este email ja esta cadastrado.' };
            }
        }

        if (typeof nextData.status === 'string' && !['active', 'blocked', 'disabled'].includes(nextData.status)) {
            return { success: false, message: 'Status de conta invalido.' };
        }

        const nextUser = {
            ...users[index],
            ...nextData,
            updatedAt: new Date().toISOString()
        };

        try {
            await syncUserToSupabase(nextUser);
        } catch (error) {
            return { success: false, message: getSupabaseUserConflictMessage(error) };
        }

        users[index] = nextUser;
        saveUsers(users);

        if (currentUser && String(currentUser.id) === String(userId)) {
            persistSession(nextUser);
        }

        return { success: true, message: 'Dados atualizados com sucesso.', user: sanitizeSessionUser(nextUser) };
    }

    async function resetUserPassword(userId, newPassword, options = {}) {
        if (!canAccessUser(userId)) {
            return { success: false, message: 'Permissao negada para alterar senha.' };
        }

        if (!newPassword || String(newPassword).length < PASSWORD_MIN_LENGTH) {
            return { success: false, message: `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.` };
        }

        const users = await ensureUsersLoaded();
        const index = users.findIndex((user) => String(user.id) === String(userId));
        if (index === -1) {
            return { success: false, message: 'Usuario nao encontrado.' };
        }

        users[index].passwordHash = await hashPassword(newPassword);
        users[index].forcePasswordChange = options.forcePasswordChange !== false;
        users[index].updatedAt = new Date().toISOString();

        saveUsers(users);

        try {
            await syncUserToSupabase(users[index]);
        } catch (error) {
            console.warn('Aviso: senha atualizada localmente, mas nao sincronizou com Supabase:', error.message);
        }

        if (String(getCurrentUser()?.id) === String(userId)) {
            persistSession(users[index]);
        }

        return { success: true, message: 'Senha redefinida com sucesso.' };
    }

    async function updateCurrentAccountSettings(data = {}) {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            return { success: false, message: 'Usuario nao autenticado.' };
        }

        const users = await ensureUsersLoaded();
        const storedUser = findUserById(users, currentUser.id);
        if (!storedUser) {
            return { success: false, message: 'Usuario nao encontrado.' };
        }

        const email = typeof data.email === 'string' ? normalizeEmail(data.email) : storedUser.email;
        const currentPassword = String(data.currentPassword || '');
        const newPassword = String(data.newPassword || '');

        if (!email) {
            return { success: false, message: 'Informe um email valido.' };
        }

        const updateResult = await updateUser(currentUser.id, { email });
        if (!updateResult.success) {
            return updateResult;
        }

        if (newPassword) {
            if (!currentPassword) {
                return { success: false, message: 'Informe a senha atual para definir uma nova senha.' };
            }

            const matches = await verifyPassword(currentPassword, storedUser.passwordHash);
            if (!matches) {
                return { success: false, message: 'A senha atual informada nao confere.' };
            }

            const passwordResult = await resetUserPassword(currentUser.id, newPassword, { forcePasswordChange: false });
            if (!passwordResult.success) {
                return passwordResult;
            }
        }

        return {
            success: true,
            message: newPassword ? 'Credenciais atualizadas com sucesso.' : 'Email atualizado com sucesso.'
        };
    }

    async function toggleUserStatus(userId) {
        const users = await ensureUsersLoaded();
        const targetUser = findUserById(users, userId);
        if (!targetUser) {
            return { success: false, message: 'Usuario nao encontrado.' };
        }

        if (!canAccessUser(userId)) {
            return { success: false, message: 'Permissao negada.' };
        }

        const currentUser = getCurrentUser();
        if (targetUser.id === currentUser?.id) {
            return { success: false, message: 'Voce nao pode bloquear a si mesmo.' };
        }

        if (targetUser.role === 'admin') {
            return { success: false, message: 'Nao e possivel bloquear um administrador.' };
        }

        const nextStatus = targetUser.status === 'blocked' ? 'active' : 'blocked';
        return updateUser(userId, { status: nextStatus });
    }

    async function setUserStatus(userId, status) {
        if (!['active', 'blocked', 'disabled'].includes(status)) {
            return { success: false, message: 'Status invalido.' };
        }

        return updateUser(userId, { status });
    }

    async function deleteUser(userId) {
        if (!canAccessUser(userId)) {
            return { success: false, message: 'Permissao negada.' };
        }

        const users = await ensureUsersLoaded();
        const userToDelete = findUserById(users, userId);

        if (!userToDelete) {
            return { success: false, message: 'Usuario nao encontrado.' };
        }

        if (userToDelete.role === 'admin') {
            return { success: false, message: 'Nao e possivel excluir um administrador.' };
        }

        localStorage.removeItem(userToDelete.dbKey);
        saveUsers(users.filter((user) => String(user.id) !== String(userId)));

        if (window.TrilistaSupabaseSync?.isConfigured()) {
            window.TrilistaSupabaseSync.deleteUser(userId).catch((error) => {
                console.warn('Aviso: usuario removido localmente, mas nao foi excluido no Supabase:', error.message);
            });
        }

        return { success: true, message: 'Usuario excluido com sucesso.' };
    }

    return {
        init,
        register,
        login,
        logout,
        signInWithGoogle,
        startGoogleAccountLink,
        completePendingOAuth,
        isAuthenticated,
        getCurrentUser,
        getCurrentUserDBKey,
        isAdmin,
        isSeller,
        isImpersonating,
        impersonateUser,
        stopImpersonating,
        resetUserPassword,
        sendPasswordResetLink,
        canAccessUser,
        getAllUsers,
        isStoreNameTaken,
        isRecoveryMode,
        deleteUser,
        updateUser,
        updateCurrentAccountSettings,
        updatePasswordWithRecovery,
        toggleUserStatus,
        setUserStatus
    };
})();

Auth.init();
window.Auth = Auth;
