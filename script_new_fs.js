// Global variables
let editor, notePreview, formatToolbar, statusText, connectionStatus, uploadIcon, downloadIcon;
let saveModal, loadModal, encryptModal, decryptModal, linkModal, imageModal, metadataModal, folderModal, exportModal;
let fileList, folderSelect, tagsInput, encryptionKeyInput, decryptionKeyInput;
let linkTypeSelect, noteNameSelect, urlInput, linkTextInput;
let imageUrlInput, imageAltInput;
let fontSelect, colorPicker;
let notificationsContainer;
let sidebarToggle, foldersContainer, tagsContainer, transmissionLog;
let widgetSelector, widgetPanels;
let voidraneFooter;

// State variables
let currentFilename = '';
let currentFolder = 'root';
let currentTags = [];
let currentMetadata = {};
let currentFont = 'default';
let isPreviewMode = false;
let isEncrypted = false;
let isSidebarOpen = true;
let hasUnsavedChanges = false;
let lastSavedContent = '';
let lastAutoSaveTime = 0;
const AUTO_SAVE_INTERVAL = 60000; // 1 minute

// Data storage
let folders = {};
let allTags = {};
let noteLinks = {};

// Initialize the application
function init() {
    // Get DOM elements
    editor = document.getElementById('editor');
    notePreview = document.getElementById('notePreview');
    formatToolbar = document.getElementById('formatToolbar');
    statusText = document.getElementById('status-text');
    connectionStatus = document.getElementById('connection-status');
    uploadIcon = document.getElementById('upload-icon');
    downloadIcon = document.getElementById('download-icon');
    saveModal = document.getElementById('saveModal');
    loadModal = document.getElementById('loadModal');
    encryptModal = document.getElementById('encryptModal');
    decryptModal = document.getElementById('decryptModal');
    linkModal = document.getElementById('linkModal');
    imageModal = document.getElementById('imageModal');
    metadataModal = document.getElementById('metadataModal');
    folderModal = document.getElementById('folderModal');
    exportModal = document.getElementById('exportModal');
    fileList = document.getElementById('fileList');
    folderSelect = document.getElementById('folderSelect');
    tagsInput = document.getElementById('tags');
    encryptionKeyInput = document.getElementById('encryption-key');
    decryptionKeyInput = document.getElementById('decrypt-key');
    encryptKeyInput = document.getElementById('encrypt-key');
    linkTypeSelect = document.getElementById('linkType');
    noteNameSelect = document.getElementById('noteNameSelect');
    urlInput = document.getElementById('url');
    linkTextInput = document.getElementById('linkText');
    imageUrlInput = document.getElementById('imageUrl');
    imageAltInput = document.getElementById('imageAlt');
    fontSelect = document.getElementById('fontSelect');
    colorPicker = document.getElementById('colorPicker');
    notificationsContainer = document.getElementById('notifications');
    sidebarToggle = document.getElementById('sidebarToggle');
    foldersContainer = document.getElementById('foldersContainer');
    tagsContainer = document.getElementById('tagsContainer');
    transmissionLog = document.getElementById('transmissionLog');
    widgetSelector = document.getElementById('widgetSelector');
    widgetPanels = document.querySelectorAll('.widget-panel');
    voidraneFooter = document.getElementById('voidraneFooter');

    // Set up event listeners for buttons
    document.getElementById('newBtn').addEventListener('click', createNewNote);
    document.getElementById('saveBtn').addEventListener('click', openSaveModal);
    document.getElementById('loadBtn').addEventListener('click', openLoadModal);
    document.getElementById('encryptBtn').addEventListener('click', openEncryptModal);
    document.getElementById('decryptBtn').addEventListener('click', openDecryptModal);
    document.getElementById('formatBtn').addEventListener('click', toggleFormatToolbar);
    document.getElementById('linkBtn').addEventListener('click', openLinkModal);
    document.getElementById('imageBtn').addEventListener('click', openImageModal);
    document.getElementById('previewBtn').addEventListener('click', togglePreview);
    document.getElementById('metadataBtn').addEventListener('click', openMetadataModal);
    document.getElementById('exportBtn').addEventListener('click', openExportModal);
    document.getElementById('createFolderBtn').addEventListener('click', openFolderModal);

    // Set up event listeners for modal buttons
    document.getElementById('confirmSaveBtn').addEventListener('click', saveNote);
    document.getElementById('cancelSaveBtn').addEventListener('click', () => closeModal(saveModal));
    document.getElementById('cancelLoadBtn').addEventListener('click', () => closeModal(loadModal));
    document.getElementById('confirmEncryptBtn').addEventListener('click', encryptText);
    document.getElementById('cancelEncryptBtn').addEventListener('click', () => closeModal(encryptModal));
    document.getElementById('confirmDecryptBtn').addEventListener('click', decryptText);
    document.getElementById('cancelDecryptBtn').addEventListener('click', () => closeModal(decryptModal));
    document.getElementById('confirmLinkBtn').addEventListener('click', addLink);
    document.getElementById('cancelLinkBtn').addEventListener('click', () => closeModal(linkModal));
    document.getElementById('confirmImageBtn').addEventListener('click', addImage);
    document.getElementById('cancelImageBtn').addEventListener('click', () => closeModal(imageModal));
    document.getElementById('closeMetadataBtn').addEventListener('click', () => closeModal(metadataModal));
    document.getElementById('addCustomFieldBtn').addEventListener('click', addCustomMetadataField);
    document.getElementById('confirmFolderBtn').addEventListener('click', createFolder);
    document.getElementById('cancelFolderBtn').addEventListener('click', () => closeModal(folderModal));
    document.getElementById('confirmExportBtn').addEventListener('click', exportNote);
    document.getElementById('cancelExportBtn').addEventListener('click', () => closeModal(exportModal));
    document.getElementById('exportAllBtn').addEventListener('click', exportAllNotes);

    // Set up event listeners for format toolbar buttons
    const formatButtons = formatToolbar.querySelectorAll('[data-format]');
    formatButtons.forEach(button => {
        button.addEventListener('click', () => applyFormat(button.dataset.format, button.dataset.color || button.dataset.size));
    });

    // Set up color picker
    const colorOptions = colorPicker.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', () => applyFormat('color', option.dataset.color));
    });

    // Set up font selector
    fontSelect.addEventListener('change', () => {
        currentFont = fontSelect.value;
        editor.className = currentFont === 'default' ? '' : `font-${currentFont}`;
        currentMetadata.font = currentFont;
    });

    // Set up link type selector
    linkTypeSelect.addEventListener('change', () => {
        const isNoteLink = linkTypeSelect.value === 'note';
        document.getElementById('noteNameGroup').style.display = isNoteLink ? 'block' : 'none';
        document.getElementById('urlGroup').style.display = isNoteLink ? 'none' : 'block';
    });

    // Set up sidebar toggle
    sidebarToggle.addEventListener('click', toggleSidebar);

    // Set up widget selector
    const widgetOptions = widgetSelector.querySelectorAll('.widget-option');
    widgetOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active class from all options and panels
            widgetOptions.forEach(opt => opt.classList.remove('active'));
            widgetPanels.forEach(panel => panel.classList.remove('active'));

            // Add active class to selected option and panel
            option.classList.add('active');
            document.getElementById(`${option.dataset.widget}Widget`).classList.add('active');
        });
    });

    // Set up editor events
    editor.addEventListener('input', () => {
        hasUnsavedChanges = editor.value !== lastSavedContent;
        if (isPreviewMode) {
            updatePreview();
        }

        // Auto-save if enough time has passed
        const now = Date.now();
        if (hasUnsavedChanges && currentFilename && (now - lastAutoSaveTime > AUTO_SAVE_INTERVAL)) {
            autoSaveNote();
            lastAutoSaveTime = now;
        }
    });

    // Set up keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Set up window close confirmation
    window.electron.ipcRenderer.receive('app-before-quit', () => {
        if (hasUnsavedChanges) {
            if (confirm('You have unsaved changes. Save before closing?')) {
                openSaveModal();
            }
        }
    });

    // Load data from localStorage
    loadFolders();
    loadTags();
    loadNoteLinks();

    // Initialize UI
    updateFoldersUI();
    updateTagsUI();

    // Create a new note
    createNewNote();

    // Start session timer
    startSessionTimer();

    // Add initial log entry
    addLogEntry('Interface initialized');

    // Set up glitch effect for voidrane footer
    setupVoidraneFooter();
}

