let currentFolder = null;
let translations = {};
let languages = [];
let hasUnsavedChanges = false;
let flattenedTranslations = {};
let recentFolders = [];
let appLanguage = 'en'; // Idioma por defecto
let uiTranslations = {
  en: {}, // Traducciones en inglés
  es: {}  // Traducciones en español
};

// Función para cargar una traducción de la interfaz
async function loadUITranslation(lang) {
  try {
    const result = await window.api.loadUITranslation(lang);
    if (result.success) {
      uiTranslations[lang] = result.data;
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

// Función para aplicar traducciones a todos los elementos de la UI
async function applyLanguage(lang) {
  console.log(`Applying language: ${lang}`);

  // Cargar traducciones si es necesario
  if (Object.keys(uiTranslations[lang] || {}).length === 0) {
    await loadUITranslation(lang);
  }

  appLanguage = lang;
  const translations = uiTranslations[lang] || {};

  // Actualizar textos de la interfaz
  document.title = translations.appTitle || "Translation Manager";

  // Botones principales
  if (selectFolderBtn) selectFolderBtn.textContent = translations.selectFolder || "Select Folder";
  if (recentFoldersBtn) recentFoldersBtn.textContent = (translations.recentFolders || "Recent Folders") + " ▼";
  if (searchInput) searchInput.placeholder = translations.searchPlaceholder || "Search translations...";
  if (addTranslationBtn) addTranslationBtn.textContent = translations.addNewTranslation || "Add New Translation";
  if (newLanguageInput) newLanguageInput.placeholder = translations.languageCodePlaceholder || "New language code";
  if (addLanguageBtn) addLanguageBtn.textContent = translations.addLanguage || "Add Language";
  if (saveBtn) saveBtn.textContent = translations.saveChanges || "Save Changes";
  if (helpBtn) helpBtn.textContent = translations.help || "Help";
  // Mensaje inicial cuando no hay carpeta seleccionada - Usar el mismo patrón
  if (!currentFolder && translationsTable) {
    translationsTable.innerHTML = `<div class="select-message">${translations.emptyFolderMessage || "Select a translations folder to begin"}</div>`;
  }

  // Textos en modales
  if (document.querySelector('#addModal h2')) {
    document.querySelector('#addModal h2').textContent = translations.addNewTranslation || "Add New Translation";
  }

  // Botones en el modal de añadir traducción
  if (document.querySelector('#confirmAddBtn')) {
    document.querySelector('#confirmAddBtn').textContent = translations.addTranslation || "Add Translation";
  }

  if (document.querySelector('#cancelAddBtn')) {
    document.querySelector('#cancelAddBtn').textContent = translations.cancel || "Cancel";
  }

  // Actualizar botones "Add Key" en grupos existentes
  document.querySelectorAll('.add-to-group-btn').forEach(btn => {
    btn.textContent = translations.addKey || "Add Key";
  });

  // Guardar preferencia
  localStorage.setItem('appLanguage', lang);

  console.log(`Language applied: ${lang}`);
}

// Añade estas funciones
function setupLanguageSwitch() {
  const switchLanguageBtn = document.getElementById('switchLanguageBtn');
  if (switchLanguageBtn) {
    switchLanguageBtn.addEventListener('click', toggleLanguage);
    updateSwitchLanguageButton();
  }
}

function toggleLanguage() {
  const newLang = appLanguage === 'en' ? 'es' : 'en';
  applyLanguage(newLang);
  updateSwitchLanguageButton();
}

function updateSwitchLanguageButton() {
  const switchLanguageBtn = document.getElementById('switchLanguageBtn');
  if (switchLanguageBtn) {
    switchLanguageBtn.textContent = appLanguage === 'en' ? 'Cambiar a Español' : 'Switch to English';
  }
}

// Add this at the top of your file after the variable declarations
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  statusMessage.textContent = `Error: ${event.reason.message || 'Unknown error occurred'}`;
});

// DOM Elements
const selectFolderBtn = document.getElementById('selectFolderBtn');
const recentFoldersBtn = document.getElementById('recentFoldersBtn');
const recentFoldersDropdown = document.getElementById('recentFoldersDropdown');
const currentFolderEl = document.getElementById('currentFolder');
const translationsTable = document.getElementById('translationsTable');
const saveBtn = document.getElementById('saveBtn');
const statusMessage = document.getElementById('statusMessage');
const addLanguageBtn = document.getElementById('addLanguageBtn');
const newLanguageInput = document.getElementById('newLanguage');
const searchInput = document.getElementById('searchInput');
const addTranslationBtn = document.getElementById('addTranslationBtn');

// Define estas funciones antes de usarlas en los event listeners
function openHelpModal() {
  console.log("Opening help modal");
  const helpModal = document.getElementById('helpModal');

  if (!helpModal) {
    console.error("Help modal element not found!");
    return;
  }

  helpModal.style.display = 'block';

  // Forzar repintado del DOM
  setTimeout(() => {
    helpModal.classList.add('show');
  }, 10);
}

function closeHelpModal() {
  console.log("Closing help modal");
  const helpModal = document.getElementById('helpModal');

  if (!helpModal) {
    console.error("Help modal element not found!");
    return;
  }

  helpModal.classList.remove('show');
  helpModal.style.display = 'none';
}

// Ahora define tus constantes DOM
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const helpModalCloseBtn = helpModal.querySelector('.close');

// Y ahora agrega los event listeners
helpBtn.addEventListener('click', openHelpModal);
helpModalCloseBtn.addEventListener('click', closeHelpModal);

// Cerrar el modal de ayuda si se hace clic fuera de él
window.addEventListener('click', function(event) {
  if (event.target === helpModal) {
    closeHelpModal();
  }
});

// Modal elements
const addModal = document.getElementById('addModal');
const closeModalBtn = document.querySelector('.close');
const parentKeySelect = document.getElementById('parentKeySelect');
const newKeyInput = document.getElementById('newKey');
const newTranslationValues = document.getElementById('newTranslationValues');
const confirmAddBtn = document.getElementById('confirmAddBtn');
const cancelAddBtn = document.getElementById('cancelAddBtn');

// Event Listeners
selectFolderBtn.addEventListener('click', selectFolder);
recentFoldersBtn.addEventListener('click', toggleRecentFolders);
saveBtn.addEventListener('click', saveTranslations);
addLanguageBtn.addEventListener('click', addNewLanguage);
searchInput.addEventListener('input', filterTranslations);
addTranslationBtn.addEventListener('click', openAddModal);
closeModalBtn.addEventListener('click', closeModal);
cancelAddBtn.addEventListener('click', closeModal);
confirmAddBtn.addEventListener('click', addNewTranslation);
helpBtn.addEventListener('click', openHelpModal);
helpModalCloseBtn.addEventListener('click', closeHelpModal);

// Cerrar el modal de ayuda si se hace clic fuera de él
window.addEventListener('click', function(event) {
  if (event.target === helpModal) {
    closeHelpModal();
  }
});

// Añadir esta función para cargar el contenido de ayuda
async function loadHelpContent(lang) {
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

// Reemplaza la función setupHelpTabs por esta versión mejorada
function setupHelpTabs() {
  console.log("Setting up help tabs");

  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  // Verificar si hay elementos de pestaña
  if (tabButtons.length === 0) {
    console.error("No tab buttons found");
    return;
  }

  console.log(`Found ${tabButtons.length} tab buttons and ${tabContents.length} tab contents`);

  // Cargar contenido para ambos idiomas
  loadHelpContent('en');
  loadHelpContent('es');

  // Añadir listener para cambiar de pestaña
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const lang = button.getAttribute('data-tab');
      console.log(`Tab clicked: ${lang}`);

      // Desactivar todas las pestañas
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Activar la pestaña seleccionada
      button.classList.add('active');
      const tabContent = document.getElementById(`tab-${lang}`);
      if (tabContent) {
        tabContent.classList.add('active');
      } else {
        console.error(`Tab content not found: tab-${lang}`);
      }
    });
  });

  // Verificar la apertura del modal
  helpBtn.addEventListener('click', () => {
    console.log("Help button clicked, opening modal");
    openHelpModal();

    // Intentar activar la pestaña del idioma actual
    if (appLanguage) {
      console.log(`Setting active tab to current language: ${appLanguage}`);
      const langButton = document.querySelector(`.tab-button[data-tab="${appLanguage}"]`);

      if (langButton) {
        // Simular clic en la pestaña del idioma actual
        langButton.click();
      } else {
        console.warn(`No tab button found for language: ${appLanguage}`);
        // Activar la primera pestaña como respaldo
        const firstTab = document.querySelector('.tab-button');
        if (firstTab) {
          firstTab.click();
        }
      }
    }
  });
}

