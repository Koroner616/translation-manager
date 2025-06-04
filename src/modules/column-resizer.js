export class ColumnResizer {
  constructor(appState) {
    this.state = appState;
    this.isResizing = false;
    this.currentColumn = null;
    this.startX = 0;
    this.startWidth = 0;
    this.columnWidths = { keyColumn: 250 };
  }

  init() {
    this.loadColumnWidths();
  }

  setupColumnResizing() {
    const headerKeyCell = document.querySelector('.header-row .translation-key-cell');

    if (!headerKeyCell) return;

    headerKeyCell.addEventListener('mousemove', (e) => {
      const rect = headerKeyCell.getBoundingClientRect();
      const isNearRightEdge = e.clientX > rect.right - 8;
      headerKeyCell.style.cursor = isNearRightEdge ? 'col-resize' : 'default';
    });

    headerKeyCell.addEventListener('mouseleave', () => {
      headerKeyCell.style.cursor = 'default';
    });

    headerKeyCell.addEventListener('mousedown', (e) => {
      const rect = headerKeyCell.getBoundingClientRect();
      if (e.clientX > rect.right - 8) {
        this.startColumnResize(e, headerKeyCell);
      }
    });
  }

  startColumnResize(e, headerCell) {
    this.isResizing = true;
    this.currentColumn = headerCell;
    this.startX = e.clientX;
    this.startWidth = parseInt(window.getComputedStyle(headerCell).width, 10);

    document.body.classList.add('resizing-table');
    headerCell.classList.add('resizing');

    document.addEventListener('mousemove', this.handleColumnResize.bind(this));
    document.addEventListener('mouseup', this.stopColumnResize.bind(this));

    e.preventDefault();
    e.stopPropagation();
  }

  handleColumnResize(e) {
    if (!this.isResizing || !this.currentColumn) return;

    const dx = e.clientX - this.startX;
    const minWidth = 100;
    const maxWidth = 500;
    let newWidth = Math.max(minWidth, Math.min(maxWidth, this.startWidth + dx));

    newWidth = Math.round(newWidth);
    this.applyColumnWidth(newWidth);

    e.preventDefault();
    e.stopPropagation();
  }

  stopColumnResize(e) {
    if (!this.isResizing) return;

    this.isResizing = false;
    document.body.classList.remove('resizing-table');

    if (this.currentColumn) {
      this.currentColumn.classList.remove('resizing');
      this.currentColumn.style.cursor = 'default';
    }

    this.currentColumn = null;

    document.removeEventListener('mousemove', this.handleColumnResize.bind(this));
    document.removeEventListener('mouseup', this.stopColumnResize.bind(this));

    this.saveColumnWidths();

    e?.preventDefault();
    e?.stopPropagation();
  }

  applyColumnWidth(width) {
    const keyCells = document.querySelectorAll('.translation-key-cell:not(.group-key)');
    keyCells.forEach(cell => {
      cell.style.width = width + 'px';
    });
    this.columnWidths.keyColumn = width;
  }

  applyAllColumnWidths() {
    if (this.columnWidths.keyColumn) {
      this.applyColumnWidth(this.columnWidths.keyColumn);
    }
  }

  loadColumnWidths() {
    const saved = localStorage.getItem('translationColumnWidths');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.keyColumn) {
        this.columnWidths.keyColumn = parsed.keyColumn;
      }
    }
  }

  saveColumnWidths() {
    localStorage.setItem('translationColumnWidths', JSON.stringify({
      keyColumn: this.columnWidths.keyColumn
    }));
  }
}