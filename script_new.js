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
    document.getElementById('metadataSaveBtn').addEventListener('click', saveMetadata);
    document.getElementById('metadataCancelBtn').addEventListener('click', () => closeModal(metadataModal));
    document.getElementById('exportConfirmBtn').addEventListener('click', exportNote);
    document.getElementById('exportCancelBtn').addEventListener('click', () => closeModal(exportModal));
    document.getElementById('folderConfirmBtn').addEventListener('click', createFolder);
    document.getElementById('folderCancelBtn').addEventListener('click', () => closeModal(folderModal));
    
    // Set up event listeners for format toolbar buttons
    const formatButtons = formatToolbar.querySelectorAll('[data-format]');
    formatButtons.forEach(button => {
        button.addEventListener('click', () => applyFormat(button.dataset.format, button.dataset.color || button.dataset.size));
    });
    
    // Set up event listener for font selection
    const fontSelect = document.getElementById('fontSelect');
    fontSelect.addEventListener('change', () => {
        currentFont = fontSelect.value;
        editor.className = currentFont === 'default' ? '' : `font-${currentFont}`;
        
        // Update metadata if we have a current file
        if (currentMetadata) {
            currentMetadata.font = currentFont;
        }
    });
    
    // Set up event listener for link type selection
    const linkTypeSelect = document.getElementById('linkTypeSelect');
    linkTypeSelect.addEventListener('change', () => {
        const urlGroup = document.getElementById('urlGroup');
        const noteNameGroup = document.getElementById('noteNameGroup');
        
        if (linkTypeSelect.value === 'url') {
            urlGroup.style.display = 'block';
            noteNameGroup.style.display = 'none';
        } else {
            urlGroup.style.display = 'none';
            noteNameGroup.style.display = 'block';
            populateNoteSelect();
        }
    });
    
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