// Call this during initialization
async function init() {
  console.log("Initializing application");

  // Obtener idioma guardado o usar predeterminado
  appLanguage = localStorage.getItem('appLanguage') || 'en';
  console.log(`Stored language preference: ${appLanguage}`);

  // Cargar traducciones
  await loadUITranslation('en');
  await loadUITranslation('es');

  // Aplicar idioma
  await applyLanguage(appLanguage);

  // Inicializar pestañas de ayuda
  setupHelpTabs();

  // Configurar el botón de cambio de idioma
  setupLanguageSwitch();

  // Cargar carpetas recientes
  await loadRecentFolders();
}

// Cargar carpetas recientes
async function loadRecentFolders() {
  recentFolders = await window.api.getRecentFolders();
  updateRecentFoldersDropdown();
}

// Add this function to your renderer.js to dynamically adjust the width
function adjustDropdownWidth() {
  // Get the longest folder path
  let maxLength = 0;
  let longestPath = '';
  recentFolders.forEach(folder => {
    if (folder.length > maxLength) {
      maxLength = folder.length;
      longestPath = folder;
    }
  });

  // Create a temporary element to measure text width
  const tempElement = document.createElement('div');
  tempElement.style.position = 'absolute';
  tempElement.style.visibility = 'hidden';
  tempElement.style.whiteSpace = 'nowrap';
  tempElement.style.fontFamily = window.getComputedStyle(recentFoldersDropdown).fontFamily;
  tempElement.style.fontSize = window.getComputedStyle(recentFoldersDropdown).fontSize;
  tempElement.style.padding = '12px 16px'; // Match the padding of folder items
  tempElement.textContent = longestPath;
  document.body.appendChild(tempElement);

  // Get width needed for the content
  const requiredWidth = tempElement.offsetWidth + 20; // Extra padding for safety
  // Limit to 90% of window width, but only if necessary
  const windowLimit = Math.floor(window.innerWidth * 0.9);

  // Set min and max width
  recentFoldersDropdown.style.minWidth = '250px';
  recentFoldersDropdown.style.maxWidth = 'none'; // Remove the max-width constraint

  // Set the width to either the required width or window limit, whichever is smaller
  if (requiredWidth > windowLimit) {
    recentFoldersDropdown.style.width = `${windowLimit}px`;
  } else {
    recentFoldersDropdown.style.width = `${requiredWidth}px`;
  }

  // Clean up
  document.body.removeChild(tempElement);
}

