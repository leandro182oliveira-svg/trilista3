// Configuracao central do Supabase para o projeto.
// Substitua pelos valores reais do seu projeto no painel do Supabase.
window.TrilistaSupabaseConfig = window.TrilistaSupabaseConfig || {
    url: 'https://kfcrvtwqfjsmkfmilptj.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmY3J2dHdxZmpzbWtmbWlscHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjI4NzMsImV4cCI6MjA5MTQ5ODg3M30.Swl-j3Mukji0mWDz1nvi_QA2ycDl-trI9nBH0eyg-sM'
};

function hasSupabaseCredentials() {
    const config = window.TrilistaSupabaseConfig || {};
    return Boolean(
        config.url &&
        config.anonKey &&
        !config.url.includes('YOUR_PROJECT') &&
        !config.anonKey.includes('YOUR_ANON_KEY')
    );
}

const trilistaSupabaseClient = hasSupabaseCredentials()
    ? window.supabase.createClient(
        window.TrilistaSupabaseConfig.url,
        window.TrilistaSupabaseConfig.anonKey
    )
    : null;

window.TrilistaSupabase = {
    client: trilistaSupabaseClient,
    isConfigured: hasSupabaseCredentials,
    getStatusMessage() {
        return hasSupabaseCredentials()
            ? 'Supabase configurado.'
            : 'Supabase ainda nao configurado em src/javascript/supabase-client.js.';
    }
};
