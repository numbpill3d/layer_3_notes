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
                const validChannels = ['minimize-window', 'maximize-window', 'close-window'];
                if (validChannels.includes(channel)) {
                    ipcRenderer.send(channel, data);
                }
            },
            receive: (channel, func) => {
                const validChannels = ['from-main'];
                if (validChannels.includes(channel)) {
                    // Deliberately strip event as it includes `sender` 
                    ipcRenderer.on(channel, (event, ...args) => func(...args));
                }
            }
        }
    }
);
