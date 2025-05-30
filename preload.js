const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getRecentFolders: () => ipcRenderer.invoke('get-recent-folders'),
  loadTranslations: (folderPath) => ipcRenderer.invoke('load-translations', folderPath),
  saveTranslation: (data) => ipcRenderer.invoke('save-translation', data),
  saveTranslationAlt: (data) => ipcRenderer.invoke('save-translation-alt', data),
  loadUITranslation: (lang) => ipcRenderer.invoke('load-ui-translation', lang),
  loadHelpContent: (lang) => ipcRenderer.invoke('load-help-content', lang)
});