# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-06-04

### BREAKING CHANGES
- **Architecture Refactor**: Transitioned from monolithic to modular architecture
- Internal API structure changed (external functionality remains the same)

### ADDED
- **New Modular Structure**: Created `src/modules/` directory with specialized modules:
  - `translation-manager.js` - Handles translation loading, saving, and manipulation
  - `ui-manager.js` - Manages UI state and interactions
  - `table-renderer.js` - Handles table rendering and display
  - `modal-manager.js` - Manages modal dialogs
  - `column-resizer.js` - Handles table column resizing
  - `file-manager.js` - Manages file operations
  - `search-filter.js` - Handles search and filtering functionality
  - `event-handlers.js` - Manages event delegation and handling

- **Centralized State Management**: Implemented shared `appState` object:
  ```javascript
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
  ```

- **Module Orchestration System**:
  - `src/renderer.js` now serves as the main orchestrator
  - Each module receives the shared `appState` for consistent data access
  - Modules are available globally through `window.modules` for cross-module communication

### IMPROVED
- **Initialization Process**:
  - Dependency-aware initialization order
  - Better error handling during startup
  - Cleaner separation of concerns
  - Enhanced debugging capabilities with clearer module boundaries

### CHANGED
- **Code Organization**: Refactored monolithic `src/renderer.js` into modular architecture
- **State Management**: Centralized application state instead of scattered variables
- **Module Communication**: Implemented structured inter-module communication

### Technical Benefits
- **Maintainability**: Each module has a single responsibility
- **Scalability**: Easy to add new features by creating new modules
- **Testability**: Individual modules can be tested in isolation
- **Code Organization**: Related functionality is grouped together
- **Reusability**: Modules can be reused across different parts of the application

### Migration Notes
- **No breaking changes** to the user interface
- All existing functionality preserved
- Improved code organization for future development
- Enhanced debugging capabilities

---

## [1.0.0] - 2024-05-30

### ADDED
- Initial release of Translation Manager
- Basic translation file loading and editing
- Multi-language support
- File save/load functionality
- Search and filter capabilities
- Column resizing
- Modal dialogs for user interactions

### FEATURES
- Load translation files from directories
- Edit translations in a table format
- Add new languages dynamically
- Save changes to translation files
- Search and filter translation keys
- Resize table columns
- Recent folders tracking