// Actualizar el menú desplegable de carpetas recientes
function updateRecentFoldersDropdown() {
  recentFoldersDropdown.innerHTML = '';

  if (recentFolders.length === 0) {
    const noRecentItem = document.createElement('div');
    noRecentItem.className = 'folder-item';
    noRecentItem.textContent = uiTranslations[appLanguage].noRecentFolders;
    recentFoldersDropdown.appendChild(noRecentItem);
    return;
  }

  recentFolders.forEach(folder => {
    const folderItem = document.createElement('div');
    folderItem.className = 'folder-item';
    folderItem.textContent = folder;
    folderItem.title = folder; // Para mostrar la ruta completa al hacer hover

    folderItem.addEventListener('click', () => {
      currentFolder = folder;
      currentFolderEl.textContent = `${uiTranslations[appLanguage].currentFolder} ${currentFolder}`;
      loadTranslations();
      toggleRecentFolders(); // Cerrar el dropdown
    });

    recentFoldersDropdown.appendChild(folderItem);
  });

  // Add this call to adjust the width
  adjustDropdownWidth();
}

// Alternar visibilidad del menú desplegable
function toggleRecentFolders() {
  recentFoldersDropdown.classList.toggle('show');
}

// Cerrar el dropdown si se hace clic fuera de él
window.addEventListener('click', function(event) {
  if (!event.target.matches('#recentFoldersBtn') && !event.target.closest('#recentFoldersDropdown')) {
    if (recentFoldersDropdown.classList.contains('show')) {
      recentFoldersDropdown.classList.remove('show');
    }
  }
});

async function selectFolder() {
  const result = await window.api.selectFolder();

  if (!result.canceled) {
    currentFolder = result.folderPath;
    currentFolderEl.textContent = `${uiTranslations[appLanguage].currentFolder} ${currentFolder}`;
    await loadTranslations();
    await loadRecentFolders(); // Recargar la lista de carpetas recientes
  }
}

