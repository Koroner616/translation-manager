export class TranslationManager {
  constructor(appState) {
    this.state = appState;
  }

  async loadTranslations(folderPath) {
    if (!folderPath) return;

    try {
      const statusMessage = document.getElementById('statusMessage');
      const saveBtn = document.getElementById('saveBtn');
      const addTranslationBtn = document.getElementById('addTranslationBtn');

      if (statusMessage) statusMessage.textContent = this.state.uiTranslations[this.state.appLanguage].loading || 'Loading translations...';
      if (saveBtn) saveBtn.disabled = true;
      if (addTranslationBtn) addTranslationBtn.disabled = true;

      const result = await window.api.loadTranslations(folderPath);

      if (result.success) {
        this.state.translations = result.translations;
        this.state.languages = result.languages;
        this.state.flattenedTranslations = {};

        if (saveBtn) saveBtn.disabled = false;
        if (addTranslationBtn) addTranslationBtn.disabled = false;
        if (statusMessage) statusMessage.textContent = this.state.uiTranslations[this.state.appLanguage].loadSuccess || 'Translations loaded successfully';

        return { success: true };
      } else {
        if (statusMessage) statusMessage.textContent = `Error: ${result.error}`;
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Exception while loading translations:', error);
      const statusMessage = document.getElementById('statusMessage');
      if (statusMessage) statusMessage.textContent = `Error: ${error.message}`;
      return { success: false, error: error.message };
    }
  }

  async saveTranslations() {
    if (!this.state.currentFolder) return;

    const saveBtn = document.getElementById('saveBtn');
    const statusMessage = document.getElementById('statusMessage');

    if (saveBtn) saveBtn.disabled = true;
    if (statusMessage) statusMessage.textContent = this.state.uiTranslations[this.state.appLanguage].saving || 'Saving translations...';

    try {
      console.log('Translations to save:', this.state.translations);

      for (const lang of this.state.languages) {
        if (!this.state.translations[lang]) continue;

        await window.api.saveTranslation({
          folderPath: this.state.currentFolder,
          lang: lang,
          data: this.state.translations[lang]
        });
      }

      this.state.hasUnsavedChanges = false;
      if (statusMessage) statusMessage.textContent = this.state.uiTranslations[this.state.appLanguage].saveSuccess || 'All translations saved successfully';
    } catch (error) {
      if (statusMessage) statusMessage.textContent = `${this.state.uiTranslations[this.state.appLanguage].errorSaving || 'Error saving:'} ${error.message}`;
      console.error('Error saving translations:', error);
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  updateTranslationValue(lang, key, value) {
    if (!this.state.translations[lang]) {
      this.state.translations[lang] = {};
    }

    const keyParts = key.split('.');
    let current = this.state.translations[lang];

    for (let i = 0; i < keyParts.length - 1; i++) {
      const part = keyParts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    const lastKey = keyParts[keyParts.length - 1];
    current[lastKey] = value;

    this.state.hasUnsavedChanges = true;
  }

  getNestedValue(obj, keyParts) {
    let current = obj;

    for (const part of keyParts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }

    return current;
  }

  addNewLanguage(langCode) {
    if (!langCode) {
      const statusMessage = document.getElementById('statusMessage');
      if (statusMessage) statusMessage.textContent = this.state.uiTranslations[this.state.appLanguage].languageRequired || 'Please enter a language code';
      return false;
    }

    if (this.state.languages.includes(langCode)) {
      const statusMessage = document.getElementById('statusMessage');
      if (statusMessage) statusMessage.textContent = this.state.uiTranslations[this.state.appLanguage].languageExists || 'Language already exists';
      return false;
    }

    if (this.state.languages.length > 0) {
      this.state.translations[langCode] = this.createEmptyTranslation(this.state.translations[this.state.languages[0]]);
    } else {
      this.state.translations[langCode] = {};
    }

    this.state.languages.push(langCode);
    this.state.hasUnsavedChanges = true;

    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) statusMessage.textContent = `${this.state.uiTranslations[this.state.appLanguage].languageAdded || 'Added new language:'} ${langCode}`;

    return true;
  }

  createEmptyTranslation(obj) {
    const result = {};

    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        result[key] = this.createEmptyTranslation(obj[key]);
      } else {
        result[key] = '';
      }
    }

    return result;
  }

  addNewTranslation(parentKey, newKey, values) {
    const fullKey = parentKey ? `${parentKey}.${newKey}` : newKey;

    if (this.state.flattenedTranslations[fullKey]) {
      return { success: false, error: `${this.state.uiTranslations[this.state.appLanguage].keyExists}: "${fullKey}"` };
    }

    values.forEach(({ lang, value }) => {
      this.updateTranslationValue(lang, fullKey, value);
    });

    this.state.hasUnsavedChanges = true;
    return { success: true, key: fullKey };
  }
}