export class TableRenderer {
  constructor(appState) {
    this.state = appState
  }

  renderTranslationsTable() {
    const translationsTable = document.getElementById('translationsTable')
    if (!translationsTable) return

    translationsTable.innerHTML = ''

    if (this.state.languages.length === 0) {
      translationsTable.innerHTML = `<div class="select-message">${this.state.uiTranslations[this.state.appLanguage].noTranslationsFound || 'No translations found'}</div>`
      return
    }

    // Crear encabezado
    this.createHeader(translationsTable)

    // Renderizar traducciones
    const firstLang = this.state.languages[0]
    if (firstLang && this.state.translations[firstLang]) {
      this.renderNestedTranslations(this.state.translations[firstLang], '', translationsTable)
    }

    // Configurar funcionalidades adicionales
    setTimeout(() => {
      this.checkForTruncatedText()
      // Trigger column resizing setup from the main modules
      if (window.modules && window.modules.columns) {
        window.modules.columns.setupColumnResizing()
        window.modules.columns.applyAllColumnWidths()
      }
    }, 100)
  }

  createHeader(container) {
    const headerRow = document.createElement('div')
    headerRow.className = 'translation-row header-row'

    const keyHeaderCell = document.createElement('div')
    keyHeaderCell.className = 'translation-key-cell'
    keyHeaderCell.textContent = this.state.uiTranslations[this.state.appLanguage].translationKey || 'Translation Key'
    headerRow.appendChild(keyHeaderCell)

    const headerValuesContainer = document.createElement('div')
    headerValuesContainer.className = 'translation-values-container'

    this.state.languages.forEach(lang => {
      const langCell = document.createElement('div')
      langCell.className = 'translation-value-cell'
      langCell.textContent = lang
      headerValuesContainer.appendChild(langCell)
    })

    headerRow.appendChild(headerValuesContainer)
    container.appendChild(headerRow)
  }

  renderNestedTranslations(obj, prefix, container) {
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      const value = obj[key]

      if (typeof value === 'object' && value !== null) {
        this.renderGroupRow(fullKey, container)
        this.renderNestedContainer(fullKey, value, container)
      } else {
        this.renderTranslationRow(fullKey, container)
      }
    }
  }

  renderGroupRow(fullKey, container) {
    const groupRow = document.createElement('div')
    groupRow.className = 'translation-row group-row'
    groupRow.dataset.key = fullKey

    const groupKeyCell = document.createElement('div')
    groupKeyCell.className = 'translation-key-cell group-key'

    const expandIcon = document.createElement('span')
    expandIcon.className = 'expandable-icon'
    expandIcon.textContent = '▼'
    groupKeyCell.appendChild(expandIcon)
    groupKeyCell.appendChild(document.createTextNode(fullKey))

    groupRow.appendChild(groupKeyCell)

    const actionsContainer = document.createElement('div')
    actionsContainer.className = 'group-actions'

    const addKeyToGroup = document.createElement('button')
    addKeyToGroup.className = 'add-to-group-btn'
    addKeyToGroup.textContent = this.state.uiTranslations[this.state.appLanguage].addKey || "Add Key"
    addKeyToGroup.title = `${this.state.uiTranslations[this.state.appLanguage].addTranslationTo || 'Add translation to'} "${fullKey}"`

    addKeyToGroup.addEventListener('click', (e) => {
      e.stopPropagation()
      if (window.modules && window.modules.modals) {
        window.modules.modals.openAddModal(fullKey)
      }
    })

    actionsContainer.appendChild(addKeyToGroup)
    groupRow.appendChild(actionsContainer)
    container.appendChild(groupRow)

    // Event listener para expandir/contraer
    groupKeyCell.addEventListener('click', () => {
      const nestedContainer = container.querySelector(`.nested-keys[data-parent="${fullKey}"]`)
      if (nestedContainer) {
        const isHidden = nestedContainer.style.display === 'none'
        nestedContainer.style.display = isHidden ? 'block' : 'none'
        expandIcon.textContent = isHidden ? '▼' : '►'
      }
    })
  }

  renderNestedContainer(fullKey, value, container) {
    const nestedContainer = document.createElement('div')
    nestedContainer.className = 'nested-keys'
    nestedContainer.dataset.parent = fullKey
    container.appendChild(nestedContainer)

    this.renderNestedTranslations(value, fullKey, nestedContainer)
  }

  renderTranslationRow(fullKey, container) {
    this.state.flattenedTranslations[fullKey] = true

    const translationRow = document.createElement('div')
    translationRow.className = 'translation-row'
    translationRow.dataset.key = fullKey

    // Crear celda de clave
    const keyCell = this.createKeyCell(fullKey, translationRow)
    translationRow.appendChild(keyCell)

    // Crear celdas de valores
    const valuesContainer = this.createValuesContainer(fullKey, translationRow)
    translationRow.appendChild(valuesContainer)

    container.appendChild(translationRow)
  }

  createKeyCell(fullKey, translationRow) {
    const keyCell = document.createElement('div')
    keyCell.className = 'translation-key-cell'
    keyCell.textContent = fullKey
    keyCell.title = fullKey

    const editIcon = document.createElement('span')
    editIcon.className = 'edit-all-icon'
    editIcon.innerHTML = '✏️'
    editIcon.title = this.state.uiTranslations[this.state.appLanguage].editAllTranslations || 'Edit all translations'
    keyCell.appendChild(editIcon)

    keyCell.addEventListener('click', () => {
      if (window.modules && window.modules.modals) {
        window.modules.modals.openMultiEditModal(fullKey, translationRow)
      }
    })

    return keyCell
  }

  createValuesContainer(fullKey, translationRow) {
    const valuesContainer = document.createElement('div')
    valuesContainer.className = 'translation-values-container'

    this.state.languages.forEach(lang => {
      const valueCell = document.createElement('div')
      valueCell.className = 'translation-value-cell'

      let langValue = ''
      if (this.state.translations[lang]) {
        langValue = window.modules.translations.getNestedValue(this.state.translations[lang], fullKey.split('.'))
      }

      const input = this.createTranslationInput(lang, fullKey, langValue, valueCell)
      valueCell.appendChild(input)
      valuesContainer.appendChild(valueCell)
    })

    return valuesContainer
  }

  createTranslationInput(lang, fullKey, langValue, valueCell) {
    const input = document.createElement('input')
    input.type = 'text'
    input.value = langValue !== undefined ? langValue : ''
    input.dataset.lang = lang
    input.dataset.key = fullKey
    input.title = input.value

    input.addEventListener('click', (e) => {
      if (document.querySelector('.edit-popover')) return

      if (window.modules && window.modules.modals) {
        window.modules.modals.openEditPopover(input, valueCell, lang)
      }
    })

    input.addEventListener('input', () => {
      console.log(`Updating ${lang}.${fullKey} = "${input.value}"`)

      if (window.modules && window.modules.translations) {
        window.modules.translations.updateTranslationValue(lang, fullKey, input.value)
      }

      this.state.hasUnsavedChanges = true
      const saveBtn = document.getElementById('saveBtn')
      if (saveBtn) saveBtn.disabled = false
    })

    return input
  }

  checkForTruncatedText() {
    const keyCells = document.querySelectorAll('.translation-key-cell')
    keyCells.forEach(cell => {
      cell.classList.remove('truncated')
      if (cell.scrollWidth > cell.clientWidth) {
        cell.classList.add('truncated')
      }
    })
  }
}