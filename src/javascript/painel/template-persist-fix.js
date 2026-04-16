// Corrige a persistencia dos temas predefinidos para nao herdarem config do modo custom.
(function() {
    const presetTemplates = {
        classico: {
            name: 'classico',
            bg: '#FFC82C',
            color: '#000000',
            font: "'Montserrat', sans-serif",
            primary: '#FFC82C',
            panelIconBg: '#FFC82C',
            panelIconColor: '#000000',
            button: '#000000',
            buttonListBg: '#ffffff',
            buttonListText: '#000000',
            borderRadius: 16,
            shadowStrength: 12,
            cardStyle: 'soft'
        },
        pink: {
            name: 'pink',
            bg: '#fff0f6',
            color: '#6b0f1e',
            font: "'Montserrat', sans-serif",
            primary: '#d63384',
            panelIconBg: '#d63384',
            panelIconColor: '#ffffff',
            button: '#ffffff',
            buttonListBg: '#ffffff',
            buttonListText: '#000000',
            borderRadius: 18,
            shadowStrength: 14,
            cardStyle: 'elevated'
        },
        dark: {
            name: 'dark',
            bg: '#000000',
            color: '#ffffff',
            font: "'Segoe UI', sans-serif",
            primary: '#667eea',
            statusBarBg: '#FFFFFF',
            statusBarText: '#000000',
            panelIconBg: '#000000',
            panelIconColor: '#ffffff',
            button: '#ffffff',
            buttonListBg: '#ffffff',
            buttonListText: '#1F2937',
            borderRadius: 12,
            shadowStrength: 10,
            cardStyle: 'elevated'
        }
    };

    function normalizeSavedPreset() {
        if (!window.TrilistaDB) return;
        const savedTemplate = window.TrilistaDB.getTemplate();
        if (!savedTemplate || !savedTemplate.name || savedTemplate.name === 'custom') return;

        const preset = presetTemplates[savedTemplate.name];
        if (!preset) return;

        const hasPresetShape = typeof savedTemplate.bg === 'string' || typeof savedTemplate.primary === 'string';
        if (!hasPresetShape) {
            window.TrilistaDB.saveTemplate({ ...preset });
        }
    }

    function installFix() {
        if (!window.TemplateManager || !window.TrilistaDB) return false;
        if (window.TemplateManager.__presetPersistFixInstalled) return true;

        const originalLoadSavedTemplate = window.TemplateManager.loadSavedTemplate;
        const originalSetTemplate = window.TemplateManager.setTemplate;

        window.TemplateManager.loadSavedTemplate = function() {
            normalizeSavedPreset();
            return originalLoadSavedTemplate.apply(this, arguments);
        };

        window.TemplateManager.setTemplate = function(templateName, isInitialLoad = false) {
            const result = originalSetTemplate.apply(this, arguments);

            if (!isInitialLoad && templateName !== 'custom' && presetTemplates[templateName]) {
                window.TrilistaDB.saveTemplate({ ...presetTemplates[templateName] });
            }

            return result;
        };

        window.TemplateManager.__presetPersistFixInstalled = true;
        return true;
    }

    if (!installFix()) {
        document.addEventListener('DOMContentLoaded', installFix, { once: true });
    }
})();