async function loadTranslations() {
  if (!currentFolder) return;

  try {
    showStatusMessage(uiTranslations[appLanguage].loading || 'Loading translations...');
    saveBtn.disabled = true;
    addTranslationBtn.disabled = true;

    const result = await window.api.loadTranslations(currentFolder);

    if (result.success) {
      translations = result.translations;
      languages = result.languages;
      flattenedTranslations = {};
      // Preparar la vista de traducciones
      renderTranslationsTable();
      populateParentKeySelect();

      saveBtn.disabled = false;
      addTranslationBtn.disabled = false;
      showStatusMessage(uiTranslations[appLanguage].loadSuccess || 'Translations loaded successfully');

      // Actualizar el texto de carpeta actual con el idioma seleccionado
      currentFolderEl.textContent = `${uiTranslations[appLanguage].currentFolder} ${currentFolder}`;
    } else {
      showStatusMessage(`Error: ${result.error}`, true, false);
    }
  } catch (error) {    console.error('Exception while loading translations:', error);
    showStatusMessage(`Error: ${result.error}`, true, false);
  }
}

function checkForTruncatedText() {
  // Check key cells
  const keyCells = document.querySelectorAll('.translation-key-cell');
  keyCells.forEach(cell => {
    // Remove previous truncated class if any
    cell.classList.remove('truncated');
    // Check if text is truncated
    if (cell.scrollWidth > cell.clientWidth) {
      cell.classList.add('truncated');
    }
  });
}

function renderTranslationsTable() {
  translationsTable.innerHTML = '';

  if (languages.length === 0) {
    translationsTable.innerHTML = `<div class="select-message">${uiTranslations[appLanguage].noTranslationsFound}</div>`;
    return;
  }

  // Crear el encabezado
  const headerRow = document.createElement('div');
  headerRow.className = 'translation-row header-row';

  const keyHeaderCell = document.createElement('div');
  keyHeaderCell.className = 'translation-key-cell';
  keyHeaderCell.textContent = uiTranslations[appLanguage].translationKey;
  headerRow.appendChild(keyHeaderCell);

  // Contenedor para valores de idioma - Mismo patrón que en las filas de datos
  const headerValuesContainer = document.createElement('div');
  headerValuesContainer.className = 'translation-values-container';

  languages.forEach(lang => {
    const langCell = document.createElement('div');
    langCell.className = 'translation-value-cell';
    langCell.textContent = lang;
    headerValuesContainer.appendChild(langCell);
  });

  headerRow.appendChild(headerValuesContainer);
  translationsTable.appendChild(headerRow);

  // Procesar y mostrar las traducciones
  const firstLang = languages[0];
  if (firstLang && translations[firstLang]) {
    renderNestedTranslations(translations[firstLang], '', translationsTable);
  }

  setTimeout(checkForTruncatedText, 100);
}