// Create a new note
function createNewNote() {
    editor.value = '';
    currentFilename = '';
    currentFolder = 'root';
    currentTags = [];
    currentMetadata = {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        font: 'default'
    };
    isEncrypted = false;
    lastSavedContent = '';
    hasUnsavedChanges = false;

    // Reset font
    currentFont = 'default';
    fontSelect.value = 'default';
    editor.className = '';

    // Exit preview mode if active
    if (isPreviewMode) {
        togglePreview();
    }

    showNotification("New note created", "success");
}

// Open save modal
function openSaveModal() {
    // Populate filename field with current filename
    document.getElementById('filename').value = currentFilename || '';

    // Populate folder select with current folder
    folderSelect.value = currentFolder || 'root';

    // Populate tags field with current tags
    tagsInput.value = currentTags.join(', ');

    // Clear encryption key field
    encryptionKeyInput.value = '';

    openModal(saveModal);
}

// Save note
async function saveNote() {
    try {
        const filenameInput = document.getElementById('filename');
        let filename = filenameInput.value.trim();

        if (!filename) {
            showNotification("Filename is required", "error");
            return;
        }

        // Add .txt extension if not present
        if (!filename.includes('.')) {
            filename += '.txt';
        }

        const folder = folderSelect.value;
        const tags = tagsInput.value.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        const encryptionKey = encryptionKeyInput.value;

        simulateNetworkActivity(true);
        setStatusText("Saving note...");

        // Update metadata
        currentMetadata.modified = new Date().toISOString();
        currentMetadata.font = currentFont;

        // Get content
        let content = editor.value;
        let encryptedContent = isEncrypted;

        // Encrypt content if encryption key is provided
        if (encryptionKey) {
            content = await encrypt(content, encryptionKey);
            encryptedContent = true;
        }

        // Get existing files
        const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');

        // Check if we're changing filename for backlinks
        if (currentFilename && currentFilename !== filename) {
            // Update backlinks to reflect new filename
            updateBacklinksOnRename(currentFilename, filename);
        }

        // Update note data in localStorage (for compatibility)
        files[filename] = {
            content,
            encrypted: encryptedContent,
            folder,
            tags,
            metadata: currentMetadata,
            timestamp: Date.now()
        };

        localStorage.setItem('layer3-files', JSON.stringify(files));

        // Save to file system if in Electron environment
        if (window.electron) {
            try {
                // Show save dialog
                const saveResult = await window.electron.ipcRenderer.invoke('show-save-dialog', {
                    title: 'Save Note',
                    defaultPath: filename,
                    filters: [
                        { name: 'Text Files', extensions: ['txt'] },
                        { name: 'JSON Files', extensions: ['json'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });

                if (!saveResult.canceled && saveResult.filePath) {
                    // Create a JSON object with all note data
                    const noteData = {
                        content,
                        encrypted: encryptedContent,
                        folder,
                        tags,
                        metadata: currentMetadata,
                        timestamp: Date.now()
                    };

                    // Convert to JSON string
                    const jsonContent = JSON.stringify(noteData, null, 2);

                    // Save to file system
                    const result = await window.electron.ipcRenderer.invoke('save-file', {
                        filePath: saveResult.filePath,
                        content: jsonContent
                    });

                    if (!result.success) {
                        console.error('Error saving to file system:', result.error);
                        showNotification("Failed to save to file system", "warning");
                    } else {
                        showNotification(`Saved to ${saveResult.filePath}`, "success");
                    }
                }
            } catch (error) {
                console.error('Error with file system save dialog:', error);
                showNotification("Failed to save to file system", "warning");
            }
        }

        // Update current state
        currentFilename = filename;
        currentFolder = folder;
        currentTags = tags;
        lastSavedContent = editor.value;
        hasUnsavedChanges = false;

        // Update tag counts
        tags.forEach(tag => {
            if (!allTags[tag]) {
                allTags[tag] = { count: 0 };
            }
            allTags[tag].count = (allTags[tag].count || 0) + 1;
        });

        saveTags();

        // Update backlinks
        updateBacklinks(filename, editor.value);

        closeModal(saveModal);
        showNotification(`Note saved as "${filename}"`, "success");

        // Update UI
        updateFoldersUI();
        updateTagsUI();
        addLogEntry(`Saved note: ${filename}`);
    } catch (error) {
        console.error('Error saving note:', error);
        showNotification("Failed to save note", "error");
    } finally {
        setStatusText("System idle");
    }
}

// Auto-save current note
async function autoSaveNote() {
    if (!currentFilename || !hasUnsavedChanges) return;

    try {
        setStatusText("Auto-saving...");

        // Update metadata
        currentMetadata.modified = new Date().toISOString();

        // Get content
        const content = editor.value;

        // Get existing files
        const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');

        // Update note data
        files[currentFilename] = {
            content,
            encrypted: isEncrypted,
            folder: currentFolder,
            tags: currentTags,
            metadata: currentMetadata,
            timestamp: Date.now()
        };

        localStorage.setItem('layer3-files', JSON.stringify(files));

        lastSavedContent = editor.value;
        hasUnsavedChanges = false;

        // Update backlinks
        updateBacklinks(currentFilename, content);

        // Show subtle notification
        const autoSaveNotification = document.createElement('div');
        autoSaveNotification.className = 'auto-save-notification';
        autoSaveNotification.textContent = 'Auto-saved';
        document.body.appendChild(autoSaveNotification);

        setTimeout(() => {
            autoSaveNotification.remove();
        }, 2000);
    } catch (error) {
        console.error('Error auto-saving note:', error);
    } finally {
        setStatusText("System idle");
    }
}

// Open load modal
function openLoadModal() {
    loadSavedFiles();
    openModal(loadModal);
}

// Load saved files
async function loadSavedFiles() {
    try {
        fileList.innerHTML = '';

        // First load from localStorage for compatibility
        const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');

        // If in Electron environment, also check file system
        if (window.electron) {
            try {
                // Show open dialog
                const result = await window.electron.ipcRenderer.invoke('show-open-dialog', {
                    title: 'Open Note',
                    filters: [
                        { name: 'Note Files', extensions: ['json', 'txt'] },
                        { name: 'All Files', extensions: ['*'] }
                    ],
                    properties: ['openFile']
                });

                if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
                    // We'll handle this in loadFile function
                    // Just show the file in the list
                    const filePath = result.filePaths[0];
                    const filename = filePath.split(/[\\/]/).pop();

                    const fileItem = document.createElement('li');
                    fileItem.className = 'file-item file-system';

                    const fileInfo = document.createElement('span');
                    fileInfo.textContent = `${filename} [External]`;

                    fileItem.appendChild(fileInfo);
                    fileItem.onclick = () => loadFileFromSystem(filePath);

                    fileList.appendChild(fileItem);
                    return; // Skip showing localStorage files
                }
            } catch (error) {
                console.error('Error with file system open dialog:', error);
            }
        }

        if (Object.keys(files).length === 0) {
            fileList.innerHTML = '<li>No saved notes found</li>';
            return;
        }

        // Sort files by timestamp (newest first)
        const sortedFiles = Object.entries(files).sort((a, b) => b[1].timestamp - a[1].timestamp);

        for (const [filename, fileData] of sortedFiles) {
            const fileItem = document.createElement('li');
            fileItem.className = 'file-item';

            const fileInfo = document.createElement('span');

            // Show folder if not root
            const folderInfo = fileData.folder && fileData.folder !== 'root' && folders[fileData.folder]
                ? ` [${folders[fileData.folder].name}]`
                : '';

            // Show encrypted status
            const encryptedInfo = fileData.encrypted ? ' [ENCRYPTED]' : '';

            fileInfo.textContent = `${filename}${folderInfo}${encryptedInfo}`;

            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'file-delete';
            deleteBtn.textContent = '[X]';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteFile(filename);
            };

            fileItem.appendChild(fileInfo);
            fileItem.appendChild(deleteBtn);

            fileItem.onclick = () => loadFile(filename);

            fileList.appendChild(fileItem);
        }
    } catch (error) {
        console.error('Error loading files:', error);
        showNotification("Failed to load file list", "error");
    }
}

// Load file from localStorage
async function loadFile(filename) {
    try {
        const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');

        if (!files[filename]) {
            showNotification("File not found", "error");
            return;
        }

        const fileData = files[filename];
        let content = fileData.content;

        simulateNetworkActivity(true);
        setStatusText("Loading note...");

        // If file is encrypted and decryption key is provided
        if (fileData.encrypted) {
            const decryptionKey = document.getElementById('decryption-key').value;

            if (!decryptionKey) {
                showNotification("Decryption key required", "error");
                return;
            }

            try {
                content = await decrypt(content, decryptionKey);
                isEncrypted = false;
            } catch (error) {
                showNotification("Incorrect decryption key", "error");
                return;
            }
        } else {
            isEncrypted = false;
        }

        // Update editor content
        editor.value = content;

        // Update current state
        currentFilename = filename;
        currentFolder = fileData.folder || "root";
        currentTags = fileData.tags || [];
        currentMetadata = fileData.metadata || {};
        lastSavedContent = content;
        hasUnsavedChanges = false;

        // Apply saved font if available
        if (currentMetadata.font) {
            currentFont = currentMetadata.font;
            fontSelect.value = currentFont;
            editor.className = currentFont === 'default' ? '' : `font-${currentFont}`;
        } else {
            currentFont = 'default';
            fontSelect.value = 'default';
            editor.className = '';
        }

        closeModal(loadModal);
        showNotification(`Loaded "${filename}"`, "success");
        addLogEntry(`Loaded note: ${filename}`);

        // Exit preview mode if active
        if (isPreviewMode) {
            togglePreview();
        }
    } catch (error) {
        console.error('Error loading file:', error);
        showNotification("Failed to load file", "error");
    } finally {
        setStatusText("System idle");
    }
}

// Load file from file system
async function loadFileFromSystem(filePath) {
    try {
        simulateNetworkActivity(true);
        setStatusText("Loading note...");

        if (!window.electron) {
            showNotification("File system access not available", "error");
            return;
        }

        const result = await window.electron.ipcRenderer.invoke('load-file', { filePath });

        if (!result.success) {
            showNotification(`Failed to load file: ${result.error}`, "error");
            return;
        }

        let content = result.content;
        let noteData = null;
        let isJson = false;

        // Try to parse as JSON
        try {
            noteData = JSON.parse(content);
            isJson = true;
        } catch (e) {
            // Not JSON, treat as plain text
            noteData = {
                content: content,
                encrypted: false,
                folder: 'root',
                tags: [],
                metadata: {
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    font: 'default'
                }
            };
        }

        // If it's a JSON note file
        if (isJson && noteData.content) {
            content = noteData.content;

            // Handle encrypted content
            if (noteData.encrypted) {
                const decryptionKey = prompt("Enter decryption key:");

                if (!decryptionKey) {
                    showNotification("Decryption key required", "error");
                    return;
                }

                try {
                    content = await decrypt(content, decryptionKey);
                    isEncrypted = false;
                } catch (error) {
                    showNotification("Incorrect decryption key", "error");
                    return;
                }
            } else {
                isEncrypted = false;
            }
        }

        // Update editor content
        editor.value = content;

        // Get filename from path
        const filename = filePath.split(/[\\/]/).pop();

        // Update current state
        currentFilename = filename;
        currentFolder = noteData.folder || "root";
        currentTags = noteData.tags || [];
        currentMetadata = noteData.metadata || {
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            font: 'default'
        };
        lastSavedContent = content;
        hasUnsavedChanges = false;

        // Apply saved font if available
        if (currentMetadata.font) {
            currentFont = currentMetadata.font;
            fontSelect.value = currentFont;
            editor.className = currentFont === 'default' ? '' : `font-${currentFont}`;
        } else {
            currentFont = 'default';
            fontSelect.value = 'default';
            editor.className = '';
        }

        closeModal(loadModal);
        showNotification(`Loaded "${filename}"`, "success");
        addLogEntry(`Loaded external file: ${filename}`);

        // Exit preview mode if active
        if (isPreviewMode) {
            togglePreview();
        }
    } catch (error) {
        console.error('Error loading file from system:', error);
        showNotification("Failed to load file", "error");
    } finally {
        setStatusText("System idle");
    }
}

// Helper functions for backlinks and tags
function updateBacklinksOnRename(oldFilename, newFilename) {
    try {
        // Update any backlinks that point to the old filename
        if (noteLinks[oldFilename]) {
            noteLinks[newFilename] = noteLinks[oldFilename];
            delete noteLinks[oldFilename];
        }

        // Update any backlinks that have the old filename as source
        Object.keys(noteLinks).forEach(targetNote => {
            if (noteLinks[targetNote].sources && noteLinks[targetNote].sources[oldFilename]) {
                if (!noteLinks[targetNote].sources[newFilename]) {
                    noteLinks[targetNote].sources[newFilename] = noteLinks[targetNote].sources[oldFilename];
                }
                delete noteLinks[targetNote].sources[oldFilename];
            }
        });

        saveNoteLinks();
    } catch (error) {
        console.error('Error updating backlinks on rename:', error);
    }
}

function updateBacklinks(filename, content) {
    try {
        // Extract note links from content
        const linkRegex = /\[\[(.*?)\]\]/g;
        const links = [];
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            links.push(match[1]);
        }

        // Initialize note links if they don't exist
        if (!noteLinks[filename]) {
            noteLinks[filename] = { targets: {} };
        }

        // Get old targets to remove if they're no longer linked
        const oldTargets = Object.keys(noteLinks[filename].targets || {});

        // Reset targets
        noteLinks[filename].targets = {};

        // Add new targets
        links.forEach(target => {
            noteLinks[filename].targets[target] = true;

            // Initialize target's backlinks if they don't exist
            if (!noteLinks[target]) {
                noteLinks[target] = { sources: {} };
            }
            if (!noteLinks[target].sources) {
                noteLinks[target].sources = {};
            }

            // Add backlink
            noteLinks[target].sources[filename] = true;
        });

        // Remove old targets that are no longer linked
        oldTargets.forEach(target => {
            if (!noteLinks[filename].targets[target] && noteLinks[target] && noteLinks[target].sources) {
                delete noteLinks[target].sources[filename];
            }
        });

        saveNoteLinks();
    } catch (error) {
        console.error('Error updating backlinks:', error);
    }
}

