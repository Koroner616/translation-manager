const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');

// Configuración para almacenar las carpetas recientes
const userDataPath = app.getPath('userData');
const prefsPath = path.join(userDataPath, 'prefs.json');

// Función para cargar las preferencias
async function loadPrefs() {
  try {
    if (await fs.pathExists(prefsPath)) {
      return await fs.readJson(prefsPath);
    }
    return { recentFolders: [] };
  } catch (error) {
    console.error('Error loading preferences:', error);
    return { recentFolders: [] };
  }
}

// Función para guardar las preferencias
async function savePrefs(prefs) {
  try {
    await fs.writeJson(prefsPath, prefs, { spaces: 2 });
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  
  // Descomentar esta línea para abrir DevTools automáticamente
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  // Verificar permisos y acceso a directorios importantes
  const appDir = app.getAppPath();
  const assetsDir = path.join(appDir, 'assets');

  console.log('App directory:', appDir);
  console.log('User data directory:', userDataPath);
  console.log('Assets directory exists:', fs.existsSync(assetsDir));

  try {
    const testFile = path.join(userDataPath, 'write-test.txt');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('Write permissions verified for user data directory');
  } catch (error) {
    console.error('Error writing to user data directory:', error);
  }

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Comunicación con el renderer
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return { canceled: true };
  }
  
  const folderPath = result.filePaths[0];

  // Guardar en carpetas recientes
  const prefs = await loadPrefs();
  let recentFolders = prefs.recentFolders || [];

  // Remover si ya existe para evitar duplicados
  recentFolders = recentFolders.filter(folder => folder !== folderPath);

  // Añadir al principio
  recentFolders.unshift(folderPath);

  // Limitar a 10 carpetas recientes
  if (recentFolders.length > 10) {
    recentFolders = recentFolders.slice(0, 10);
  }

  await savePrefs({ ...prefs, recentFolders });

  return {
    canceled: false,
    folderPath: folderPath
  };
});

// Obtener carpetas recientes
ipcMain.handle('get-recent-folders', async () => {
  const prefs = await loadPrefs();
  return prefs.recentFolders || [];
});

ipcMain.handle('load-translations', async (event, folderPath) => {
  try {
    const files = await fs.readdir(folderPath);
    const translations = {};
    const languages = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const lang = file.replace('.json', '');
        languages.push(lang);
        const filePath = path.join(folderPath, file);
        translations[lang] = await fs.readJson(filePath);
      }
    }

    return { success: true, translations, languages };
  } catch (error) {
    console.error('Error loading translations:', error);
    return { success: false, error: error.message };
  }
});

// Reescribe el manejador de guardado de traducciones para asegurar que funciona correctamente
ipcMain.handle('save-translation', async (event, { folderPath, lang, data }) => {
  try {
    console.log(`Saving translation for ${lang} to ${folderPath}`);

    if (!folderPath || !lang || !data) {
      return { success: false, error: 'Missing required parameters' };
    }

    const filePath = path.join(folderPath, `${lang}.json`);

    // Guardar directamente sin crear copias de seguridad
    await fs.writeJson(filePath, data, { spaces: 2 });
    console.log(`File saved: ${filePath}`);

    return { success: true };
  } catch (error) {
    console.error('Error saving translation:', error);
    return { success: false, error: error.message };
  }
});

// Añade este manejador alternativo que usa fs nativo en lugar de fs-extra
ipcMain.handle('save-translation-alt', async (event, { folderPath, lang, data }) => {
  try {
    console.log(`[SAVE-ALT] Trying alternative save method for ${lang}`);

    if (!folderPath || !lang || !data) {
      return { success: false, error: 'Missing required parameters' };
    }

    const filePath = path.join(folderPath, `${lang}.json`);
    console.log(`[SAVE-ALT] Full path: ${filePath}`);

    // Usar el módulo fs nativo
    const fs = require('fs');

    // Convertir el objeto a JSON con formato
    const jsonContent = JSON.stringify(data, null, 2);

    // Escribir el archivo de forma síncrona
    fs.writeFileSync(filePath, jsonContent, 'utf8');

    // Verificar que se escribió
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`[SAVE-ALT] File saved successfully. Size: ${stats.size} bytes`);
      return { success: true };
    } else {
      return { success: false, error: 'File not created' };
    }
  } catch (error) {
    console.error(`[SAVE-ALT] Error in alternative save: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Añade a las funciones disponibles en ipcMain
ipcMain.handle('get-available-ui-languages', async () => {
  try {
    const translationsDir = path.join(__dirname, 'assets', 'translations');
    const files = await fs.readdir(translationsDir);
    // Filtrar solo archivos JSON y extraer el código de idioma del nombre del archivo
    const languages = files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    return { success: true, languages };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Añade estos manejadores IPC
ipcMain.handle('load-ui-translation', async (event, lang) => {
  try {
    const filePath = path.join(__dirname, 'assets', 'translations', `${lang}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`Translation file not found: ${filePath}`);
      return { success: false, error: 'Translation file not found' };
    }

    const data = await fs.readJson(filePath);
    return { success: true, data };
  } catch (error) {
    console.error('Error loading UI translation:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-help-content', async (event, lang) => {
  try {
    const filePath = path.join(__dirname, 'assets', 'help', `${lang}.html`);

    if (!fs.existsSync(filePath)) {
      console.log(`Help file not found: ${filePath}`);
      return { success: false, error: 'Help file not found' };
    }

    const data = await fs.readFile(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    console.error('Error loading help content:', error);
    return { success: false, error: error.message };
  }
});