function renderNestedTranslations(obj, prefix, container) {
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (typeof value === 'object' && value !== null) {
      // Es un objeto anidado (grupo)
      const groupRow = document.createElement('div');
      groupRow.className = 'translation-row group-row';
      groupRow.dataset.key = fullKey;

      const groupKeyCell = document.createElement('div');
      groupKeyCell.className = 'translation-key-cell group-key';

      const expandIcon = document.createElement('span');
      expandIcon.className = 'expandable-icon';
      expandIcon.textContent = '▼';
      groupKeyCell.appendChild(expandIcon);
      groupKeyCell.appendChild(document.createTextNode(fullKey));

      groupRow.appendChild(groupKeyCell);

      // Add group actions instead of empty cells
      const actionsContainer = document.createElement('div');
      actionsContainer.className = 'group-actions';

      // Add a proper styled button to match the app design
      const addKeyToGroup = document.createElement('button');
      addKeyToGroup.className = 'add-to-group-btn';
      addKeyToGroup.textContent = uiTranslations[appLanguage].addKey || "Add Key";
      addKeyToGroup.title = `${uiTranslations[appLanguage].addTranslationTo || 'Add translation to'} "${fullKey}"`;
      addKeyToGroup.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent toggling the group
        openAddModal();
        // Pre-select this group as parent
        parentKeySelect.value = fullKey;
      });

      actionsContainer.appendChild(addKeyToGroup);
      groupRow.appendChild(actionsContainer);
      container.appendChild(groupRow);

      // Contenedor para claves anidadas
      const nestedContainer = document.createElement('div');
      nestedContainer.className = 'nested-keys';
      nestedContainer.dataset.parent = fullKey;
      container.appendChild(nestedContainer);

      // Renderizar recursivamente las claves anidadas
      renderNestedTranslations(value, fullKey, nestedContainer);

      // Alternar visibilidad al hacer clic
      groupKeyCell.addEventListener('click', () => {
        nestedContainer.style.display = nestedContainer.style.display === 'none' ? 'block' : 'none';
        expandIcon.textContent = nestedContainer.style.display === 'none' ? '►' : '▼';
      });
    } else {
      // Es una traducción
      flattenedTranslations[fullKey] = true;

      const translationRow = document.createElement('div');
      translationRow.className = 'translation-row';
      translationRow.dataset.key = fullKey;

      // Modificar la creación de la celda de clave para hacerla clickeable
      const keyCell = document.createElement('div');
      keyCell.className = 'translation-key-cell';
      keyCell.textContent = fullKey;
      keyCell.title = fullKey;

      // Añadir un indicador de que es clickeable
      const editIcon = document.createElement('span');
      editIcon.className = 'edit-all-icon';
      editIcon.innerHTML = '✏️';
      editIcon.title = uiTranslations[appLanguage].editAllTranslations || 'Edit all translations';
      keyCell.appendChild(editIcon);

      // Añadir evento de clic para editar todas las traducciones
      keyCell.addEventListener('click', function() {
        // Crear un modal para editar todas las traducciones
        const multiEditModal = document.createElement('div');
        multiEditModal.className = 'multi-edit-modal';

        // Añadir el div contenedor principal que falta
        const modalContent = document.createElement('div');
        modalContent.className = 'multi-edit-content';

        // Header del modal
        const modalHeader = document.createElement('div');
        modalHeader.className = 'multi-edit-header';

        const modalTitle = document.createElement('h3');
        modalTitle.textContent = `${uiTranslations[appLanguage].editKey || 'Edit key'}: ${fullKey}`;

        const closeModalBtn = document.createElement('button');
        closeModalBtn.className = 'close multi-edit-close';
        closeModalBtn.innerHTML = '&times;';

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeModalBtn);

        // Contenedor para los editores
        const editorsContainer = document.createElement('div');
        editorsContainer.className = 'multi-edit-container';

        // Crear campos para cada idioma
        const textareas = {};

        languages.forEach(lang => {
          const langContainer = document.createElement('div');
          langContainer.className = 'multi-edit-lang';

          const langHeader = document.createElement('div');
          langHeader.className = 'multi-edit-lang-header';

          const langLabel = document.createElement('div');
          langLabel.className = 'multi-edit-lang-label';
          langLabel.textContent = lang.toUpperCase();

          langHeader.appendChild(langLabel);

          // Campo de texto para el idioma
          const textarea = document.createElement('textarea');
          textarea.className = 'multi-edit-textarea';
          textarea.spellcheck = false;

          // Obtener el valor actual
          let langValue = '';
          if (translations[lang]) {
            langValue = getNestedValue(translations[lang], fullKey.split('.'));
          }
          textarea.value = langValue !== undefined ? langValue : '';

          // Guardar referencia para acceso fácil
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
        saveAllBtn.textContent = uiTranslations[appLanguage].saveAllTranslations || 'Save All Translations';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'multi-edit-cancel';
        cancelBtn.textContent = uiTranslations[appLanguage].cancel || 'Cancel';

        actionButtons.appendChild(cancelBtn);
        actionButtons.appendChild(saveAllBtn);

        // Ensamblar el modal correctamente
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(editorsContainer);
        modalContent.appendChild(actionButtons);
        multiEditModal.appendChild(modalContent);

        // Añadir al cuerpo del documento
        document.body.appendChild(multiEditModal);

        // Animar entrada
        setTimeout(() => {
          multiEditModal.classList.add('visible');
        }, 10);

        // Eventos
        closeModalBtn.addEventListener('click', closeMultiEdit);
        cancelBtn.addEventListener('click', closeMultiEdit);

        saveAllBtn.addEventListener('click', () => {
          // Guardar todos los valores
          languages.forEach(lang => {
            const newValue = textareas[lang].value;
            updateTranslationValue(lang, fullKey, newValue);

            // Actualizar el input visible en la tabla
            const input = translationRow.querySelector(`input[data-lang="${lang}"]`);
            if (input) {
              input.value = newValue;
              input.title = newValue;
            }
          });

          hasUnsavedChanges = true;
          saveBtn.disabled = false;
          closeMultiEdit();

          // Mostrar mensaje de éxito
          statusMessage.textContent = `${uiTranslations[appLanguage].updatedAllTranslations || 'Updated all translations for'}: ${fullKey}`;
        });

        // Función para cerrar el modal
        function closeMultiEdit() {
          multiEditModal.classList.remove('visible');
          setTimeout(() => {
            multiEditModal.remove();
          }, 300);
        }

        // Cerrar al hacer clic fuera
        multiEditModal.addEventListener('click', (e) => {
          if (e.target === multiEditModal) {
            closeMultiEdit();
          }
        });

        // Poner foco en el primer textarea
        if (languages.length > 0) {
          textareas[languages[0]].focus();
        }
      });

      translationRow.appendChild(keyCell);

      // Contenedor para valores de idioma
      const valuesContainer = document.createElement('div');
      valuesContainer.className = 'translation-values-container';

      // Añadir celdas para cada idioma en el mismo orden que los encabezados
      languages.forEach(lang => {
        const valueCell = document.createElement('div');
        valueCell.className = 'translation-value-cell';

        // Obtener el valor para este idioma y clave
        let langValue = '';
        if (translations[lang]) {
          langValue = getNestedValue(translations[lang], fullKey.split('.'));
        }

        // Crear el elemento input
        const input = document.createElement('input');
        input.type = 'text';
        input.value = langValue !== undefined ? langValue : '';
        input.dataset.lang = lang;
        input.dataset.key = fullKey;
        input.title = input.value;

        // Reemplazar el evento focus por un evento click
        // para controlar mejor cuándo se abre el popover
        input.addEventListener('click', function(e) {
          // Solo abrir si no hay un popover abierto ya
          if (document.querySelector('.edit-popover')) {
            return;
          }

          // Crear el popover
          const editPopover = document.createElement('div');
          editPopover.className = 'edit-popover';

          // Contenido del popover
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
          editArea.value = this.value;
          editArea.spellcheck = false;

          // Botones de acción
          const actionButtons = document.createElement('div');
          actionButtons.className = 'popover-actions';

          const saveButton = document.createElement('button');
          saveButton.className = 'save-edit';
          saveButton.textContent = uiTranslations[appLanguage].saveChanges;

          const cancelButton = document.createElement('button');
          cancelButton.className = 'cancel-edit';
          cancelButton.textContent = uiTranslations[appLanguage].cancel;

          actionButtons.appendChild(cancelButton);
          actionButtons.appendChild(saveButton);

          // Agregar todo al popover
          editPopover.appendChild(popoverHeader);
          editPopover.appendChild(editArea);
          editPopover.appendChild(actionButtons);

          // Agregar al documento y posicionar
          document.body.appendChild(editPopover);

          // Calcular posición
          const cellRect = valueCell.getBoundingClientRect();
          const popoverWidth = Math.max(350, cellRect.width * 1.5);
          editPopover.style.width = popoverWidth + 'px';
          editPopover.style.left = Math.min(
            cellRect.left,
            window.innerWidth - popoverWidth - 20
          ) + 'px';

          // Si está en la mitad inferior de la pantalla, mostrar arriba
          if (cellRect.top > window.innerHeight / 2) {
            editPopover.style.bottom = (window.innerHeight - cellRect.top + 10) + 'px';
            editPopover.classList.add('position-top');
          } else {
            editPopover.style.top = (cellRect.bottom + 10) + 'px';
            editPopover.classList.add('position-bottom');
          }

          // Animar entrada
          setTimeout(() => {
            editPopover.classList.add('visible');
          }, 10);

          // Poner foco en el área de edición
          editArea.focus();

          // Handlers de eventos
          const closePopover = (save) => {
            // Animar salida
            editPopover.classList.remove('visible');
            setTimeout(() => {
              if (save) {
                input.value = editArea.value;
                input.dispatchEvent(new Event('input'));
              }
              editPopover.remove();
            }, 200);
          };

          // Eventos para los botones
          closeButton.addEventListener('click', () => closePopover(false));
          cancelButton.addEventListener('click', () => closePopover(false));
          saveButton.addEventListener('click', () => closePopover(true));

          // Cerrar con Escape, guardar con Ctrl+Enter
          editArea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              closePopover(false);
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              closePopover(true);
            }
          });

          // Cerrar si se hace clic fuera
          const outsideClickHandler = (e) => {
            if (!editPopover.contains(e.target) && e.target !== input) {
              closePopover(true); // Guardar cambios automáticamente
              document.removeEventListener('mousedown', outsideClickHandler);
            }
          };

          // Agregar después de un pequeño retraso para evitar el clic inicial
          setTimeout(() => {
            document.addEventListener('mousedown', outsideClickHandler);
          }, 10);
        });

        // Handler normal para la entrada
        input.addEventListener('input', () => {
          // Log detallado para depuración
          console.log('--------- INPUT CHANGE ---------');
          console.log(`Language: ${lang}, Key: ${fullKey}`);
          console.log(`New value: "${input.value}"`);

          // Si la clave es common.agenda, mostrar más detalles
          if (fullKey === 'common.agenda') {
            console.log('Detailed debug for common.agenda:');
            console.log('  Before update:', translations[lang]?.common?.agenda);
          }

          // Actualizar el valor
          updateTranslationValue(lang, fullKey, input.value);

          // Verificar después de la actualización
          if (fullKey === 'common.agenda') {
            console.log('  After update:', translations[lang]?.common?.agenda);
          }

          // Código existente
          hasUnsavedChanges = true;
          saveBtn.disabled = false;
          console.log('--------------------------------');
        });

        valueCell.appendChild(input);
        valuesContainer.appendChild(valueCell);
      });

      translationRow.appendChild(valuesContainer);
      container.appendChild(translationRow);
    }
  }
}

