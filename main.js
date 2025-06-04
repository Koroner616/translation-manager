const path = require('path');
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs-extra'); // Asegúrate de usar fs-extra, no fs nativo

// Determina si la app está empaquetada o en desarrollo
const isPackaged = app.isPackaged;

// Obtiene la ruta base de la aplicación
function getBasePath() {
  if (!isPackaged) {
    return __dirname; // En desarrollo, usa __dirname
  }

  // En producción
  if (process.platform === 'linux') {
    // En Linux, primero intenta con el directorio estándar
    const linuxPath = '/opt/Translation Manager';
    if (fs.existsSync(linuxPath)) {
      return linuxPath;
    }
  }

  // Para otros sistemas o como fallback
  return path.dirname(app.getPath('exe'));
}

const basePath = getBasePath();

// Función para resolver rutas relativas al directorio de la app
function resolveAppPath(relativePath) {
  // En producción, no necesitamos prefijar con 'src/' para archivos en src
  if (isPackaged) {
    // Si la ruta ya incluye 'src/', no la modifiques
    if (relativePath.startsWith('src/')) {
      return path.join(app.getAppPath(), relativePath);
    }

    // Para assets y otros directorios en la raíz
    return path.join(app.getAppPath(), relativePath);
  }

  // En desarrollo, usar __dirname
  return path.join(__dirname, relativePath);
}

// Añade un log para depuración
console.log('Base application path:', basePath);

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
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Cargar index.html desde la ruta correcta
  mainWindow.loadFile(path.join(app.getAppPath(), 'src', 'index.html'));
}

app.whenReady().then(() => {
  console.log('App Path:', app.getAppPath());

  // Verificar existencia de archivos/directorios clave
  const paths = [
    '',
    'src',
    'src/index.html',
    'assets',
    'assets/translations',
    'preload.js'
  ];

  paths.forEach(p => {
    const fullPath = path.join(app.getAppPath(), p);
    console.log(`Path ${fullPath} exists: ${fs.existsSync(fullPath)}`);
  });

  // Verificar permisos y acceso a directorios importantes
  const appDir = app.getAppPath();
  console.log('App directory:', appDir);
  console.log('User data directory:', userDataPath);

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

    // Usar el módulo fs nativo con un nombre diferente para evitar conflictos
    const fsNative = require('fs');

    // Convertir el objeto a JSON con formato
    const jsonContent = JSON.stringify(data, null, 2);

    // Escribir el archivo de forma síncrona
    fsNative.writeFileSync(filePath, jsonContent, 'utf8');

    // Verificar que se escribió
    if (fsNative.existsSync(filePath)) {
      const stats = fsNative.statSync(filePath);
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
    const translationsDir = resolveAppPath('assets/translations');
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
    const filePath = resolveAppPath(`assets/translations/${lang}.json`);
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
    const filePath = resolveAppPath(`assets/help/${lang}.html`);
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