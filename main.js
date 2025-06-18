// Main process file
const electron = require('electron');
const { app, BrowserWindow, dialog } = electron;
const ipcMain = electron.ipcMain;
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

// Global reference to the main window
let mainWindow;

// Get user data directory
const getUserDataPath = () => {
  const userDataPath = path.join(app.getPath('userData'), 'notes');

  // Create directory if it doesn't exist
  try {
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create user data directory:', err);
  }

  return userDataPath;
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    frame: false,
    transparent: false,
    backgroundColor: '#0c0c0e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');

  // Handle window control events from renderer
  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });

  ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('close-window', () => {
    mainWindow.close();
  });

  // Handle app quit with confirmation
  mainWindow.on('close', (e) => {
    mainWindow.webContents.send('app-before-quit');
  });
}

// Handle file system operations
ipcMain.handle('save-file', async (event, { filePath, content }) => {
  try {
    // If no specific path is provided, use the user data directory
    if (!filePath) {
      return { success: false, error: 'No file path provided' };
    }

    // If path is relative, make it absolute using user data directory
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(getUserDataPath(), filePath);
    }

    // Create directory if it doesn't exist
    const directory = path.dirname(filePath);
    try {
      await access(directory);
    } catch (err) {
      await mkdir(directory, { recursive: true });
    }

    // Write the file
    await writeFile(filePath, content, 'utf8');
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-file', async (event, { filePath }) => {
  try {
    // If path is relative, make it absolute using user data directory
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(getUserDataPath(), filePath);
    }

    const content = await readFile(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    console.error('Error loading file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: options.title || 'Save Note',
      defaultPath: options.defaultPath || getUserDataPath(),
      filters: options.filters || [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'Markdown Files', extensions: ['md'] },
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['createDirectory']
    });

    return result;
  } catch (error) {
    console.error('Error showing save dialog:', error);
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: options.title || 'Open Note',
      defaultPath: options.defaultPath || getUserDataPath(),
      filters: options.filters || [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'Markdown Files', extensions: ['md'] },
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    return result;
  } catch (error) {
    console.error('Error showing open dialog:', error);
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle('get-app-path', async () => {
  return getUserDataPath();
});

app.whenReady().then(() => {
  createWindow();
  
  // Register IPC handlers after window creation
  ipcMain.handle('create-directory', async (event, dirPath) => {
    try {
      const fullPath = path.join(getUserDataPath(), dirPath);
      await mkdir(fullPath, { recursive: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});