function saveNoteLinks() {
    try {
        localStorage.setItem('layer3-notelinks', JSON.stringify(noteLinks));
    } catch (error) {
        console.error('Error saving note links:', error);
    }
}

function loadNoteLinks() {
    try {
        noteLinks = JSON.parse(localStorage.getItem('layer3-notelinks') || '{}');
    } catch (error) {
        console.error('Error loading note links:', error);
        noteLinks = {};
    }
}

function saveTags() {
    try {
        localStorage.setItem('layer3-tags', JSON.stringify(allTags));
    } catch (error) {
        console.error('Error saving tags:', error);
    }
}

function loadTags() {
    try {
        allTags = JSON.parse(localStorage.getItem('layer3-tags') || '{}');
    } catch (error) {
        console.error('Error loading tags:', error);
        allTags = {};
    }
}

function loadFolders() {
    try {
        folders = JSON.parse(localStorage.getItem('layer3-folders') || '{}');
    } catch (error) {
        console.error('Error loading folders:', error);
        folders = {};
    }
}

function saveFolders() {
    try {
        localStorage.setItem('layer3-folders', JSON.stringify(folders));
    } catch (error) {
        console.error('Error saving folders:', error);
    }
}

// Modal functions
function openEncryptModal() {
    document.getElementById('encrypt-key').value = '';
    openModal(encryptModal);
}

