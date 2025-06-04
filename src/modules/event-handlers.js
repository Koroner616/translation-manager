export class EventHandlers {
  constructor(appState) {
    this.state = appState;
  }

  init() {
    this.setupMainEventListeners();
    this.setupKeyboardShortcuts();
    this.setupWindowEventListeners();
  }

  setupMainEventListeners() {
    // Botones principales
    const selectFolderBtn = document.getElementById('selectFolderBtn');
    if (selectFolderBtn) {
      selectFolderBtn.addEventListener('click', () => {
        if (window.modules && window.modules.files) {
          window.modules.files.selectFolder();
        }
      });
    }

    const recentFoldersBtn = document.getElementById('recentFoldersBtn');
    if (recentFoldersBtn) {
      recentFoldersBtn.addEventListener('click', () => {
        if (window.modules && window.modules.files) {
          window.modules.files.toggleRecentFolders();
        }
      });
    }

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (window.modules && window.modules.translations) {
          window.modules.translations.saveTranslations();
        }
      });
    }

    const addLanguageBtn = document.getElementById('addLanguageBtn');
    if (addLanguageBtn) {
      addLanguageBtn.addEventListener('click', () => this.handleAddLanguage());
    }

    const addTranslationBtn = document.getElementById('addTranslationBtn');
    if (addTranslationBtn) {
      addTranslationBtn.addEventListener('click', () => {
        if (window.modules && window.modules.modals) {
          window.modules.modals.openAddModal();
        }
      });
    }

    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        if (window.modules && window.modules.modals) {
          window.modules.modals.openHelpModal();
        }
      });
    }

    // Modal event listeners
    this.setupModalEventListeners();
  }

  setupModalEventListeners() {
    const confirmAddBtn = document.getElementById('confirmAddBtn');
    if (confirmAddBtn) {
      confirmAddBtn.addEventListener('click', () => {
        if (window.modules && window.modules.modals) {
          window.modules.modals.confirmAddTranslation();
        }
      });
    }

    const cancelAddBtn = document.getElementById('cancelAddBtn');
    if (cancelAddBtn) {
      cancelAddBtn.addEventListener('click', () => {
        if (window.modules && window.modules.modals) {
          window.modules.modals.closeAddModal();
        }
      });
    }

    // Event listeners para cerrar modales con el botón X
    document.querySelectorAll('.close').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => {
        if (window.modules && window.modules.modals) {
          window.modules.modals.closeAllModals();
        }
      });
    });
  }

  setupKeyboardShortcuts() {
    // Bind para mantener el contexto
    this.handleKeydown = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.handleKeydown);
  }

  handleKeydown(e) {
    // Ctrl+S para guardar
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (window.modules && window.modules.translations) {
        window.modules.translations.saveTranslations();
      }
    }

    // Escape para cerrar modales
    if (e.key === 'Escape') {
      if (window.modules && window.modules.modals) {
        window.modules.modals.closeAllModals();
      }
    }

    // Ctrl+F para enfocar búsqueda
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }

    // Ctrl+N para nueva traducción
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      if (window.modules && window.modules.modals) {
        window.modules.modals.openAddModal();
      }
    }
  }

  setupWindowEventListeners() {
    // Bind para mantener el contexto
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    this.handleWindowClick = this.handleWindowClick.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);

    window.addEventListener('click', this.handleWindowClick);
    window.addEventListener('resize', this.handleWindowResize);
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  handleWindowClick(event) {
    // Cerrar dropdown de carpetas recientes al hacer clic fuera
    const recentFoldersDropdown = document.getElementById('recentFoldersDropdown');

    if (!event.target.matches('#recentFoldersBtn') && !event.target.closest('#recentFoldersDropdown')) {
      if (recentFoldersDropdown && recentFoldersDropdown.classList.contains('show')) {
        recentFoldersDropdown.classList.remove('show');
      }
    }
  }

  handleWindowResize() {
    // Manejar cambios de ventana para responsive design
    if (window.modules && window.modules.files) {
      window.modules.files.adjustDropdownWidth();
    }
  }

  handleBeforeUnload(e) {
    // Prevenir salida accidental con cambios sin guardar
    if (this.state.hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  }

  handleAddLanguage() {
    const newLanguageInput = document.getElementById('newLanguage');
    if (!newLanguageInput) return;

    const langCode = newLanguageInput.value.trim();

    if (window.modules && window.modules.translations) {
      const success = window.modules.translations.addNewLanguage(langCode);

      if (success) {
        newLanguageInput.value = '';
        if (window.modules.table) {
          window.modules.table.renderTranslationsTable();
        }

        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) saveBtn.disabled = false;
      }
    }
  }

  // Método para limpiar event listeners cuando sea necesario
  cleanup() {
    // Remover event listeners específicos
    if (this.handleKeydown) {
      document.removeEventListener('keydown', this.handleKeydown);
    }
    if (this.handleBeforeUnload) {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }
    if (this.handleWindowClick) {
      window.removeEventListener('click', this.handleWindowClick);
    }
    if (this.handleWindowResize) {
      window.removeEventListener('resize', this.handleWindowResize);
    }
  }
}