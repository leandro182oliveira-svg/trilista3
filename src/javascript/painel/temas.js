// temas.js - Gerenciamento de temas e aparência
const Temas = (function() {
    let currentTheme = 'default';
    let customColors = {
        primary: '#667eea',
        secondary: '#764ba2',
        text: '#2d3748'
    };
    let currentFont = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

    const themes = {
        default: { primary: '#667eea', secondary: '#764ba2', text: '#2d3748' },
        green: { primary: '#10B981', secondary: '#059669', text: '#064E3B' },
        red: { primary: '#EF4444', secondary: '#DC2626', text: '#7F1D1D' },
        orange: { primary: '#F59E0B', secondary: '#D97706', text: '#78350F' },
        teal: { primary: '#06B6D4', secondary: '#0891B2', text: '#134E4A' },
        pink: { primary: '#EC4899', secondary: '#DB2777', text: '#831843' }
    };

    function applyTheme(themeName) {
        currentTheme = themeName;
        
        document.querySelectorAll('.theme-item').forEach(item => {
            item.classList.remove('active');
        });
        const themeItem = document.querySelector(`.theme-item[data-theme="${themeName}"]`);
        if (themeItem) themeItem.classList.add('active');
        
        if (themeName !== 'custom') {
            const theme = themes[themeName];
            customColors = { ...theme };
            
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

    function updateCustomTheme() {
        currentTheme = 'custom';
        
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
        
        document.querySelectorAll('.theme-item').forEach(item => {
            item.classList.remove('active');
        });
        
        updateThemePreview();
        applyThemeToPhone();
    }

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

    function applyThemeToPhone() {
        const phoneStatusBar = document.querySelector('.phone-status-bar');
        const storeAvatar = document.querySelector('.store-avatar');
        const sectionItems = document.querySelectorAll('.section-item');
        const storeName = document.querySelector('.store-name');
        const storeBio = document.querySelector('.store-bio');
        
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
        
        const buttons = document.querySelectorAll('.btn-primary');
        buttons.forEach(btn => {
            btn.style.background = customColors.primary;
            btn.style.borderColor = customColors.primary;
        });
        
        const sectionIcons = document.querySelectorAll('.section-icon');
        sectionIcons.forEach(icon => {
            icon.style.background = `linear-gradient(135deg, ${customColors.primary} 0%, ${customColors.secondary} 100%)`;
        });
    }

    function changeFont(element) {
        const font = element.getAttribute('data-font');
        currentFont = font;
        
        document.querySelectorAll('.font-option').forEach(option => {
            option.classList.remove('active');
        });
        element.classList.add('active');
        
        document.querySelectorAll('.font-preview').forEach(preview => {
            preview.style.fontFamily = font;
        });
        
        applyFontToPhone();
    }

    function applyFontToPhone() {
        const phoneContent = document.querySelector('.store-content');
        if (phoneContent) {
            phoneContent.style.fontFamily = currentFont;
        }
        
        const storeName = document.querySelector('.store-name');
        if (storeName) {
            storeName.style.fontFamily = currentFont;
        }
    }

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

    function loadSavedTheme() {
        if (window.TrilistaDB) {
            const themeData = TrilistaDB.getTheme();
            if (themeData) {
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

    return {
        applyTheme,
        updateCustomTheme,
        changeFont,
        saveTheme,
        resetTheme,
        loadSavedTheme,
        getCurrentColors: () => customColors,
        getCurrentFont: () => currentFont
    };
})();

window.Temas = Temas;