function openDecryptModal() {
    document.getElementById('decrypt-key').value = '';
    openModal(decryptModal);
}

// Encrypt text
async function encryptText() {
    try {
        const encryptionKey = document.getElementById('encrypt-key').value;

        if (!encryptionKey) {
            showNotification("Encryption key is required", "error");
            return;
        }

        simulateNetworkActivity(true);
        setStatusText("Encrypting...");

        const content = editor.value;
        const encryptedContent = await encrypt(content, encryptionKey);

        editor.value = encryptedContent;
        isEncrypted = true;

        closeModal(encryptModal);
        showNotification("Text encrypted", "success");
        addLogEntry("Text encrypted");
    } catch (error) {
        console.error('Error encrypting text:', error);
        showNotification("Failed to encrypt text", "error");
    } finally {
        setStatusText("System idle");
    }
}

// Decrypt text
async function decryptText() {
    try {
        const decryptionKey = document.getElementById('decrypt-key').value;

        if (!decryptionKey) {
            showNotification("Decryption key is required", "error");
            return;
        }

        simulateNetworkActivity(true);
        setStatusText("Decrypting...");

        try {
            const content = editor.value;
            const decryptedContent = await decrypt(content, decryptionKey);

            editor.value = decryptedContent;
            isEncrypted = false;

            closeModal(decryptModal);
            showNotification("Text decrypted", "success");
            addLogEntry("Text decrypted");
        } catch (error) {
            showNotification("Incorrect decryption key", "error");
        }
    } catch (error) {
        console.error('Error decrypting text:', error);
        showNotification("Failed to decrypt text", "error");
    } finally {
        setStatusText("System idle");
    }
}