function getNestedValue(obj, keyParts) {
  let current = obj;

  for (const part of keyParts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }

  return current;
}

function updateTranslationValue(lang, key, value) {
  // Asegurar que el objeto del idioma existe
  if (!translations[lang]) {
    translations[lang] = {};
  }

  // Dividir la clave en partes (para claves anidadas como "common.agenda")
  const keyParts = key.split('.');
  let current = translations[lang];

  // Navegar a través del objeto hasta la ubicación correcta
  for (let i = 0; i < keyParts.length - 1; i++) {
    const part = keyParts[i];
    // Crear el objeto anidado si no existe
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }

  // Establecer el valor en la ubicación final
  const lastKey = keyParts[keyParts.length - 1];
  current[lastKey] = value;

  // Marcar que hay cambios sin guardar
  hasUnsavedChanges = true;
}

function filterTranslations() {
  const searchTerm = searchInput.value.toLowerCase();

  // Obtener todas las filas de traducción
  const rows = translationsTable.querySelectorAll('.translation-row');

  rows.forEach(row => {
    const key = row.dataset.key.toLowerCase();
    const isGroup = row.classList.contains('group-row');

    // Si es un grupo, manejarlo diferente
    if (isGroup) {
      // Verificar si alguna clave hijo coincide
      const nestedContainer = translationsTable.querySelector(`.nested-keys[data-parent="${row.dataset.key}"]`);
      let hasVisibleChildren = false;

      if (nestedContainer) {
        const nestedRows = nestedContainer.querySelectorAll('.translation-row');
        nestedRows.forEach(nestedRow => {
          const nestedKey = nestedRow.dataset.key.toLowerCase();
          const nestedVisible = nestedKey.includes(searchTerm);
          nestedRow.style.display = nestedVisible ? 'flex' : 'none';
          if (nestedVisible) {
            hasVisibleChildren = true;
          }
        });
      }

      // Mostrar el grupo si su nombre coincide o tiene hijos visibles
      row.style.display = (key.includes(searchTerm) || hasVisibleChildren) ? 'flex' : 'none';

      // Mostrar el contenedor anidado si hay coincidencias
      if (nestedContainer) {
        nestedContainer.style.display = hasVisibleChildren ? 'block' : 'none';
      }
    } else {
      // Para filas normales, mostrar si la clave coincide
      row.style.display = key.includes(searchTerm) ? 'flex' : 'none';
    }
  });
}

