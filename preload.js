// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'electron',
    {
        ipcRenderer: {
            send: (channel, data) => {
                // Whitelist channels
                const validChannels = [
                    'minimize-window',
                    'maximize-window',
                    'close-window',
                    'save-file',
                    'load-file',
                    'export-file',
                    'show-save-dialog',
                    'show-open-dialog',
                    'check-for-updates',
                    'app-before-quit'
                ];
                if (validChannels.includes(channel)) {
                    ipcRenderer.send(channel, data);
                }
            },
            invoke: (channel, data) => {
                const validChannels = [
                    'save-file',
                    'load-file',
                    'show-save-dialog',
                    'show-open-dialog',
                    'get-app-path'
                ];
                if (validChannels.includes(channel)) {
                    return ipcRenderer.invoke(channel, data);
                }
                return Promise.reject(new Error(`Invalid channel: ${channel}`));
            },
            receive: (channel, func) => {
                const validChannels = [
                    'from-main',
                    'file-saved',
                    'file-loaded',
                    'save-dialog-selected',
                    'open-dialog-selected',
                    'app-before-quit'
                ];
                if (validChannels.includes(channel)) {
                    // Deliberately strip event as it includes `sender`
                    ipcRenderer.on(channel, (event, ...args) => func(...args));
                }
            },
            removeListener: (channel, func) => {
                const validChannels = [
                    'from-main',
                    'file-saved',
                    'file-loaded',
                    'save-dialog-selected',
                    'open-dialog-selected',
                    'app-before-quit'
                ];
                if (validChannels.includes(channel)) {
                    ipcRenderer.removeListener(channel, func);
                }
            }
        }
    }
);
