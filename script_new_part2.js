// Set up event listeners for sidebar items
function setupSidebarListeners() {
    // Folders panel
    foldersList.addEventListener('click', (e) => {
        const folderItem = e.target.closest('.folder-item');
        if (folderItem) {
            const folderId = folderItem.dataset.folderId;
            toggleFolderExpansion(folderId);
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

// Initialize the application
init();