function openLinkModal() {
    // Populate note select with available notes
    const noteSelect = document.getElementById('noteNameSelect');
    noteSelect.innerHTML = '';

    const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');
    Object.keys(files).forEach(filename => {
        const option = document.createElement('option');
        option.value = filename;
        option.textContent = filename;
        noteSelect.appendChild(option);
    });

    // Reset form
    document.getElementById('linkType').value = 'note';
    document.getElementById('noteNameGroup').style.display = 'block';
    document.getElementById('urlGroup').style.display = 'none';
    document.getElementById('linkText').value = '';
    document.getElementById('url').value = '';

    openModal(linkModal);
}

// Add link to editor
function addLink() {
    try {
        const linkType = document.getElementById('linkType').value;
        const linkText = document.getElementById('linkText').value.trim() || 'Link';

        let linkMarkdown = '';

        if (linkType === 'note') {
            const noteName = document.getElementById('noteNameSelect').value;
            linkMarkdown = `[[${noteName}]]`;

            // Update backlinks
            if (currentFilename) {
                updateBacklinks(currentFilename, editor.value + linkMarkdown);
            }
        } else {
            const url = document.getElementById('url').value.trim();

            if (!url) {
                showNotification("URL is required", "error");
                return;
            }

            linkMarkdown = `[${linkText}](${url})`;
        }

        // Insert at cursor position
        const cursorPos = editor.selectionStart;
        editor.value = editor.value.substring(0, cursorPos) + linkMarkdown + editor.value.substring(editor.selectionEnd);

        // Update preview if active
        if (isPreviewMode) {
            updatePreview();
        }

        closeModal(linkModal);
        showNotification("Link added", "success");
    } catch (error) {
        console.error('Error adding link:', error);
        showNotification("Failed to add link", "error");
    }
}

function openImageModal() {
    document.getElementById('imageUrl').value = '';
    document.getElementById('imageAlt').value = '';
    openModal(imageModal);
}

// Add image to editor
function addImage() {
    try {
        const imageUrl = document.getElementById('imageUrl').value.trim();
        const imageAlt = document.getElementById('imageAlt').value.trim() || 'Image';

        if (!imageUrl) {
            showNotification("Image URL is required", "error");
            return;
        }

        const imageMarkdown = `![${imageAlt}](${imageUrl})`;

        // Insert at cursor position
        const cursorPos = editor.selectionStart;
        editor.value = editor.value.substring(0, cursorPos) + imageMarkdown + editor.value.substring(editor.selectionEnd);

        // Update preview if active
        if (isPreviewMode) {
            updatePreview();
        }

        closeModal(imageModal);
        showNotification("Image added", "success");
    } catch (error) {
        console.error('Error adding image:', error);
        showNotification("Failed to add image", "error");
    }
}

function openMetadataModal() {
    const metadataInfo = document.getElementById('metadataInfo');
    metadataInfo.innerHTML = '';

    if (Object.keys(currentMetadata).length === 0) {
        metadataInfo.innerHTML = '<p>No metadata available</p>';
        return;
    }

    // Display metadata
    const metadataList = document.createElement('dl');
    metadataList.className = 'metadata-list';

    Object.entries(currentMetadata).forEach(([key, value]) => {
        const dt = document.createElement('dt');
        dt.textContent = key;

        const dd = document.createElement('dd');
        dd.textContent = value;

        metadataList.appendChild(dt);
        metadataList.appendChild(dd);
    });

    metadataInfo.appendChild(metadataList);

    // Reset custom field inputs
    document.getElementById('customFieldName').value = '';
    document.getElementById('customFieldValue').value = '';

    openModal(metadataModal);
}

function openExportModal() {
    document.getElementById('exportFormat').value = 'txt';
    document.getElementById('exportFilename').value = currentFilename ? currentFilename.split('.')[0] : '';
    openModal(exportModal);
}

function openFolderModal() {
    document.getElementById('folderName').value = '';

    // Populate parent folder select
    const parentFolderSelect = document.getElementById('parentFolderSelect');
    parentFolderSelect.innerHTML = '<option value="root">Root</option>';

    Object.entries(folders).forEach(([id, folder]) => {
        if (folder.parent === 'root') {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = folder.name;
            parentFolderSelect.appendChild(option);
        }
    });

    openModal(folderModal);
}

// Add custom metadata field
function addCustomMetadataField() {
    const fieldName = document.getElementById('customFieldName').value.trim();
    const fieldValue = document.getElementById('customFieldValue').value.trim();

    if (!fieldName) {
        showNotification("Field name is required", "warning");
        return;
    }

    currentMetadata[fieldName] = fieldValue;

    // Update metadata display
    openMetadataModal();

    showNotification(`Added metadata field: ${fieldName}`, "success");
}

// Create folder
function createFolder() {
    const folderName = document.getElementById('folderName').value.trim();
    const parentFolder = document.getElementById('parentFolderSelect').value;

    if (!folderName) {
        showNotification("Folder name is required", "warning");
        return;
    }

    // Generate a unique ID for the folder
    const folderId = `folder_${Date.now()}`;

    // Add folder to folders object
    folders[folderId] = {
        name: folderName,
        parent: parentFolder,
        created: new Date().toISOString()
    };

    // Save folders
    saveFolders();

    // Update UI
    updateFoldersUI();

    closeModal(folderModal);
    showNotification(`Created folder: ${folderName}`, "success");
}

// Update folders UI
function updateFoldersUI() {
    foldersContainer.innerHTML = '';

    // Add root folder
    const rootFolder = document.createElement('div');
    rootFolder.className = 'folder-item';
    rootFolder.innerHTML = `
        <span class="folder-name">Root</span>
        <span class="folder-count">${countFilesInFolder('root')}</span>
    `;
    rootFolder.onclick = () => showFolderContents('root');
    foldersContainer.appendChild(rootFolder);

    // Add other folders
    Object.entries(folders).forEach(([id, folder]) => {
        if (folder.parent === 'root') {
            addFolderToUI(id, folder, foldersContainer, 0);
        }
    });

    // Update folder select in save modal
    updateFolderSelect();
}

