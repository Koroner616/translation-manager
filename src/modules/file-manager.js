export class FileManager {
  constructor(appState) {
    this.state = appState;
  }

  async init() {
    await this.loadRecentFolders();
  }

  async selectFolder() {
    const result = await window.api.selectFolder();

    if (!result.canceled) {
      this.state.currentFolder = result.folderPath;
      this.updateCurrentFolderDisplay();
      await this.loadTranslations();
      await this.loadRecentFolders();
    }
  }

  async loadTranslations() {
    if (!this.state.currentFolder) return;

    if (window.modules && window.modules.translations) {
      const result = await window.modules.translations.loadTranslations(this.state.currentFolder);

      if (result.success && window.modules.table) {
        window.modules.table.renderTranslationsTable();
        if (window.modules.modals) {
          window.modules.modals.populateParentKeySelect();
        }
      }
    }
  }

  updateCurrentFolderDisplay() {
    const currentFolderEl = document.getElementById('currentFolder');
    if (currentFolderEl && this.state.currentFolder) {
      currentFolderEl.textContent = `${this.state.uiTranslations[this.state.appLanguage].currentFolder || 'Current folder'}: ${this.state.currentFolder}`;
    }
  }

  async loadRecentFolders() {
    this.state.recentFolders = await window.api.getRecentFolders();
    this.updateRecentFoldersDropdown();
  }

  updateRecentFoldersDropdown() {
    const recentFoldersDropdown = document.getElementById('recentFoldersDropdown');
    if (!recentFoldersDropdown) return;

    recentFoldersDropdown.innerHTML = '';

    if (this.state.recentFolders.length === 0) {
      const noRecentItem = document.createElement('div');
      noRecentItem.className = 'folder-item';
      noRecentItem.textContent = this.state.uiTranslations[this.state.appLanguage].noRecentFolders || 'No recent folders';
      recentFoldersDropdown.appendChild(noRecentItem);
      return;
    }

    this.state.recentFolders.forEach(folder => {
      const folderItem = document.createElement('div');
      folderItem.className = 'folder-item';
      folderItem.textContent = folder;
      folderItem.title = folder;

      folderItem.addEventListener('click', async () => {
        this.state.currentFolder = folder;
        this.updateCurrentFolderDisplay();
        await this.loadTranslations();
        this.toggleRecentFolders();
      });

      recentFoldersDropdown.appendChild(folderItem);
    });

    this.adjustDropdownWidth();
  }

  adjustDropdownWidth() {
    const recentFoldersDropdown = document.getElementById('recentFoldersDropdown');
    if (!recentFoldersDropdown) return;

    let maxLength = 0;
    let longestPath = '';
    this.state.recentFolders.forEach(folder => {
      if (folder.length > maxLength) {
        maxLength = folder.length;
        longestPath = folder;
      }
    });

    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.whiteSpace = 'nowrap';
    tempElement.style.fontFamily = window.getComputedStyle(recentFoldersDropdown).fontFamily;
    tempElement.style.fontSize = window.getComputedStyle(recentFoldersDropdown).fontSize;
    tempElement.style.padding = '12px 16px';
    tempElement.textContent = longestPath;
    document.body.appendChild(tempElement);

    const requiredWidth = tempElement.offsetWidth + 20;
    const windowLimit = Math.floor(window.innerWidth * 0.9);

    recentFoldersDropdown.style.minWidth = '250px';
    recentFoldersDropdown.style.maxWidth = 'none';

    if (requiredWidth > windowLimit) {
      recentFoldersDropdown.style.width = `${windowLimit}px`;
    } else {
      recentFoldersDropdown.style.width = `${requiredWidth}px`;
    }

    document.body.removeChild(tempElement);
  }

  toggleRecentFolders() {
    const recentFoldersDropdown = document.getElementById('recentFoldersDropdown');
    if (recentFoldersDropdown) {
      recentFoldersDropdown.classList.toggle('show');
    }
  }
}