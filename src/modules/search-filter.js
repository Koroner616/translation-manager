export class SearchFilter {
  constructor(appState) {
    this.state = appState;
  }

  init() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterTranslations());
    }
  }

  filterTranslations() {
    const searchInput = document.getElementById('searchInput');
    const translationsTable = document.getElementById('translationsTable');

    if (!searchInput || !translationsTable) return;

    const searchTerm = searchInput.value.toLowerCase();
    const rows = translationsTable.querySelectorAll('.translation-row');

    rows.forEach(row => {
      const key = row.dataset.key ? row.dataset.key.toLowerCase() : '';
      const isGroup = row.classList.contains('group-row');

      if (isGroup) {
        this.handleGroupRow(row, key, searchTerm);
      } else {
        this.handleTranslationRow(row, key, searchTerm);
      }
    });
  }

  handleGroupRow(row, key, searchTerm) {
    const nestedContainer = document.querySelector(`.nested-keys[data-parent="${row.dataset.key}"]`);
    let hasVisibleChildren = false;

    if (nestedContainer) {
      const nestedRows = nestedContainer.querySelectorAll('.translation-row');
      nestedRows.forEach(nestedRow => {
        const nestedKey = nestedRow.dataset.key ? nestedRow.dataset.key.toLowerCase() : '';
        const nestedVisible = nestedKey.includes(searchTerm);
        nestedRow.style.display = nestedVisible ? 'flex' : 'none';
        if (nestedVisible) {
          hasVisibleChildren = true;
        }
      });
    }

    const shouldShowGroup = key.includes(searchTerm) || hasVisibleChildren;
    row.style.display = shouldShowGroup ? 'flex' : 'none';

    if (nestedContainer) {
      nestedContainer.style.display = hasVisibleChildren ? 'block' : 'none';
    }
  }

  handleTranslationRow(row, key, searchTerm) {
    const visible = key.includes(searchTerm);
    row.style.display = visible ? 'flex' : 'none';
  }

  clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = '';
      this.filterTranslations();
    }
  }
}