// Add folder to UI
function addFolderToUI(id, folder, container, level) {
    const folderItem = document.createElement('div');
    folderItem.className = 'folder-item';
    folderItem.style.paddingLeft = `${level * 20 + 10}px`;

    folderItem.innerHTML = `
        <span class="folder-name">${folder.name}</span>
        <span class="folder-count">${countFilesInFolder(id)}</span>
    `;

    folderItem.onclick = (e) => {
        e.stopPropagation();
        showFolderContents(id);
    };

    container.appendChild(folderItem);

    // Add subfolders
    Object.entries(folders).forEach(([childId, childFolder]) => {
        if (childFolder.parent === id) {
            addFolderToUI(childId, childFolder, container, level + 1);
        }
    });
}

// Count files in folder
function countFilesInFolder(folderId) {
    const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');
    return Object.values(files).filter(file => file.folder === folderId).length;
}

// Show folder contents
function showFolderContents(folderId) {
    const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');
    const folderFiles = Object.entries(files).filter(([_, file]) => file.folder === folderId);

    if (folderFiles.length === 0) {
        showNotification(`No files in this folder`, "info");
        return;
    }

    // Create a temporary modal to show folder contents
    const modal = document.createElement('div');
    modal.className = 'modal active';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const folderName = folderId === 'root' ? 'Root' : folders[folderId].name;

    modalContent.innerHTML = `
        <div class="modal-header">Folder: ${folderName}</div>
        <div class="modal-body">
            <ul class="file-list" id="folderFileList"></ul>
        </div>
        <div class="modal-footer">
            <button type="button" class="button" id="closeFolderBtn">Close</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add files to list
    const fileList = document.getElementById('folderFileList');

    folderFiles.forEach(([filename, fileData]) => {
        const fileItem = document.createElement('li');
        fileItem.className = 'file-item';

        const fileInfo = document.createElement('span');
        const encryptedInfo = fileData.encrypted ? ' [ENCRYPTED]' : '';
        fileInfo.textContent = `${filename}${encryptedInfo}`;

        fileItem.appendChild(fileInfo);
        fileItem.onclick = () => {
            document.body.removeChild(modal);
            loadFileFromFolder(filename);
        };

        fileList.appendChild(fileItem);
    });

    // Add close button handler
    document.getElementById('closeFolderBtn').onclick = () => {
        document.body.removeChild(modal);
    };
}

// Update folder select in save modal
function updateFolderSelect() {
    folderSelect.innerHTML = '<option value="root">Root (No Folder)</option>';

    Object.entries(folders).forEach(([id, folder]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = folder.name;
        folderSelect.appendChild(option);
    });
}

// Update tags UI
function updateTagsUI() {
    tagsContainer.innerHTML = '';

    if (Object.keys(allTags).length === 0) {
        tagsContainer.innerHTML = '<div class="tag-item">No tags</div>';
        return;
    }

    // Sort tags by count (descending)
    const sortedTags = Object.entries(allTags).sort((a, b) => b[1].count - a[1].count);

    sortedTags.forEach(([tag, data]) => {
        const tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        tagItem.innerHTML = `
            <span class="tag-name">${tag}</span>
            <span class="tag-count">${data.count}</span>
        `;

        tagItem.onclick = () => showTagContents(tag);

        tagsContainer.appendChild(tagItem);
    });
}

// Show tag contents
function showTagContents(tag) {
    const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');
    const tagFiles = Object.entries(files).filter(([_, file]) => file.tags && file.tags.includes(tag));

    if (tagFiles.length === 0) {
        showNotification(`No files with tag: ${tag}`, "info");
        return;
    }

    // Create a temporary modal to show tag contents
    const modal = document.createElement('div');
    modal.className = 'modal active';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    modalContent.innerHTML = `
        <div class="modal-header">Tag: ${tag}</div>
        <div class="modal-body">
            <ul class="file-list" id="tagFileList"></ul>
        </div>
        <div class="modal-footer">
            <button type="button" class="button" id="closeTagBtn">Close</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add files to list
    const fileList = document.getElementById('tagFileList');

    tagFiles.forEach(([filename, fileData]) => {
        const fileItem = document.createElement('li');
        fileItem.className = 'file-item';

        const fileInfo = document.createElement('span');
        const folderInfo = fileData.folder && fileData.folder !== 'root' && folders[fileData.folder]
            ? ` [${folders[fileData.folder].name}]`
            : '';
        const encryptedInfo = fileData.encrypted ? ' [ENCRYPTED]' : '';

        fileInfo.textContent = `${filename}${folderInfo}${encryptedInfo}`;

        fileItem.appendChild(fileInfo);
        fileItem.onclick = () => {
            document.body.removeChild(modal);
            loadFileFromFolder(filename);
        };

        fileList.appendChild(fileItem);
    });

    // Add close button handler
    document.getElementById('closeTagBtn').onclick = () => {
        document.body.removeChild(modal);
    };
}

// Toggle preview mode
function togglePreview() {
    isPreviewMode = !isPreviewMode;

    if (isPreviewMode) {
        editor.style.display = 'none';
        notePreview.style.display = 'block';
        updatePreview();
        document.getElementById('previewBtn').textContent = '[E]dit';
    } else {
        editor.style.display = 'block';
        notePreview.style.display = 'none';
        document.getElementById('previewBtn').textContent = '[P]review';
    }
}

// Update preview content
function updatePreview() {
    if (!isPreviewMode) return;

    let content = editor.value;

    // Apply formatting
    content = formatText(content);

    notePreview.innerHTML = content;
}

// Format text for preview
function formatText(text) {
    // Replace color tags
    text = text.replace(/-::(\w+)::-\s*(.*?)\s*-::-/g, '<span class="format-color-$1">$2</span>');

    // Replace glow tags
    text = text.replace(/\[glow\]\s*(.*?)\s*\[\/glow\]/g, '<span class="format-glow">$1</span>');

    // Replace animated tags
    text = text.replace(/\*-\*-animated-\*-\*\s*(.*?)\s*\*-\*-\/animated-\*-\*/g, '<span class="format-animated">$1</span>');

    // Replace redacted tags
    text = text.replace(/\(redacted\)\s*(.*?)\s*\(\/redacted\)/g, '<span class="format-redacted">$1</span>');

    // Replace underline tags
    text = text.replace(/__underline__\s*(.*?)\s*__\/underline__/g, '<span class="format-underline">$1</span>');

    // Replace size tags
    text = text.replace(/<size:(\w+)>\s*(.*?)\s*<\/size>/g, '<span class="format-size-$1">$2</span>');

    // Replace note links
    text = text.replace(/\[\[(.*?)\]\]/g, '<a href="#" class="note-link" data-note="$1">$1</a>');

    // Replace markdown links
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Replace markdown images
    text = text.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="note-image">');

    // Replace newlines with <br>
    text = text.replace(/\n/g, '<br>');

    return text;
}