async function saveTranslations() {
  if (!currentFolder) return;

  saveBtn.disabled = true;
  showStatusMessage(uiTranslations[appLanguage].saving || 'Saving translations...');

  try {
    // Log para depuración
    console.log('Translations to save:', translations);

    // Para cada idioma
    for (const lang of languages) {
      if (!translations[lang]) continue;

      // Verificar un valor específico para depuración
      if (translations[lang].common && translations[lang].common.agenda) {
        console.log(`Value before save: ${lang}.common.agenda =`, translations[lang].common.agenda);
      }

      await window.api.saveTranslation({
        folderPath: currentFolder,
        lang: lang,
        data: translations[lang]
      });
    }

    hasUnsavedChanges = false;
    showStatusMessage(uiTranslations[appLanguage].saveSuccess || 'All translations saved successfully');
  } catch (error) {
    showStatusMessage(`${uiTranslations[appLanguage].errorSaving || 'Error saving:'} ${error.message}`, true, false);
    console.error('Error saving translations:', error);
  } finally {
    saveBtn.disabled = false;
  }
}

function addNewLanguage() {
  const langCode = newLanguageInput.value.trim();

  if (!langCode) {
    showStatusMessage(uiTranslations[appLanguage].languageRequired || 'Please enter a language code', true, false);
    return;
  }

  if (languages.includes(langCode)) {
    showStatusMessage(uiTranslations[appLanguage].languageExists || 'Language already exists', true, false);
    return;
  }

  // Crear una nueva traducción vacía o copiar de existente
  if (languages.length > 0) {
    // Clonar la estructura del primer idioma pero con valores vacíos
    translations[langCode] = createEmptyTranslation(translations[languages[0]]);
  } else {
    translations[langCode] = {};
  }

  languages.push(langCode);
  newLanguageInput.value = '';
  renderTranslationsTable();
  showStatusMessage(`${uiTranslations[appLanguage].languageAdded || 'Added new language:'} ${langCode}`);
  hasUnsavedChanges = true;
  saveBtn.disabled = false;
}

