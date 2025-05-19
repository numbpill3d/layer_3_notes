// Layer 3 Notepad - Main Script
// Global variables
let currentFilename = null;
let currentFolder = "root";
let currentTags = [];
let currentMetadata = {};
let currentFont = 'default';
let isEncrypted = false;
let isPreviewMode = false;
let hauntingIntensity = 0;
let lastActivity = Date.now();

// DOM Elements
const editor = document.getElementById('editor');
const notePreview = document.getElementById('notePreview');
const statusText = document.getElementById('status-text');
const connectionStatus = document.getElementById('connection-status');
const uploadIcon = document.getElementById('upload-icon');
const downloadIcon = document.getElementById('download-icon');
const notificationsContainer = document.getElementById('notifications');
const fileList = document.getElementById('fileList');
const foldersList = document.getElementById('foldersList');
const tagsList = document.getElementById('tagsList');
const fragmentsList = document.getElementById('fragmentsList');

// Buttons
const newBtn = document.getElementById('newBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const formatBtn = document.getElementById('formatBtn');
const linkBtn = document.getElementById('linkBtn');
const imageBtn = document.getElementById('imageBtn');
const previewBtn = document.getElementById('previewBtn');
const metadataBtn = document.getElementById('metadataBtn');
const exportBtn = document.getElementById('exportBtn');
const createFolderBtn = document.getElementById('createFolderBtn');

// Modals
const saveModal = document.createElement('div');
saveModal.className = 'modal';
saveModal.innerHTML = `
    <div class="modal-content">
        <h3>Save Note</h3>
        <div class="form-group">
            <label for="filenameInput">Filename:</label>
            <input type="text" id="filenameInput" placeholder="Enter filename">
        </div>
        <div class="form-group">
            <label for="folderSelect">Folder:</label>
            <select id="folderSelect"></select>
        </div>
        <div class="form-group">
            <label for="tagsInput">Tags (comma separated):</label>
            <input type="text" id="tagsInput" placeholder="tag1, tag2, tag3">
        </div>
        <div class="modal-actions">
            <button id="saveConfirmBtn">Save</button>
            <button id="saveCancelBtn">Cancel</button>
        </div>
    </div>
`;
document.body.appendChild(saveModal);

const loadModal = document.createElement('div');
loadModal.className = 'modal';
loadModal.innerHTML = `
    <div class="modal-content">
        <h3>Load Note</h3>
        <div class="form-group">
            <input type="text" id="searchInput" placeholder="Search notes...">
        </div>
        <div class="file-list custom-scrollbar" id="fileList"></div>
        <div class="form-group" id="decryptionKeyGroup" style="display: none;">
            <label for="decryptionKeyInput">Decryption Key:</label>
            <input type="password" id="decryptionKeyInput">
        </div>
        <div class="modal-actions">
            <button id="loadCancelBtn">Cancel</button>
        </div>
    </div>
`;
document.body.appendChild(loadModal);

const encryptModal = document.createElement('div');
encryptModal.className = 'modal';
encryptModal.innerHTML = `
    <div class="modal-content">
        <h3>Encrypt Note</h3>
        <div class="form-group">
            <label for="encryptKeyInput">Encryption Key:</label>
            <input type="password" id="encryptKeyInput">
        </div>
        <div class="modal-actions">
            <button id="encryptConfirmBtn">Encrypt</button>
            <button id="encryptCancelBtn">Cancel</button>
        </div>
    </div>
`;
document.body.appendChild(encryptModal);

const decryptModal = document.createElement('div');
decryptModal.className = 'modal';
decryptModal.innerHTML = `
    <div class="modal-content">
        <h3>Decrypt Note</h3>
        <div class="form-group">
            <label for="decryptKeyInput">Decryption Key:</label>
            <input type="password" id="decryptKeyInput">
        </div>
        <div class="modal-actions">
            <button id="decryptConfirmBtn">Decrypt</button>
            <button id="decryptCancelBtn">Cancel</button>
        </div>
    </div>
`;
document.body.appendChild(decryptModal);

const formatToolbar = document.createElement('div');
formatToolbar.className = 'format-toolbar';
formatToolbar.innerHTML = `
    <div class="format-group">
        <label for="fontSelect">Font:</label>
        <select id="fontSelect">
            <option value="default">Default</option>
            <option value="inconsolata">Inconsolata</option>
            <option value="times">Times New Roman</option>
            <option value="dosis">Dosis</option>
            <option value="sourcecodepro">Source Code Pro</option>
            <option value="cinzel">Cinzel</option>
            <option value="rubikburned">Rubik Burned</option>
            <option value="synemono">Syne Mono</option>
        </select>
    </div>
    <div class="format-buttons">
        <button data-format="color" data-color="red">Red</button>
        <button data-format="color" data-color="green">Green</button>
        <button data-format="color" data-color="blue">Blue</button>
        <button data-format="glow">Glow</button>
        <button data-format="animated">Animated</button>
        <button data-format="redacted">Redacted</button>
        <button data-format="underline">Underline</button>
        <button data-format="size" data-size="large">Large</button>
        <button data-format="size" data-size="small">Small</button>
    </div>
    <button id="formatCloseBtn">Close</button>
`;
document.body.appendChild(formatToolbar);

const linkModal = document.createElement('div');
linkModal.className = 'modal';
linkModal.innerHTML = `
    <div class="modal-content">
        <h3>Add Link</h3>
        <div class="form-group">
            <label for="linkTypeSelect">Link Type:</label>
            <select id="linkTypeSelect">
                <option value="url">External URL</option>
                <option value="note">Note Link</option>
            </select>
        </div>
        <div class="form-group" id="urlGroup">
            <label for="urlInput">URL:</label>
            <input type="text" id="urlInput" placeholder="https://example.com">
        </div>
        <div class="form-group" id="noteNameGroup" style="display: none;">
            <label for="noteNameSelect">Note:</label>
            <select id="noteNameSelect"></select>
        </div>
        <div class="form-group">
            <label for="linkTextInput">Link Text:</label>
            <input type="text" id="linkTextInput" placeholder="Link text">
        </div>
        <div class="modal-actions">
            <button id="linkConfirmBtn">Add Link</button>
            <button id="linkCancelBtn">Cancel</button>
        </div>
    </div>
`;
document.body.appendChild(linkModal);

const imageModal = document.createElement('div');
imageModal.className = 'modal';
imageModal.innerHTML = `
    <div class="modal-content">
        <h3>Add Image</h3>
        <div class="form-group">
            <label for="imageUrlInput">Image URL:</label>
            <input type="text" id="imageUrlInput" placeholder="https://example.com/image.jpg">
        </div>
        <div class="form-group">
            <label for="imageAltInput">Alt Text:</label>
            <input type="text" id="imageAltInput" placeholder="Image description">
        </div>
        <div class="modal-actions">
            <button id="imageConfirmBtn">Add Image</button>
            <button id="imageCancelBtn">Cancel</button>
        </div>
    </div>
`;
document.body.appendChild(imageModal);

const metadataModal = document.createElement('div');
metadataModal.className = 'modal';
metadataModal.innerHTML = `
    <div class="modal-content">
        <h3>Note Metadata</h3>
        <div id="metadataFields">
            <!-- Will be populated by JavaScript -->
        </div>
        <div class="form-group">
            <label for="newMetadataKeyInput">New Field:</label>
            <input type="text" id="newMetadataKeyInput" placeholder="Field name">
            <input type="text" id="newMetadataValueInput" placeholder="Value">
            <button id="addMetadataBtn">Add</button>
        </div>
        <div class="modal-actions">
            <button id="metadataSaveBtn">Save</button>
            <button id="metadataCancelBtn">Cancel</button>
        </div>
    </div>
`;
document.body.appendChild(metadataModal);

const exportModal = document.createElement('div');
exportModal.className = 'modal';
exportModal.innerHTML = `
    <div class="modal-content">
        <h3>Export Note</h3>
        <div class="form-group">
            <label for="exportFormatSelect">Format:</label>
            <select id="exportFormatSelect">
                <option value="txt">Plain Text (.txt)</option>
                <option value="md">Markdown (.md)</option>
                <option value="html">HTML (.html)</option>
                <option value="json">JSON (.json)</option>
            </select>
        </div>
        <div class="form-group">
            <label>
                <input type="checkbox" id="includeMetadataCheckbox" checked>
                Include metadata
            </label>
        </div>
        <div class="modal-actions">
            <button id="exportConfirmBtn">Export</button>
            <button id="exportCancelBtn">Cancel</button>
        </div>
    </div>
`;
document.body.appendChild(exportModal);

const folderModal = document.createElement('div');
folderModal.className = 'modal';
folderModal.innerHTML = `
    <div class="modal-content">
        <h3>Create Folder</h3>
        <div class="form-group">
            <label for="folderNameInput">Folder Name:</label>
            <input type="text" id="folderNameInput" placeholder="Enter folder name">
        </div>
        <div class="form-group">
            <label for="parentFolderSelect">Parent Folder:</label>
            <select id="parentFolderSelect"></select>
        </div>
        <div class="modal-actions">
            <button id="folderConfirmBtn">Create</button>
            <button id="folderCancelBtn">Cancel</button>
        </div>
    </div>
`;
document.body.appendChild(folderModal);

// Data storage
let folders = JSON.parse(localStorage.getItem('layer3-folders') || '{"root": {"name": "Root", "parent": null, "children": []}}');
let allTags = JSON.parse(localStorage.getItem('layer3-tags') || '{}');
let noteLinks = JSON.parse(localStorage.getItem('layer3-links') || '{}');

// Save note
function saveNote() {
    try {
        const filenameInput = document.getElementById('filenameInput');
        const folderSelect = document.getElementById('folderSelect');
        const tagsInput = document.getElementById('tagsInput');

        const filename = filenameInput.value.trim();
        const folder = folderSelect.value;
        const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

        if (!filename) {
            showNotification("Filename is required", "error");
            return;
        }

        simulateNetworkActivity(true);
        setStatusText("Saving note...");

        // Update metadata
        currentMetadata.modified = new Date().toISOString();
        currentMetadata.font = currentFont;

        // Get content
        const content = editor.value;
        const encryptedContent = isEncrypted;

        // Get existing files
        const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');

        // Check if we're changing filename for backlinks
        if (currentFilename && currentFilename !== filename) {
            // Update backlinks to reflect new filename
            updateBacklinksOnRename(currentFilename, filename);
        }

        // Update note data
        files[filename] = {
            content,
            encrypted: encryptedContent,
            folder,
            tags,
            metadata: currentMetadata,
            timestamp: Date.now()
        };

        localStorage.setItem('layer3-files', JSON.stringify(files));

        // Update current state
        currentFilename = filename;
        currentFolder = folder;

        // Update tag counts
        tags.forEach(tag => {
            if (!allTags[tag]) {
                allTags[tag] = { count: 0 };
            }
            allTags[tag].count = (allTags[tag].count || 0) + 1;
        });

        saveTags();

        // Update backlinks
        updateBacklinks(filename, content);

        closeModal(saveModal);
        showNotification(`Note saved as "${filename}"`, "success");

        // Update UI
        updateFoldersUI();
        updateTagsUI();
    } catch (error) {
        console.error('Error saving note:', error);
        showNotification("Failed to save note", "error");
    } finally {
        setStatusText("System idle");
    }
}

// Create a new note
function createNewNote() {
    editor.value = '';
    currentFilename = null;
    currentFolder = 'root';
    currentTags = [];
    currentMetadata = {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        type: 'note'
    };
    isEncrypted = false;

    // Reset font
    currentFont = 'default';
    const fontSelect = document.getElementById('fontSelect');
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
    const filenameInput = document.getElementById('filenameInput');
    const folderSelect = document.getElementById('folderSelect');
    const tagsInput = document.getElementById('tagsInput');

    // Populate folder select
    populateFolderSelect(folderSelect);

    // Set current values if available
    if (currentFilename) {
        filenameInput.value = currentFilename;
    } else {
        filenameInput.value = '';
    }

    folderSelect.value = currentFolder || 'root';
    tagsInput.value = currentTags.join(', ');

    openModal(saveModal);
}

// Open load modal
function openLoadModal() {
    loadSavedFiles();
    openModal(loadModal);
}

// Open encrypt modal
function openEncryptModal() {
    document.getElementById('encryptKeyInput').value = '';
    openModal(encryptModal);
}

// Open decrypt modal
function openDecryptModal() {
    document.getElementById('decryptKeyInput').value = '';
    openModal(decryptModal);
}

// Open link modal
function openLinkModal() {
    document.getElementById('linkTypeSelect').value = 'url';
    document.getElementById('urlInput').value = '';
    document.getElementById('linkTextInput').value = '';
    document.getElementById('urlGroup').style.display = 'block';
    document.getElementById('noteNameGroup').style.display = 'none';
    openModal(linkModal);
}

// Open image modal
function openImageModal() {
    document.getElementById('imageUrlInput').value = '';
    document.getElementById('imageAltInput').value = '';
    openModal(imageModal);
}

// Open metadata modal
function openMetadataModal() {
    populateMetadataFields();
    openModal(metadataModal);
}

// Open export modal
function openExportModal() {
    document.getElementById('exportFormatSelect').value = 'txt';
    document.getElementById('includeMetadataCheckbox').checked = true;
    openModal(exportModal);
}

// Open folder modal
function openFolderModal() {
    document.getElementById('folderNameInput').value = '';
    populateFolderSelect(document.getElementById('parentFolderSelect'));
    openModal(folderModal);
}

// Toggle preview mode
function togglePreview() {
    isPreviewMode = !isPreviewMode;

    if (isPreviewMode) {
        editor.style.display = 'none';
        notePreview.style.display = 'block';
        updatePreview();
        previewBtn.textContent = '[E]dit';
    } else {
        editor.style.display = 'block';
        notePreview.style.display = 'none';
        previewBtn.textContent = '[P]review';
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

    // Replace external links
    text = text.replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" target="_blank" class="external-link">$1</a>');

    // Replace images
    text = text.replace(/!\[(.*?)\]\((https?:\/\/.*?)\)/g, '<img src="$2" alt="$1" class="embedded-image">');

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

// Populate folder select dropdown
function populateFolderSelect(selectElement) {
    selectElement.innerHTML = '';

    // Add root folder
    const rootOption = document.createElement('option');
    rootOption.value = 'root';
    rootOption.textContent = 'Root';
    selectElement.appendChild(rootOption);

    // Add other folders
    const addFolderOptions = (folderId, depth = 0) => {
        const folder = folders[folderId];
        if (!folder) return;

        if (folderId !== 'root') {
            const option = document.createElement('option');
            option.value = folderId;
            option.textContent = '  '.repeat(depth) + folder.name;
            selectElement.appendChild(option);
        }

        // Add children
        if (folder.children && folder.children.length > 0) {
            folder.children.forEach(childId => {
                addFolderOptions(childId, depth + 1);
            });
        }
    };

    addFolderOptions('root');
}

// Populate note select dropdown
function populateNoteSelect() {
    const noteNameSelect = document.getElementById('noteNameSelect');
    noteNameSelect.innerHTML = '';

    const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');

    Object.keys(files).forEach(filename => {
        const option = document.createElement('option');
        option.value = filename;
        option.textContent = filename;
        noteNameSelect.appendChild(option);
    });
}

// Populate metadata fields
function populateMetadataFields() {
    const metadataFields = document.getElementById('metadataFields');
    metadataFields.innerHTML = '';

    if (!currentMetadata) return;

    Object.entries(currentMetadata).forEach(([key, value]) => {
        const fieldGroup = document.createElement('div');
        fieldGroup.className = 'form-group';

        const label = document.createElement('label');
        label.textContent = key + ':';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.dataset.key = key;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => fieldGroup.remove();

        fieldGroup.appendChild(label);
        fieldGroup.appendChild(input);
        fieldGroup.appendChild(deleteBtn);

        metadataFields.appendChild(fieldGroup);
    });
}

// Save metadata
function saveMetadata() {
    try {
        const metadataFields = document.getElementById('metadataFields');
        const inputs = metadataFields.querySelectorAll('input');

        const newMetadata = {};

        inputs.forEach(input => {
            newMetadata[input.dataset.key] = input.value;
        });

        currentMetadata = newMetadata;

        // Update font if it changed
        if (currentMetadata.font) {
            currentFont = currentMetadata.font;
            document.getElementById('fontSelect').value = currentFont;
            editor.className = currentFont === 'default' ? '' : `font-${currentFont}`;
        }

        closeModal(metadataModal);
        showNotification("Metadata updated", "success");
    } catch (error) {
        console.error('Error saving metadata:', error);
        showNotification("Failed to update metadata", "error");
    }
}

// Export note
function exportNote() {
    try {
        const format = document.getElementById('exportFormatSelect').value;
        const includeMetadata = document.getElementById('includeMetadataCheckbox').checked;

        let content = '';
        let filename = currentFilename || 'untitled';

        switch (format) {
            case 'txt':
                content = editor.value;
                filename += '.txt';
                break;
            case 'md':
                content = editor.value;
                filename += '.md';
                break;
            case 'html':
                content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${filename}</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .metadata { background: #f5f5f5; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
        .content { line-height: 1.6; }
    </style>
</head>
<body>
    ${includeMetadata ? `<div class="metadata">
        <h3>Metadata</h3>
        <pre>${JSON.stringify(currentMetadata, null, 2)}</pre>
    </div>` : ''}
    <div class="content">
        ${formatText(editor.value)}
    </div>
</body>
</html>`;
                filename += '.html';
                break;
            case 'json':
                content = JSON.stringify({
                    content: editor.value,
                    metadata: includeMetadata ? currentMetadata : undefined,
                    tags: currentTags,
                    folder: currentFolder,
                    timestamp: Date.now()
                }, null, 2);
                filename += '.json';
                break;
        }

        // Create download link
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        closeModal(exportModal);
        showNotification(`Exported as "${filename}"`, "success");
    } catch (error) {
        console.error('Error exporting note:', error);
        showNotification("Failed to export note", "error");
    }
}

// Create folder
function createFolder() {
    try {
        const folderNameInput = document.getElementById('folderNameInput');
        const parentFolderSelect = document.getElementById('parentFolderSelect');

        const folderName = folderNameInput.value.trim();
        const parentFolder = parentFolderSelect.value;

        if (!folderName) {
            showNotification("Folder name is required", "error");
            return;
        }

        // Generate unique ID
        const folderId = 'folder_' + Date.now();

        // Create folder
        folders[folderId] = {
            name: folderName,
            parent: parentFolder,
            children: []
        };

        // Add to parent's children
        if (!folders[parentFolder].children) {
            folders[parentFolder].children = [];
        }
        folders[parentFolder].children.push(folderId);

        // Save folders
        saveFolders();

        closeModal(folderModal);
        showNotification(`Folder "${folderName}" created`, "success");

        // Update UI
        updateFoldersUI();
    } catch (error) {
        console.error('Error creating folder:', error);
        showNotification("Failed to create folder", "error");
    }
}

// Start haunting effects
function startHauntingEffects() {
    // Increase haunting intensity over time
    setInterval(() => {
        const timeSinceLastActivity = Date.now() - lastActivity;
        if (timeSinceLastActivity > 30000) { // 30 seconds
            hauntingIntensity = Math.min(10, hauntingIntensity + 1);
        }
    }, 60000); // Check every minute

    // Random glitch effects
    setInterval(() => {
        if (Math.random() < 0.1 + (hauntingIntensity * 0.02)) {
            triggerGlitchEffect();
        }
    }, 10000);

    // Update system metrics
    setInterval(updateSystemMetrics, 5000);

    // Voidrane footer glitch effect
    const voidraneFooter = document.getElementById('voidraneFooter');
    if (voidraneFooter) {
        // Make the footer more active when haunting intensity increases
        setInterval(() => {
            // Base probability increases with haunting intensity
            if (Math.random() < 0.08 + (hauntingIntensity * 0.02)) {
                // Create multiple glitch iterations based on haunting intensity
                const glitchIterations = 1 + Math.floor(Math.random() * (2 + Math.min(3, hauntingIntensity / 2)));
                let currentText = voidraneFooter.textContent;

                const glitchSequence = async () => {
                    // Add a subtle class to indicate activity
                    voidraneFooter.classList.add('active');

                    for (let i = 0; i < glitchIterations; i++) {
                        // Create glitched text with more aggressive character replacements
                        // Intensity of glitching increases with haunting intensity
                        const glitchText = currentText.split('').map(char => {
                            if (Math.random() < 0.3 + (hauntingIntensity * 0.02)) {
                                // More varied character replacements
                                const offset = Math.floor(Math.random() * (7 + Math.min(5, hauntingIntensity))) - 3;
                                return String.fromCharCode(char.charCodeAt(0) + offset);
                            }
                            return char;
                        }).join('');

                        voidraneFooter.textContent = glitchText;

                        // Wait a random short time between glitch iterations
                        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
                    }

                    // Reset to original text after glitching
                    setTimeout(() => {
                        voidraneFooter.textContent = 'conjured by voidrane';
                        voidraneFooter.classList.remove('active');
                    }, 100 + Math.random() * 200);
                };

                glitchSequence();
            }
        }, 4000 - (hauntingIntensity * 200)); // Frequency increases with haunting intensity

        // Add event listener to make the footer glitch when clicked nearby
        document.addEventListener('click', (e) => {
            // Check if click is near the footer (within 100px)
            const footerRect = voidraneFooter.getBoundingClientRect();
            const distanceX = Math.max(0, Math.max(footerRect.left - e.clientX, e.clientX - footerRect.right));
            const distanceY = Math.max(0, Math.max(footerRect.top - e.clientY, e.clientY - footerRect.bottom));

            if (distanceX < 100 && distanceY < 100) {
                // Trigger a glitch if click is nearby
                const glitchSequence = async () => {
                    const originalText = voidraneFooter.textContent;
                    voidraneFooter.classList.add('active');

                    // More intense glitch for direct interaction
                    for (let i = 0; i < 3; i++) {
                        const glitchText = originalText.split('').map(char => {
                            if (Math.random() < 0.6) {
                                const offset = Math.floor(Math.random() * 12) - 6;
                                return String.fromCharCode(char.charCodeAt(0) + offset);
                            }
                            return char;
                        }).join('');

                        voidraneFooter.textContent = glitchText;
                        await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 70));
                    }

                    setTimeout(() => {
                        voidraneFooter.textContent = 'conjured by voidrane';
                        voidraneFooter.classList.remove('active');
                    }, 100);
                };

                glitchSequence();
            }
        });
    }

    // Reset activity timer on user interaction
    document.addEventListener('keydown', () => {
        lastActivity = Date.now();
        hauntingIntensity = Math.max(0, hauntingIntensity - 1);
    });

    document.addEventListener('click', () => {
        lastActivity = Date.now();
    });
}

// Trigger glitch effect
function triggerGlitchEffect() {
    const glitchEffect = document.getElementById('glitchEffect');
    glitchEffect.style.opacity = '0.05';
    glitchEffect.style.display = 'block';

    setTimeout(() => {
        glitchEffect.style.opacity = '0';
        setTimeout(() => {
            glitchEffect.style.display = 'none';
        }, 500);
    }, 150);

    // Occasionally show a system message
    if (Math.random() < 0.3) {
        showSystemMessage();
    }
}

// Show system message
function showSystemMessage() {
    const messages = [
        "Signal detected in void sector",
        "Memory fragmentation detected",
        "Unauthorized access attempt blocked",
        "Temporal anomaly detected",
        "Reality instability increasing",
        "Consciousness threshold approaching",
        "Monitoring active",
        "They are watching",
        "Data corruption imminent",
        "Signal leakage detected"
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];
    setStatusText(message);

    setTimeout(() => {
        setStatusText("System idle");
    }, 3000 + Math.random() * 2000);
}

// Update system metrics
function updateSystemMetrics() {
    // Memory allocation
    const memoryValue = document.getElementById('memoryValue');
    const memoryBar = document.getElementById('memoryBar');
    const newMemoryValue = 30 + Math.random() * 40;
    memoryValue.textContent = newMemoryValue.toFixed(1);
    memoryBar.style.width = `${newMemoryValue}%`;

    // Void echo strength
    const voidValue = document.getElementById('voidValue');
    const voidBar = document.getElementById('voidBar');
    const baseVoidValue = 10 + Math.random() * 30;
    const hauntedVoidValue = baseVoidValue + (hauntingIntensity * 3);
    voidValue.textContent = hauntedVoidValue.toFixed(1);
    voidBar.style.width = `${hauntedVoidValue}%`;
}

// Enhanced status messages
const ENHANCED_STATUS_MESSAGES = [
    "Signal detected in void sector",
    "Memory fragmentation detected",
    "Unauthorized access attempt blocked",
    "Temporal anomaly detected",
    "Reality instability increasing",
    "Consciousness threshold approaching",
    "Monitoring active",
    "They are watching",
    "Data corruption imminent",
    "Signal leakage detected"
];

// Update backlinks when a note is renamed
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

// Update backlinks when a note is saved
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

// Load saved files
function loadSavedFiles() {
    try {
        const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');
        fileList.innerHTML = '';

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

// Load file
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
            const decryptionKey = decryptionKeyInput.value;

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
            // Pre-select the file somehow?
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
function deleteFile(filename) {
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

            // Delete the file
            delete files[filename];
            localStorage.setItem('layer3-files', JSON.stringify(files));

            // If this was the current file, clear editor
            if (currentFilename === filename) {
                createNewNote();
            }

            loadSavedFiles();
            updateFoldersUI();
            showNotification(`Deleted "${filename}"`, "success");
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        showNotification("Failed to delete file", "error");
    }
}

// Add a link to the editor
function addLink() {
    const linkType = linkTypeSelect.value;
    let linkText = linkTextInput.value.trim();

    if (linkText === '') {
        showNotification("Link text is required", "warning");
        return;
    }

    let linkCode = '';

    if (linkType === 'note') {
        const noteName = noteNameSelect.value;
        if (!noteName) {
            showNotification("Select a note to link to", "warning");
            return;
        }
        linkCode = `[[${noteName}]]`;
    } else {
        const url = urlInput.value.trim();
        if (!url) {
            showNotification("URL is required", "warning");
            return;
        }
        linkCode = `[${linkText}](${url})`;
    }

    // Insert link at cursor position or replace selected text
    const cursorPos = editor.selectionStart;
    const endPos = editor.selectionEnd;

    editor.value = editor.value.substring(0, cursorPos) + linkCode + editor.value.substring(endPos);

    closeModal(linkModal);
    showNotification("Link added", "success");

    // Update preview if active
    if (isPreviewMode) {
        updatePreview();
    }
}

// Add an image to the editor
function addImage() {
    const imageUrl = imageUrlInput.value.trim();
    const imageAlt = imageAltInput.value.trim() || 'Image';

    if (!imageUrl) {
        showNotification("Image URL is required", "warning");
        return;
    }

    const imageCode = `![${imageAlt}](${imageUrl})`;

    // Insert image at cursor position or replace selected text
    const cursorPos = editor.selectionStart;
    const endPos = editor.selectionEnd;

    editor.value = editor.value.substring(0, cursorPos) + imageCode + editor.value.substring(endPos);

    closeModal(imageModal);
    showNotification("Image added", "success");

    // Update preview if active
    if (isPreviewMode) {
        updatePreview();
    }
}

// Encrypt text
async function encryptText() {
    const key = encryptKeyInput.value;

    if (!key) {
        showNotification("Encryption key required", "error");
        return;
    }

    simulateNetworkActivity(true);
    setStatusText("Encrypting...");

    try {
        const encrypted = await encrypt(editor.value, key);
        editor.value = encrypted;
        isEncrypted = true;

        closeModal(encryptModal);
        showNotification("Text encrypted", "success");
    } catch (error) {
        console.error('Error encrypting text:', error);
        showNotification("Encryption failed", "error");
    } finally {
        setStatusText("System idle");
    }
}

// Decrypt text
async function decryptText() {
    const key = decryptKeyInput.value;

    if (!key) {
        showNotification("Decryption key required", "error");
        return;
    }

    simulateNetworkActivity(true);
    setStatusText("Decrypting...");

    try {
        const decrypted = await decrypt(editor.value, key);
        editor.value = decrypted;
        isEncrypted = false;

        closeModal(decryptModal);
        showNotification("Text decrypted", "success");
    } catch (error) {
        console.error('Error decrypting text:', error);
        showNotification("Incorrect decryption key", "error");
    } finally {
        setStatusText("System idle");
    }
}

// Hide format toolbar
function hideFormatToolbar() {
    formatToolbar.style.display = 'none';
}

// Show format toolbar
function showFormatToolbar() {
    formatToolbar.style.display = 'flex';
}

// Encrypt text using AES
async function encrypt(text, key) {
    try {
        // Convert the key to a suitable format
        const keyData = await deriveKey(key);

        // Convert the text to ArrayBuffer
        const encoder = new TextEncoder();
        const data = encoder.encode(text);

        // Generate a random IV
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Encrypt the data
        const encryptedData = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv
            },
            keyData,
            data
        );

        // Combine the IV and encrypted data
        const result = new Uint8Array(iv.length + encryptedData.byteLength);
        result.set(iv);
        result.set(new Uint8Array(encryptedData), iv.length);

        // Convert to Base64 for storage
        return btoa(String.fromCharCode.apply(null, result));
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Encryption failed');
    }
}

// Decrypt text using AES
async function decrypt(encryptedText, key) {
    try {
        // Convert the key to a suitable format
        const keyData = await deriveKey(key);

        // Convert the Base64 encrypted data back to ArrayBuffer
        const encryptedData = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));

        // Extract the IV and the actual encrypted data
        const iv = encryptedData.slice(0, 12);
        const data = encryptedData.slice(12);

        // Decrypt the data
        const decryptedData = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv
            },
            keyData,
            data
        );

        // Convert the decrypted data back to text
        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Decryption failed');
    }
}

// Derive a cryptographic key from a password
async function deriveKey(password) {
    // Convert the password to an ArrayBuffer
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    // Hash the password using SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);

    // Import the hashed password as a cryptographic key
    return crypto.subtle.importKey(
        'raw',
        hashBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

// Toggle folder expansion
function toggleFolderExpansion(folderId) {
    const folderItem = document.querySelector(`.folder-item[data-folder-id="${folderId}"]`);
    const folderContent = folderItem.nextElementSibling;

    if (folderContent && folderContent.classList.contains('folder-content')) {
        folderContent.classList.toggle('expanded');
        folderItem.classList.toggle('expanded');
    }
}

// Filter notes by tag
function filterByTag(tag) {
    try {
        const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');
        const filteredFiles = {};

        Object.entries(files).forEach(([filename, fileData]) => {
            if (fileData.tags && fileData.tags.includes(tag)) {
                filteredFiles[filename] = fileData;
            }
        });

        // Show filtered files in a modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Notes with tag "${tag}"</h3>
                <div class="file-list custom-scrollbar" id="tagFilterList"></div>
                <div class="modal-actions">
                    <button id="tagFilterCloseBtn">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const tagFilterList = modal.querySelector('#tagFilterList');

        if (Object.keys(filteredFiles).length === 0) {
            tagFilterList.innerHTML = '<div class="empty-message">No notes found with this tag</div>';
        } else {
            Object.entries(filteredFiles).forEach(([filename, fileData]) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.textContent = filename;
                fileItem.onclick = () => {
                    loadFileFromFolder(filename);
                    closeModal(modal);
                };
                tagFilterList.appendChild(fileItem);
            });
        }

        modal.querySelector('#tagFilterCloseBtn').addEventListener('click', () => {
            closeModal(modal);
            document.body.removeChild(modal);
        });

        openModal(modal);
    } catch (error) {
        console.error('Error filtering by tag:', error);
        showNotification("Failed to filter notes", "error");
    }
}

// Load fragment
function loadFragment(fragmentId) {
    try {
        // Fragments are predefined text snippets
        const fragments = {
            'echo_residue.437': "The signal persists long after transmission ends. Echoes in empty sectors. Watching.",
            'void_whisper.612': "They speak from the spaces between data. Listen carefully to the silence.",
            'memory_ghost.189': "System retains impressions of deleted files. Nothing is ever truly gone."
        };

        const fragmentText = fragments[fragmentId] || "Fragment data corrupted or unavailable.";

        // Insert at cursor position
        const cursorPos = editor.selectionStart;
        editor.value = editor.value.substring(0, cursorPos) + fragmentText + editor.value.substring(cursorPos);

        showNotification(`Fragment ${fragmentId} loaded`, "success");

        // Update preview if active
        if (isPreviewMode) {
            updatePreview();
        }
    } catch (error) {
        console.error('Error loading fragment:', error);
        showNotification("Failed to load fragment", "error");
    }
}

// Populate fragments list
function populateFragments() {
    const fragments = [
        'echo_residue.437',
        'void_whisper.612',
        'memory_ghost.189'
    ];

    fragmentsList.innerHTML = '';

    fragments.forEach(fragmentId => {
        const fragmentItem = document.createElement('div');
        fragmentItem.className = 'fragment-item';
        fragmentItem.textContent = fragmentId;
        fragmentsList.appendChild(fragmentItem);
    });
}

// Update folders UI
function updateFoldersUI() {
    foldersList.innerHTML = '';

    const buildFolderTree = (folderId, container) => {
        const folder = folders[folderId];
        if (!folder) return;

        if (folderId !== 'root') {
            const folderItem = document.createElement('div');
            folderItem.className = 'folder-item';
            folderItem.dataset.folderId = folderId;
            folderItem.innerHTML = `
                <span class="folder-icon">[+]</span>
                <span class="folder-name">${folder.name}</span>
            `;
            container.appendChild(folderItem);

            // Create container for folder contents
            const folderContent = document.createElement('div');
            folderContent.className = 'folder-content';
            container.appendChild(folderContent);

            // Add files in this folder
            const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');
            const folderFiles = Object.entries(files).filter(([_, fileData]) => fileData.folder === folderId);

            if (folderFiles.length > 0) {
                folderFiles.forEach(([filename, _]) => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    fileItem.textContent = filename;
                    fileItem.onclick = () => loadFileFromFolder(filename);
                    folderContent.appendChild(fileItem);
                });
            }

            // Add children folders
            if (folder.children && folder.children.length > 0) {
                folder.children.forEach(childId => {
                    buildFolderTree(childId, folderContent);
                });
            }
        } else {
            // Root folder - just add children
            if (folder.children && folder.children.length > 0) {
                folder.children.forEach(childId => {
                    buildFolderTree(childId, container);
                });
            }

            // Add files in root
            const files = JSON.parse(localStorage.getItem('layer3-files') || '{}');
            const rootFiles = Object.entries(files).filter(([_, fileData]) => !fileData.folder || fileData.folder === 'root');

            if (rootFiles.length > 0) {
                const rootFolderItem = document.createElement('div');
                rootFolderItem.className = 'folder-item';
                rootFolderItem.dataset.folderId = 'root-files';
                rootFolderItem.innerHTML = `
                    <span class="folder-icon">[+]</span>
                    <span class="folder-name">Root Files</span>
                `;
                container.appendChild(rootFolderItem);

                const rootContent = document.createElement('div');
                rootContent.className = 'folder-content';
                container.appendChild(rootContent);

                rootFiles.forEach(([filename, _]) => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    fileItem.textContent = filename;
                    fileItem.onclick = () => loadFileFromFolder(filename);
                    rootContent.appendChild(fileItem);
                });
            }
        }
    };

    buildFolderTree('root', foldersList);
}

// Update tags UI
function updateTagsUI() {
    tagsList.innerHTML = '';

    if (Object.keys(allTags).length === 0) {
        tagsList.innerHTML = '<div class="empty-message">No tags yet</div>';
        return;
    }

    // Sort tags by count (descending)
    const sortedTags = Object.entries(allTags).sort((a, b) => b[1].count - a[1].count);

    sortedTags.forEach(([tag, data]) => {
        const tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        tagItem.dataset.tag = tag;
        tagItem.innerHTML = `
            <span class="tag-name">${tag}</span>
            <span class="tag-count">${data.count}</span>
        `;
        tagsList.appendChild(tagItem);
    });
}

// Save folders to localStorage
function saveFolders() {
    localStorage.setItem('layer3-folders', JSON.stringify(folders));
}

// Save tags to localStorage
function saveTags() {
    localStorage.setItem('layer3-tags', JSON.stringify(allTags));
}

// Save note links to localStorage
function saveNoteLinks() {
    localStorage.setItem('layer3-links', JSON.stringify(noteLinks));
}

// Simulate network activity
function simulateNetworkActivity(intense = false) {
    const duration = intense ? 2000 : 500 + Math.random() * 1000;
    const interval = intense ? 100 : 200 + Math.random() * 300;

    let elapsed = 0;

    const networkInterval = setInterval(() => {
        if (Math.random() < 0.5) {
            uploadIcon.classList.add('active');
            setTimeout(() => {
                uploadIcon.classList.remove('active');
            }, 100 + Math.random() * 200);
        }

        if (Math.random() < 0.5) {
            downloadIcon.classList.add('active');
            setTimeout(() => {
                downloadIcon.classList.remove('active');
            }, 100 + Math.random() * 200);
        }

        // Occasionally flicker connection status
        if (Math.random() < 0.1) {
            connectionStatus.textContent = "ACTIVE";
            setTimeout(() => {
                connectionStatus.textContent = "OFFLINE";
            }, 200 + Math.random() * 300);
        }

        elapsed += interval;

        if (elapsed >= duration) {
            clearInterval(networkInterval);
        }
    }, interval);
}

// Set status text
function setStatusText(text) {
    statusText.textContent = text;
}

// Get random status message
function getRandomStatusMessage() {
    return ENHANCED_STATUS_MESSAGES[Math.floor(Math.random() * ENHANCED_STATUS_MESSAGES.length)];
}

// Show notification
function showNotification(message, type = "system") {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notificationsContainer.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// Open modal
function openModal(modal) {
    modal.classList.add('active');
}

// Close modal
function closeModal(modal) {
    modal.classList.remove('active');
}

// Set up event listeners for sidebar items
function setupSidebarListeners() {
    // Folders panel
    foldersList.addEventListener('click', (e) => {
        const folderItem = e.target.closest('.folder-item');
        if (folderItem) {
            const folderId = folderItem.dataset.folderId;
            toggleFolderExpansion(folderId);
        }

        const fileItem = e.target.closest('.file-item');
        if (fileItem && fileItem.textContent) {
            loadFileFromFolder(fileItem.textContent.trim());
        }
    });

    // Tags panel
    tagsList.addEventListener('click', (e) => {
        const tagItem = e.target.closest('.tag-item');
        if (tagItem) {
            const tag = tagItem.dataset.tag;
            filterByTag(tag);
        }
    });

    // Fragments panel
    fragmentsList.addEventListener('click', (e) => {
        const fragmentItem = e.target.closest('.fragment-item');
        if (fragmentItem) {
            loadFragment(fragmentItem.textContent);
        }
    });
}

// Initialize the application
function init() {
    // Set up event listeners for buttons
    newBtn.addEventListener('click', createNewNote);
    saveBtn.addEventListener('click', openSaveModal);
    loadBtn.addEventListener('click', openLoadModal);
    encryptBtn.addEventListener('click', openEncryptModal);
    decryptBtn.addEventListener('click', openDecryptModal);
    formatBtn.addEventListener('click', showFormatToolbar);
    linkBtn.addEventListener('click', openLinkModal);
    imageBtn.addEventListener('click', openImageModal);
    previewBtn.addEventListener('click', togglePreview);
    metadataBtn.addEventListener('click', openMetadataModal);
    exportBtn.addEventListener('click', openExportModal);
    createFolderBtn.addEventListener('click', openFolderModal);

    // Set up event listeners for modal buttons
    document.getElementById('saveConfirmBtn').addEventListener('click', saveNote);
    document.getElementById('saveCancelBtn').addEventListener('click', () => closeModal(saveModal));
    document.getElementById('loadCancelBtn').addEventListener('click', () => closeModal(loadModal));
    document.getElementById('encryptConfirmBtn').addEventListener('click', encryptText);
    document.getElementById('encryptCancelBtn').addEventListener('click', () => closeModal(encryptModal));
    document.getElementById('decryptConfirmBtn').addEventListener('click', decryptText);
    document.getElementById('decryptCancelBtn').addEventListener('click', () => closeModal(decryptModal));
    document.getElementById('formatCloseBtn').addEventListener('click', hideFormatToolbar);
    document.getElementById('linkConfirmBtn').addEventListener('click', addLink);
    document.getElementById('linkCancelBtn').addEventListener('click', () => closeModal(linkModal));
    document.getElementById('imageConfirmBtn').addEventListener('click', addImage);
    document.getElementById('imageCancelBtn').addEventListener('click', () => closeModal(imageModal));

    // Set up event listeners for sidebar items
    setupSidebarListeners();

    // Load initial data
    updateFoldersUI();
    updateTagsUI();
    populateFragments();

    // Create a new note to start
    createNewNote();

    // Start haunting effects
    startHauntingEffects();
}

// Call init to initialize the application
init();