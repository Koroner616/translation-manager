// Importar todos los módulos
import { UIManager } from './modules/ui-manager.js';
import { TranslationManager } from './modules/translation-manager.js';
import { TableRenderer } from './modules/table-renderer.js';
import { ModalManager } from './modules/modal-manager.js';
import { ColumnResizer } from './modules/column-resizer.js';
import { FileManager } from './modules/file-manager.js';
import { SearchFilter } from './modules/search-filter.js';
import { EventHandlers } from './modules/event-handlers.js';

// Variables globales compartidas
export const appState = {
  currentFolder: null,
  translations: {},
  languages: [],
  hasUnsavedChanges: false,
  flattenedTranslations: {},
  recentFolders: [],
  appLanguage: 'en',
  uiTranslations: { en: {}, es: {} }
};

// Instancias de los módulos (disponibles globalmente)
window.modules = {
  ui: new UIManager(appState),
  translations: new TranslationManager(appState),
  table: new TableRenderer(appState),
  modals: new ModalManager(appState),
  columns: new ColumnResizer(appState),
  files: new FileManager(appState),
  search: new SearchFilter(appState),
  events: new EventHandlers(appState)
};

// Exportar para uso en otros módulos
export const modules = window.modules;

// Inicialización principal
async function init() {
  console.log("Initializing Translation Manager");

  try {
    // Inicializar en orden de dependencias
    await modules.ui.init();
    await modules.files.init();
    modules.modals.init();
    modules.search.init();
    modules.columns.init();
    modules.events.init();

    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Error during initialization:", error);
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
      statusMessage.textContent = `Initialization error: ${error.message}`;
    }
  }
}

// Manejar errores no capturados
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  const statusMessage = document.getElementById('statusMessage');
  if (statusMessage) {
    statusMessage.textContent = `Error: ${event.reason.message || 'Unknown error occurred'}`;
  }
});

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.appState = appState;