function createEmptyTranslation(obj) {
  const result = {};

  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      result[key] = createEmptyTranslation(obj[key]);
    } else {
      result[key] = '';
    }
  }

  return result;
}

function populateParentKeySelect() {
  parentKeySelect.innerHTML = `<option value="">${uiTranslations[appLanguage].rootLevel}</option>`;

  // Obtener todas las claves de grupo
  const groups = [];

  function findGroups(obj, prefix = '') {
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        groups.push(fullKey);
        findGroups(obj[key], fullKey);
      }
    }
  }

  // Usar el primer idioma como referencia para la estructura
  if (languages.length > 0 && translations[languages[0]]) {
    findGroups(translations[languages[0]]);
  }

  // Añadir opciones para cada grupo
  groups.sort().forEach(group => {
    const option = document.createElement('option');
    option.value = group;
    option.textContent = group;
    parentKeySelect.appendChild(option);
  });
}

function openAddModal() {
  // Actualizar la lista de claves padres
  populateParentKeySelect();

  // Limpiar campos
  newKeyInput.value = '';
  newTranslationValues.innerHTML = '';

  // Añadir campos para cada idioma
  languages.forEach(lang => {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'new-translation-entry';

    const label = document.createElement('label');
    label.textContent = lang;

    const input = document.createElement('input');
    input.type = 'text';
    input.dataset.lang = lang;

    entryDiv.appendChild(label);
    entryDiv.appendChild(input);
    newTranslationValues.appendChild(entryDiv);
  });

  // Mostrar el modal
  addModal.style.display = 'block';
}

function closeModal() {
  addModal.style.display = 'none';
}

function addNewTranslation() {
  const parentKey = parentKeySelect.value;
  let newKey = newKeyInput.value.trim();

  if (!newKey) {
    alert(uiTranslations[appLanguage].keyRequired);
    return;
  }

  // Construir la key completa
  const fullKey = parentKey ? `${parentKey}.${newKey}` : newKey;

  // Verificar si la key ya existe
  if (flattenedTranslations[fullKey]) {
    alert(`${uiTranslations[appLanguage].keyExists}: "${fullKey}"`);
    return;
  }

  // Guardar los valores para cada idioma
  const inputs = newTranslationValues.querySelectorAll('input');
  inputs.forEach(input => {
    const lang = input.dataset.lang;
    const value = input.value;
    updateTranslationValue(lang, fullKey, value);
  });

  // Actualizar la interfaz
  renderTranslationsTable();
  closeModal();

  // Actualizar estado
  hasUnsavedChanges = true;
  saveBtn.disabled = false;
  statusMessage.textContent = `${uiTranslations[appLanguage].keyAdded} ${fullKey}`;

  // Expandir automáticamente hasta la nueva key
  if (parentKey) {
    const parts = parentKey.split('.');
    let currentPrefix = '';

    for (const part of parts) {
      currentPrefix = currentPrefix ? `${currentPrefix}.${part}` : part;
      const groupRow = translationsTable.querySelector(`.group-row[data-key="${currentPrefix}"]`);
      if (groupRow) {
        const nestedContainer = translationsTable.querySelector(`.nested-keys[data-parent="${currentPrefix}"]`);
        if (nestedContainer) {
          nestedContainer.style.display = 'block';
          const expandIcon = groupRow.querySelector('.expandable-icon');
          if (expandIcon) expandIcon.textContent = '▼';
        }
      }
    }
  }
}

// Añade esta función para mostrar mensajes de estado con desaparición automática
function showStatusMessage(message, isError = false, autoHide = true) {
  if (!statusMessage) return;

  statusMessage.textContent = message;

  // Limpiar cualquier temporizador anterior
  if (statusMessage._hideTimer) {
    clearTimeout(statusMessage._hideTimer);
    statusMessage._hideTimer = null;
  }

  // Auto-ocultar mensajes de éxito después de un tiempo
  if (!isError && autoHide) {
    statusMessage._hideTimer = setTimeout(() => {
      statusMessage.textContent = '';
    }, 3000); // 3 segundos antes de desaparecer
  }
}

// Inicializar la aplicación
init();