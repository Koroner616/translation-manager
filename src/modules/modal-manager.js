export class ModalManager {
  constructor(appState) {
    this.state = appState;
    this.modals = {};
  }

  init() {
    this.setupModals();
    this.setupHelpTabs();
  }

  setupModals() {
    // Modal de añadir traducción
    this.modals.add = document.getElementById('addModal');
    this.modals.help = document.getElementById('helpModal');

    // Event listeners para cerrar modales
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('close') || e.target.closest('.close')) {
        this.closeAllModals();
      }

      // Cerrar modal de ayuda si se hace clic fuera
      if (e.target === this.modals.help) {
        this.closeHelpModal();
      }
    });
  }

  async setupHelpTabs() {
    console.log("Setting up help tabs");

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabButtons.length === 0) {
      console.error("No tab buttons found");
      return;
    }

    // Cargar contenido para ambos idiomas
    await this.loadHelpContent('en');
    await this.loadHelpContent('es');

    // Event listeners para pestañas
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const lang = button.getAttribute('data-tab');
        console.log(`Tab clicked: ${lang}`);

        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        button.classList.add('active');
        const tabContent = document.getElementById(`tab-${lang}`);
        if (tabContent) {
          tabContent.classList.add('active');
        }
      });
    });
  }

  async loadHelpContent(lang) {
    console.log(`Loading help content for ${lang}`);

    try {
      const result = await window.api.loadHelpContent(lang);
      const tabContent = document.getElementById(`tab-${lang}`);

      if (!tabContent) {
        console.error(`Tab content element not found: tab-${lang}`);
        return false;
      }

      if (result.success) {
        tabContent.innerHTML = result.data;
        console.log(`Help content loaded for ${lang}`);
        return true;
      } else {
        console.error(`Error loading help content for ${lang}:`, result.error);
        tabContent.innerHTML = `<div class="error-message">
          <h3>Error loading help content</h3>
          <p>${result.error}</p>
        </div>`;
        return false;
      }
    } catch (error) {
      console.error(`Exception loading help content for ${lang}:`, error);
      return false;
    }
  }

  openHelpModal() {
    console.log("Opening help modal");

    if (!this.modals.help) {
      console.error("Help modal element not found!");
      return;
    }

    this.modals.help.style.display = 'block';

    setTimeout(() => {
      this.modals.help.classList.add('show');
    }, 10);

    // Activar pestaña del idioma actual
    if (this.state.appLanguage) {
      const langButton = document.querySelector(`.tab-button[data-tab="${this.state.appLanguage}"]`);
      if (langButton) {
        langButton.click();
      } else {
        const firstTab = document.querySelector('.tab-button');
        if (firstTab) firstTab.click();
      }
    }
  }

  closeHelpModal() {
    console.log("Closing help modal");

    if (!this.modals.help) {
      console.error("Help modal element not found!");
      return;
    }

    this.modals.help.classList.remove('show');
    this.modals.help.style.display = 'none';
  }

  openAddModal(preselectedParent = '') {
    this.populateParentKeySelect();

    // Limpiar campos
    const newKeyInput = document.getElementById('newKey');
    const newTranslationValues = document.getElementById('newTranslationValues');

    if (newKeyInput) newKeyInput.value = '';
    if (newTranslationValues) newTranslationValues.innerHTML = '';

    // Preseleccionar parent si se proporciona
    const parentKeySelect = document.getElementById('parentKeySelect');
    if (parentKeySelect && preselectedParent) {
      parentKeySelect.value = preselectedParent;
    }

    // Crear campos para cada idioma
    this.state.languages.forEach(lang => {
      const entryDiv = document.createElement('div');
      entryDiv.className = 'new-translation-entry';

      const label = document.createElement('label');
      label.textContent = lang;

      const input = document.createElement('input');
      input.type = 'text';
      input.dataset.lang = lang;

      entryDiv.appendChild(label);
      entryDiv.appendChild(input);
      if (newTranslationValues) newTranslationValues.appendChild(entryDiv);
    });

    if (this.modals.add) this.modals.add.style.display = 'block';
  }

  closeAddModal() {
    if (this.modals.add) this.modals.add.style.display = 'none';
  }

  populateParentKeySelect() {
    const parentKeySelect = document.getElementById('parentKeySelect');
    if (!parentKeySelect) return;

    parentKeySelect.innerHTML = `<option value="">${this.state.uiTranslations[this.state.appLanguage].rootLevel || 'Root Level'}</option>`;

    const groups = [];

    const findGroups = (obj, prefix = '') => {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          groups.push(fullKey);
          findGroups(obj[key], fullKey);
        }
      }
    };

    if (this.state.languages.length > 0 && this.state.translations[this.state.languages[0]]) {
      findGroups(this.state.translations[this.state.languages[0]]);
    }

    groups.sort().forEach(group => {
      const option = document.createElement('option');
      option.value = group;
      option.textContent = group;
      parentKeySelect.appendChild(option);
    });
  }

  confirmAddTranslation() {
    const parentKeySelect = document.getElementById('parentKeySelect');
    const newKeyInput = document.getElementById('newKey');
    const newTranslationValues = document.getElementById('newTranslationValues');

    if (!parentKeySelect || !newKeyInput || !newTranslationValues) return;

    const parentKey = parentKeySelect.value;
    const newKey = newKeyInput.value.trim();

    if (!newKey) {
      alert(this.state.uiTranslations[this.state.appLanguage].keyRequired || 'Key is required');
      return;
    }

    const values = [];
    const inputs = newTranslationValues.querySelectorAll('input');
    inputs.forEach(input => {
      values.push({
        lang: input.dataset.lang,
        value: input.value
      });
    });

    if (window.modules && window.modules.translations) {
      const result = window.modules.translations.addNewTranslation(parentKey, newKey, values);

      if (result.success) {
        if (window.modules && window.modules.table) {
          window.modules.table.renderTranslationsTable();
        }
        this.closeAddModal();

        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) saveBtn.disabled = false;

        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) statusMessage.textContent = `${this.state.uiTranslations[this.state.appLanguage].keyAdded || 'Key added'}: ${result.key}`;

        // Expandir grupos si es necesario
        this.expandToKey(parentKey);
      } else {
        alert(result.error);
      }
    }
  }

  expandToKey(parentKey) {
    if (!parentKey) return;

    const parts = parentKey.split('.');
    let currentPrefix = '';

    for (const part of parts) {
      currentPrefix = currentPrefix ? `${currentPrefix}.${part}` : part;
      const groupRow = document.querySelector(`.group-row[data-key="${currentPrefix}"]`);
      if (groupRow) {
        const nestedContainer = document.querySelector(`.nested-keys[data-parent="${currentPrefix}"]`);
        if (nestedContainer) {
          nestedContainer.style.display = 'block';
          const expandIcon = groupRow.querySelector('.expandable-icon');
          if (expandIcon) expandIcon.textContent = '▼';
        }
      }
    }
  }

  openEditPopover(input, valueCell, lang) {
    const editPopover = document.createElement('div');
    editPopover.className = 'edit-popover';

    // Header del popover
    const popoverHeader = document.createElement('div');
    popoverHeader.className = 'popover-header';

    const langLabel = document.createElement('div');
    langLabel.className = 'lang-label';
    langLabel.textContent = lang.toUpperCase();

    const closeButton = document.createElement('button');
    closeButton.className = 'popover-close';
    closeButton.innerHTML = '&times;';
    closeButton.title = 'Close';

    popoverHeader.appendChild(langLabel);
    popoverHeader.appendChild(closeButton);

    // Área de edición
    const editArea = document.createElement('textarea');
    editArea.className = 'edit-area';
    editArea.value = input.value;
    editArea.spellcheck = false;

    // Botones de acción
    const actionButtons = document.createElement('div');
    actionButtons.className = 'popover-actions';

    const saveButton = document.createElement('button');
    saveButton.className = 'save-edit';
    saveButton.textContent = this.state.uiTranslations[this.state.appLanguage].saveChanges || 'Save Changes';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-edit';
    cancelButton.textContent = this.state.uiTranslations[this.state.appLanguage].cancel || 'Cancel';

    actionButtons.appendChild(cancelButton);
    actionButtons.appendChild(saveButton);

    // Ensamblar popover
    editPopover.appendChild(popoverHeader);
    editPopover.appendChild(editArea);
    editPopover.appendChild(actionButtons);

    // Posicionar y mostrar
    document.body.appendChild(editPopover);
    this.positionPopover(editPopover, valueCell);

    setTimeout(() => {
      editPopover.classList.add('visible');
    }, 10);

    editArea.focus();

    // Event listeners
    const closePopover = (save) => {
      editPopover.classList.remove('visible');
      setTimeout(() => {
        if (save) {
          input.value = editArea.value;
          input.dispatchEvent(new Event('input'));
        }
        editPopover.remove();
      }, 200);
    };

    closeButton.addEventListener('click', () => closePopover(false));
    cancelButton.addEventListener('click', () => closePopover(false));
    saveButton.addEventListener('click', () => closePopover(true));

    editArea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closePopover(false);
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        closePopover(true);
      }
    });

    const outsideClickHandler = (e) => {
      if (!editPopover.contains(e.target) && e.target !== input) {
        closePopover(true);
        document.removeEventListener('mousedown', outsideClickHandler);
      }
    };

    setTimeout(() => {
      document.addEventListener('mousedown', outsideClickHandler);
    }, 10);
  }

  positionPopover(popover, cell) {
    const cellRect = cell.getBoundingClientRect();
    const popoverWidth = Math.max(350, cellRect.width * 1.5);
    popover.style.width = popoverWidth + 'px';
    popover.style.left = Math.min(
      cellRect.left,
      window.innerWidth - popoverWidth - 20
    ) + 'px';

    if (cellRect.top > window.innerHeight / 2) {
      popover.style.bottom = (window.innerHeight - cellRect.top + 10) + 'px';
      popover.classList.add('position-top');
    } else {
      popover.style.top = (cellRect.bottom + 10) + 'px';
      popover.classList.add('position-bottom');
    }
  }

  openMultiEditModal(fullKey, translationRow) {
    const multiEditModal = document.createElement('div');
    multiEditModal.className = 'multi-edit-modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'multi-edit-content';

    // Header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'multi-edit-header';

    const modalTitle = document.createElement('h3');

    const closeModalBtn = document.createElement('button');
    closeModalBtn.className = 'close multi-edit-close';
    closeModalBtn.innerHTML = '&times;';

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeModalBtn);

    // Contenedor para editores
    const editorsContainer = document.createElement('div');
    editorsContainer.className = 'multi-edit-container';

    const textareas = {};

    this.state.languages.forEach(lang => {
      const langContainer = document.createElement('div');
      langContainer.className = 'multi-edit-lang';

      const langHeader = document.createElement('div');
      langHeader.className = 'multi-edit-lang-header';

      const langLabel = document.createElement('div');
      langLabel.className = 'multi-edit-lang-label';
      langLabel.textContent = lang.toUpperCase();

      langHeader.appendChild(langLabel);

      const textarea = document.createElement('textarea');
      textarea.className = 'multi-edit-textarea';
      textarea.spellcheck = false;

      let langValue = '';
      if (this.state.translations[lang] && window.modules.translations) {
        langValue = window.modules.translations.getNestedValue(this.state.translations[lang], fullKey.split('.'));
      }
      textarea.value = langValue !== undefined ? langValue : '';

      textareas[lang] = textarea;

      langContainer.appendChild(langHeader);
      langContainer.appendChild(textarea);
      editorsContainer.appendChild(langContainer);
    });

    // Botones de acción
    const actionButtons = document.createElement('div');
    actionButtons.className = 'multi-edit-actions';

    const saveAllBtn = document.createElement('button');
    saveAllBtn.className = 'multi-edit-save';
    saveAllBtn.textContent = this.state.uiTranslations[this.state.appLanguage].saveAllTranslations || 'Save All Translations';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'multi-edit-cancel';
    cancelBtn.textContent = this.state.uiTranslations[this.state.appLanguage].cancel || 'Cancel';

    actionButtons.appendChild(cancelBtn);
    actionButtons.appendChild(saveAllBtn);

    // Ensamblar modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(editorsContainer);
    modalContent.appendChild(actionButtons);
    multiEditModal.appendChild(modalContent);

    document.body.appendChild(multiEditModal);

    setTimeout(() => {
      multiEditModal.classList.add('visible');
    }, 10);

    // Event listeners
    const closeMultiEdit = () => {
      multiEditModal.classList.remove('visible');
      setTimeout(() => {
        multiEditModal.remove();
      }, 300);
    };

    closeModalBtn.addEventListener('click', closeMultiEdit);
    cancelBtn.addEventListener('click', closeMultiEdit);

    saveAllBtn.addEventListener('click', () => {
      this.state.languages.forEach(lang => {
        const newValue = textareas[lang].value;
        if (window.modules.translations) {
          window.modules.translations.updateTranslationValue(lang, fullKey, newValue);
        }

        const input = translationRow.querySelector(`input[data-lang="${lang}"]`);
        if (input) {
          input.value = newValue;
          input.title = newValue;
        }
      });

      this.state.hasUnsavedChanges = true;
      const saveBtn = document.getElementById('saveBtn');
      if (saveBtn) saveBtn.disabled = false;

      closeMultiEdit();

      const statusMessage = document.getElementById('statusMessage');
      if (statusMessage) {
        statusMessage.textContent = `${this.state.uiTranslations[this.state.appLanguage].updatedAllTranslations || 'Updated all translations for'}: ${fullKey}`;
      }
    });

    multiEditModal.addEventListener('click', (e) => {
      if (e.target === multiEditModal) {
        closeMultiEdit();
      }
    });

    if (this.state.languages.length > 0) {
      textareas[this.state.languages[0]].focus();
    }
  }

  closeAllModals() {
    Object.values(this.modals).forEach(modal => {
      if (modal && modal.style) {
        modal.style.display = 'none';
      }
    });

    // Cerrar modales dinámicos
    document.querySelectorAll('.multi-edit-modal, .edit-popover').forEach(modal => {
      modal.remove();
    });
  }
}