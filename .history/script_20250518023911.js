        }
        
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

// Initialize the application
init();