// Apply formatting to selected text
function applyFormat(format, value) {
    const cursorPos = editor.selectionStart;
    const endPos = editor.selectionEnd;
    const selectedText = editor.value.substring(cursorPos, endPos);

    let formattedText = '';

    switch (format) {
        case 'color':
            formattedText = `-::${value}::- ${selectedText} -::-`;
            break;
        case 'glow':
            formattedText = `[glow] ${selectedText} [/glow]`;
            break;
        case 'animated':
            formattedText = `*-*-animated-*-* ${selectedText} *-*-/animated-*-*`;
            break;
        case 'redacted':
            formattedText = `(redacted) ${selectedText} (/redacted)`;
            break;
        case 'underline':
            formattedText = `__underline__ ${selectedText} __/underline__`;
            break;
        case 'size':
            formattedText = `<size:${value}> ${selectedText} </size>`;
            break;
    }

    editor.value = editor.value.substring(0, cursorPos) + formattedText + editor.value.substring(endPos);

    // Update preview if active
    if (isPreviewMode) {
        updatePreview();
    }
}

// Add log entry
function addLogEntry(message) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';

    const logTime = document.createElement('div');
    logTime.className = 'log-time';
    logTime.textContent = timeString;

    const logMessage = document.createElement('div');
    logMessage.className = 'log-message';
    logMessage.textContent = message;

    logEntry.appendChild(logTime);
    logEntry.appendChild(logMessage);

    transmissionLog.appendChild(logEntry);

    // Scroll to bottom
    transmissionLog.scrollTop = transmissionLog.scrollHeight;
}

// Start session timer
function startSessionTimer() {
    const sessionValue = document.getElementById('sessionValue');
    let seconds = 0;

    setInterval(() => {
        seconds++;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        sessionValue.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        openSaveModal();
    }

    // Ctrl+O to open
    if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        openLoadModal();
    }

    // Ctrl+N for new note
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        createNewNote();
    }

    // Ctrl+P for preview
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        togglePreview();
    }

    // Escape to close modals
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            closeModal(activeModal);
        }
    }
}

// Toggle format toolbar
function toggleFormatToolbar() {
    if (formatToolbar.style.display === 'flex') {
        formatToolbar.style.display = 'none';
    } else {
        formatToolbar.style.display = 'flex';
    }
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    isSidebarOpen = !isSidebarOpen;

    if (isSidebarOpen) {
        sidebar.style.left = '0';
        sidebarToggle.textContent = '[<<]';
    } else {
        sidebar.style.left = '-300px';
        sidebarToggle.textContent = '[>>]';
    }
}

// Setup voidrane footer
function setupVoidraneFooter() {
    // Add glitch effect to footer
    setInterval(() => {
        if (Math.random() < 0.1) {
            voidraneFooter.classList.add('glitch');
            setTimeout(() => {
                voidraneFooter.classList.remove('glitch');
            }, 200);
        }
    }, 3000);
}

// Utility functions
function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notificationsContainer.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

function setStatusText(text) {
    statusText.textContent = text;
}

function simulateNetworkActivity(active) {
    if (active) {
        connectionStatus.classList.add('active');
        uploadIcon.classList.add('active');
        downloadIcon.classList.add('active');
    } else {
        connectionStatus.classList.remove('active');
        uploadIcon.classList.remove('active');
        downloadIcon.classList.remove('active');
    }
}

