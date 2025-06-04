export class UIManager {
  constructor(appState) {
    this.state = appState;
  }

  async init() {
    // Obtener idioma guardado
    this.state.appLanguage = localStorage.getItem('appLanguage') || 'en';
    console.log(`Stored language preference: ${this.state.appLanguage}`);

    // Cargar traducciones
    await this.loadUITranslation('en');
    await this.loadUITranslation('es');

    // Aplicar idioma
    await this.applyLanguage(this.state.appLanguage);

    // Configurar botón de cambio de idioma
    this.setupLanguageSwitch();
  }

  async loadUITranslation(lang) {
    try {
      const result = await window.api.loadUITranslation(lang);
      if (result.success) {
        this.state.uiTranslations[lang] = result.data;
        console.log(`Loaded UI translations for ${lang}`);
        return true;
      } else {
        console.error(`Error loading UI translation for ${lang}:`, result.error);
        return false;
      }
    } catch (error) {
      console.error(`Exception loading UI translation for ${lang}:`, error);
      return false;
    }
  }

  async applyLanguage(lang) {
    console.log(`Applying language: ${lang}`);

    // Cargar traducciones si es necesario
    if (Object.keys(this.state.uiTranslations[lang] || {}).length === 0) {
      await this.loadUITranslation(lang);
    }

    this.state.appLanguage = lang;
    const translations = this.state.uiTranslations[lang] || {};

    // Actualizar elementos de la UI
    this.updateUIElements(translations);

    // Guardar preferencia
    localStorage.setItem('appLanguage', lang);
    console.log(`Language applied: ${lang}`);
  }

  updateUIElements(translations) {
    const elements = {
      title: () => document.title = translations.appTitle || "Translation Manager",
      selectFolderBtn: () => {
        const btn = document.getElementById('selectFolderBtn');
        if (btn) btn.textContent = translations.selectFolder || "Select Folder";
      },
      recentFoldersBtn: () => {
        const btn = document.getElementById('recentFoldersBtn');
        if (btn) btn.textContent = (translations.recentFolders || "Recent Folders") + " ▼";
      },
      searchInput: () => {
        const input = document.getElementById('searchInput');
        if (input) input.placeholder = translations.searchPlaceholder || "Search translations...";
      },
      // ... más elementos
    };

    // Aplicar actualizaciones
    Object.values(elements).forEach(update => {
      try {
        update();
      } catch (error) {
        console.warn('Error updating UI element:', error);
      }
    });
  }

  setupLanguageSwitch() {
    const switchLanguageBtn = document.getElementById('switchLanguageBtn');
    if (switchLanguageBtn) {
      switchLanguageBtn.addEventListener('click', () => this.toggleLanguage());
      this.updateSwitchLanguageButton();
    }
  }

  toggleLanguage() {
    const newLang = this.state.appLanguage === 'en' ? 'es' : 'en';
    this.applyLanguage(newLang);
    this.updateSwitchLanguageButton();
  }

  updateSwitchLanguageButton() {
    const switchLanguageBtn = document.getElementById('switchLanguageBtn');
    if (switchLanguageBtn) {
      switchLanguageBtn.textContent = this.state.appLanguage === 'en'
        ? 'Cambiar a Español'
        : 'Switch to English';
    }
  }

  showStatusMessage(message, isError = false, autoHide = true) {
    const statusMessage = document.getElementById('statusMessage');
    if (!statusMessage) return;

    statusMessage.textContent = message;

    // Limpiar temporizador anterior
    if (statusMessage._hideTimer) {
      clearTimeout(statusMessage._hideTimer);
      statusMessage._hideTimer = null;
    }

    // Auto-ocultar mensajes de éxito
    if (!isError && autoHide) {
      statusMessage._hideTimer = setTimeout(() => {
        statusMessage.textContent = '';
      }, 3000);
    }
  }
}