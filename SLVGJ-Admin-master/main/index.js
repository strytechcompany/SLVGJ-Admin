// main/index.js
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

import startServer from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1100,
    minHeight: 650,
    title: "Gilded Admin",
    backgroundColor: '#ffffff',
    show: false,                    // Hide until maximized
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    }
  });

  mainWindow.loadURL('http://localhost:5173');

  // Maximize the window properly when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.setFullScreen(false);
    mainWindow.show();

    // Force open DevTools automatically (this is the most reliable way)
    mainWindow.webContents.openDevTools();
  });

  // Remove default menu bar for cleaner look (optional but recommended)
  mainWindow.setMenu(null);
}

app.whenReady().then(async () => {
  console.log("Starting Express server...");
  startServer();

  // Wait a bit for the backend to start
  await new Promise(resolve => setTimeout(resolve, 1500));

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});