// Encryption/decryption functions
async function encrypt(text, key) {
    // This is a simple XOR encryption for demonstration
    // In a real app, use a proper encryption library
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

async function decrypt(text, key) {
    // XOR encryption is symmetric, so decryption is the same as encryption
    return await encrypt(text, key);
}

// Load file from folder
function loadFileFromFolder(filename) {
    try {
        const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');

        if (!files[filename]) {
            showNotification("File not found", "error");
            return;
        }

        const fileData = files[filename];

        if (fileData.encrypted) {
            // Need decryption key, show load modal
            openLoadModal();
            return;
        }

        simulateNetworkActivity(true);
        setStatusText("Loading note...");

        // Update editor content
        editor.value = fileData.content;

        // Update current state
        currentFilename = filename;
        currentFolder = fileData.folder || "root";
        currentTags = fileData.tags || [];
        currentMetadata = fileData.metadata || {};
        isEncrypted = false;
        lastSavedContent = fileData.content;
        hasUnsavedChanges = false;

        // Apply saved font if available
        if (currentMetadata.font) {
            currentFont = currentMetadata.font;
            fontSelect.value = currentFont;
            editor.className = currentFont === 'default' ? '' : `font-${currentFont}`;
        } else {
            currentFont = 'default';
            fontSelect.value = 'default';
            editor.className = '';
        }

        showNotification(`Loaded "${filename}"`, "success");
        addLogEntry(`Loaded note: ${filename}`);

        // Exit preview mode if active
        if (isPreviewMode) {
            togglePreview();
        }
    } catch (error) {
        console.error('Error loading file from folder:', error);
        showNotification("Failed to load file", "error");
    } finally {
        setStatusText("System idle");
    }
}

// Delete file
async function deleteFile(filename) {
    if (!confirm(`Delete "${filename}"?`)) {
        return;
    }

    try {
        const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');

        if (files[filename]) {
            // Remove tags from counts
            if (files[filename].tags) {
                files[filename].tags.forEach(tag => {
                    if (allTags[tag]) {
                        allTags[tag].count = Math.max(0, allTags[tag].count - 1);
                        if (allTags[tag].count === 0) {
                            delete allTags[tag];
                        }
                    }
                });
                saveTags();
            }

            // Remove backlinks
            if (noteLinks[filename]) {
                // Remove this file as a source from any target notes
                if (noteLinks[filename].targets) {
                    Object.keys(noteLinks[filename].targets).forEach(target => {
                        if (noteLinks[target] && noteLinks[target].sources) {
                            delete noteLinks[target].sources[filename];
                        }
                    });
                }

                // Remove this file entirely from noteLinks
                delete noteLinks[filename];
                saveNoteLinks();
            }

            // Delete the file from localStorage
            delete files[filename];
            localStorage.setItem('layer3-files', JSON.stringify(files));

            // If this was the current file, clear editor
            if (currentFilename === filename) {
                createNewNote();
            }

            // Try to delete from file system if in Electron environment
            if (window.electron) {
                try {
                    // Get app path
                    const appPath = await window.electron.ipcRenderer.invoke('get-app-path');

                    // Construct possible file paths (both .txt and .json)
                    const filePaths = [
                        `${appPath}/${filename}`,
                        `${appPath}/${filename}.json`,
                        `${appPath}/${filename}.txt`
                    ];

                    // We don't have a direct way to delete files in this implementation
                    // This would require adding a 'delete-file' handler to the main process
                    // For now, we'll just show a notification
                    showNotification("Note deleted from app storage. External files may still exist.", "info");
                } catch (error) {
                    console.error('Error with file system delete:', error);
                }
            }

            loadSavedFiles();
            updateFoldersUI();
            showNotification(`Deleted "${filename}"`, "success");
            addLogEntry(`Deleted note: ${filename}`);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        showNotification("Failed to delete file", "error");
    }
}

// Auto-save current note
async function autoSaveNote() {
    if (!currentFilename || !hasUnsavedChanges) return;

    try {
        setStatusText("Auto-saving...");

        // Update metadata
        currentMetadata.modified = new Date().toISOString();

        // Get content
        const content = editor.value;

        // Get existing files
        const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');

        // Update note data
        files[currentFilename] = {
            content,
            encrypted: isEncrypted,
            folder: currentFolder,
            tags: currentTags,
            metadata: currentMetadata,
            timestamp: Date.now()
        };

        localStorage.setItem('layer3-files', JSON.stringify(files));

        // Save to file system if in Electron environment
        if (window.electron) {
            // Create a JSON object with all note data
            const noteData = {
                content,
                encrypted: isEncrypted,
                folder: currentFolder,
                tags: currentTags,
                metadata: currentMetadata,
                timestamp: Date.now()
            };

            // Convert to JSON string
            const jsonContent = JSON.stringify(noteData, null, 2);

            // Save to file system
            const filePath = `${currentFolder !== 'root' ? currentFolder + '/' : ''}${currentFilename}.json`;
            await window.electron.ipcRenderer.invoke('save-file', {
                filePath,
                content: jsonContent
            });
        }

        lastSavedContent = editor.value;
        hasUnsavedChanges = false;

        // Update backlinks
        updateBacklinks(currentFilename, content);

        // Show subtle notification
        const autoSaveNotification = document.createElement('div');
        autoSaveNotification.className = 'auto-save-notification';
        autoSaveNotification.textContent = 'Auto-saved';
        document.body.appendChild(autoSaveNotification);

        setTimeout(() => {
            autoSaveNotification.remove();
        }, 2000);
    } catch (error) {
        console.error('Error auto-saving note:', error);
    } finally {
        setStatusText("System idle");
    }
}

// Open load modal
function openLoadModal() {
    loadSavedFiles();
    openModal(loadModal);
}

// Load saved files
async function loadSavedFiles() {
    try {
        fileList.innerHTML = '';

        // First load from localStorage for compatibility
        const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');

        // If in Electron environment, also check file system
        let fsFiles = {};
        if (window.electron) {
            try {
                // Get app path
                const appPath = await window.electron.ipcRenderer.invoke('get-app-path');

                // Show open dialog to select files
                const result = await window.electron.ipcRenderer.invoke('show-open-dialog', {
                    title: 'Select Note Files',
                    defaultPath: appPath,
                    filters: [
                        { name: 'Note Files', extensions: ['json', 'txt', 'md'] },
                        { name: 'All Files', extensions: ['*'] }
                    ],
                    properties: ['openFile', 'multiSelections']
                });

                if (!result.canceled && result.filePaths.length > 0) {
                    // Load selected files
                    for (const filePath of result.filePaths) {
                        const loadResult = await window.electron.ipcRenderer.invoke('load-file', { filePath });

                        if (loadResult.success) {
                            try {
                                // Try to parse as JSON
                                const noteData = JSON.parse(loadResult.content);
                                const filename = path.basename(filePath, '.json');
                                fsFiles[filename] = noteData;
                            } catch (e) {
                                // If not JSON, treat as plain text
                                const filename = path.basename(filePath);
                                fsFiles[filename] = {
                                    content: loadResult.content,
                                    encrypted: false,
                                    folder: 'root',
                                    tags: [],
                                    metadata: {
                                        created: new Date().toISOString(),
                                        modified: new Date().toISOString(),
                                        font: 'default'
                                    },
                                    timestamp: Date.now()
                                };
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading files from file system:', error);
            }
        }

        // Merge files from localStorage and file system
        const mergedFiles = { ...files, ...fsFiles };

        if (Object.keys(mergedFiles).length === 0) {
            fileList.innerHTML = '<li>No saved notes found</li>';
            return;
        }

        // Sort files by timestamp (newest first)
        const sortedFiles = Object.entries(mergedFiles).sort((a, b) => b[1].timestamp - a[1].timestamp);

        for (const [filename, fileData] of sortedFiles) {
            const fileItem = document.createElement('li');
            fileItem.className = 'file-item';

            const fileInfo = document.createElement('span');

            // Show folder if not root
            const folderInfo = fileData.folder && fileData.folder !== 'root' && folders[fileData.folder]
                ? ` [${folders[fileData.folder].name}]`
                : '';

            // Show encrypted status
            const encryptedInfo = fileData.encrypted ? ' [ENCRYPTED]' : '';

            fileInfo.textContent = `${filename}${folderInfo}${encryptedInfo}`;

            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'file-delete';
            deleteBtn.textContent = '[X]';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteFile(filename);
            };

            fileItem.appendChild(fileInfo);
            fileItem.appendChild(deleteBtn);

            fileItem.onclick = () => loadFile(filename);

            fileList.appendChild(fileItem);
        }
    } catch (error) {
        console.error('Error loading files:', error);
        showNotification("Failed to load file list", "error");
    }
}
