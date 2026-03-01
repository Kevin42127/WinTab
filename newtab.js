class NewTabManager {
    constructor() {
        this.shortcuts = [];
        
        this.init();
    }

    async init() {
        await this.loadShortcuts();
        
        // 載入並應用背景圖片
        const backgroundImage = await this.loadBackground();
        this.setBackgroundImage(backgroundImage);
        
        this.startClock();
        this.loadUserInfo();
    }

    async loadShortcuts() {
        try {
            const stored = await chrome.storage.sync.get('shortcuts');
            this.shortcuts = stored.shortcuts || await this.getDefaultShortcuts();
            
            // 確保所有快捷方式都有圖示
            this.shortcuts = this.shortcuts.map(shortcut => ({
                ...shortcut,
                icon: shortcut.icon || this.getFavicon(shortcut.url)
            }));
            
            this.renderShortcuts();
        } catch (error) {
            console.error('Failed to load shortcuts:', error);
            this.shortcuts = await this.getDefaultShortcuts();
            this.renderShortcuts();
        }
    }

    async getDefaultShortcuts() {
        try {
            const topSites = await chrome.topSites.get();
            return topSites.slice(0, 8).map(site => ({
                name: site.title || new URL(site.url).hostname,
                url: site.url,
                icon: this.getFavicon(site.url)
            }));
        } catch (error) {
            return [
                { name: 'Google', url: 'https://www.google.com', icon: this.getFavicon('https://www.google.com') },
                { name: 'YouTube', url: 'https://www.youtube.com', icon: this.getFavicon('https://www.youtube.com') },
                { name: 'Gmail', url: 'https://mail.google.com', icon: this.getFavicon('https://mail.google.com') },
                { name: 'Facebook', url: 'https://www.facebook.com', icon: this.getFavicon('https://www.facebook.com') }
            ];
        }
    }

    getFavicon(url) {
        try {
            console.log('Getting favicon for:', url);
            
            // 確保 URL 格式正確
            if (!url || typeof url !== 'string') {
                console.warn('Invalid URL, cannot fetch favicon:', url);
                return '';
            }
            
            // 如果不是完整 URL，加上 https://
            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
            const domain = new URL(fullUrl).hostname;
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            console.log('Favicon URL:', faviconUrl);
            return faviconUrl;
        } catch (error) {
            console.error('Failed to get favicon for:', url, error);
            return '';
        }
    }

    bindEvents() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        searchBtn.addEventListener('click', () => {
            this.performSearch();
        });

        
        document.getElementById('addShortcut').addEventListener('click', () => {
            this.addShortcut();
        });

        
        document.getElementById('clearAllShortcuts').addEventListener('click', () => {
            this.clearAllShortcuts();
        });

        document.getElementById('notificationClose').addEventListener('click', () => {
            this.hideNotification();
        });

        const startBtn = document.querySelector('.start-btn');
        const startMenu = document.getElementById('startMenu');

        startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startMenu.classList.toggle('open');
            
            // 綁定背景設定事件（只在開始選單打開時綁定一次）
            const backgroundBtn = document.getElementById('customBackground');
            if (backgroundBtn && !backgroundBtn.hasAttribute('data-bound')) {
                backgroundBtn.addEventListener('click', () => {
                    this.openBackgroundDialog();
                    startMenu.classList.remove('open');
                });
                backgroundBtn.setAttribute('data-bound', 'true');
            }
        });

        
        document.addEventListener('click', (e) => {
            if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
                startMenu.classList.remove('open');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                startMenu.classList.remove('open');
            }
        });

        document.getElementById('startNewTab').addEventListener('click', () => {
            chrome.tabs.create({ active: true });
        });

        document.querySelectorAll('.start-nav-item[data-url]').forEach(btn => {
            btn.addEventListener('click', () => {
                chrome.tabs.create({ url: btn.dataset.url, active: true });
            });
        });

        }

    startClock() {
        const updateClock = () => {
            const now = new Date();
            
            // 偵測是否為偏好 12 小時制的地區
            const is12HourRegion = navigator.language.includes('en-US') || 
                                  navigator.language.includes('en-CA') ||
                                  navigator.language.includes('en-AU') ||
                                  navigator.language.includes('en-NZ') ||
                                  navigator.language.includes('en-PH');
            
            let timeStr;
            if (is12HourRegion) {
                const hours = now.getHours() % 12 || 12;
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
                timeStr = `${hours}:${minutes} ${ampm}`;
            } else {
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                timeStr = `${hours}:${minutes}`;
            }
            
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const weekday = weekdays[now.getDay()];
            const dateStr = `${weekday}, ${month}/${day}/${year}`;
            
            document.getElementById('time').textContent = timeStr;
            document.getElementById('date').textContent = dateStr;
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }

    performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return;
        
        let url;
        if (query.includes('.') && !query.includes(' ')) {
            url = query.startsWith('http') ? query : `https://${query}`;
        } else {
            url = 'https://www.google.com/search?q=' + encodeURIComponent(query);
        }
        
        window.location.href = url;
    }

    renderShortcuts() {
        const grid = document.getElementById('shortcutsGrid');
        grid.innerHTML = this.shortcuts.map((shortcut, index) => {
            console.log('Shortcut:', shortcut.name, 'Icon:', shortcut.icon);
            return `
            <div class="shortcut-item" data-index="${index}" data-url="${shortcut.url}">
                <button class="shortcut-delete" data-index="${index}" title="Remove">&times;</button>
                ${shortcut.icon ? `<div class="shortcut-icon"><img src="${shortcut.icon}" alt="${shortcut.name}" style="display:block;"></div>` : ''}
                <div class="shortcut-name">${shortcut.name}</div>
            </div>
        `;
        }).join('');

        grid.querySelectorAll('.shortcut-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.shortcut-delete')) return;
                window.open(item.dataset.url, '_blank');
            });
        });

        grid.querySelectorAll('.shortcut-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.deleteShortcut(index);
            });
        });
    }

    async deleteShortcut(index) {
        const name = this.shortcuts[index].name;
        this.shortcuts.splice(index, 1);
        await this.saveShortcuts();
        this.renderShortcuts();
        this.showNotification(`Removed "${name}"`, 'info');
    }

    async clearAllShortcuts() {
        if (this.shortcuts.length === 0) {
            this.showNotification('No shortcuts to clear', 'info');
            return;
        }

        const dialog = document.createElement('div');
        dialog.className = 'shortcut-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Clear All Shortcuts</h3>
                <p style="color: white;">Are you sure you want to remove all shortcuts? This action cannot be undone.</p>
                <div class="dialog-buttons">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-confirm">Clear All</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const cancelBtn = dialog.querySelector('.btn-cancel');
        const confirmBtn = dialog.querySelector('.btn-confirm');
        
        const closeDialog = () => {
            dialog.remove();
        };
        
        // 點擊外部關閉模態框
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                closeDialog();
            }
        });
        
        cancelBtn.addEventListener('click', closeDialog);
        
        confirmBtn.addEventListener('click', async () => {
            const count = this.shortcuts.length;
            this.shortcuts = [];
            await this.saveShortcuts();
            this.renderShortcuts();
            this.showNotification(`Cleared ${count} shortcuts`, 'success');
            closeDialog();
        });
    }

    async addShortcut() {
        const dialog = document.createElement('div');
        dialog.className = 'shortcut-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Add Shortcut</h3>
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="shortcutName" placeholder="e.g. Google">
                </div>
                <div class="form-group">
                    <label>URL</label>
                    <input type="text" id="shortcutUrl" placeholder="e.g. google.com">
                </div>
                <div class="dialog-buttons">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-confirm">Add</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const nameInput = dialog.querySelector('#shortcutName');
        const urlInput = dialog.querySelector('#shortcutUrl');
        const cancelBtn = dialog.querySelector('.btn-cancel');
        const confirmBtn = dialog.querySelector('.btn-confirm');
        
        const closeDialog = () => {
            dialog.remove();
        };
        
        // 點擊外部關閉模態框
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                closeDialog();
            }
        });
        
        cancelBtn.addEventListener('click', closeDialog);
        
        confirmBtn.addEventListener('click', async () => {
            const name = nameInput.value.trim();
            const url = urlInput.value.trim();
            
            if (!name) {
                this.showNotification('Please enter a name', 'error');
                return;
            }
            
            if (!url) {
                this.showNotification('Please enter a URL', 'error');
                return;
            }
            
            const shortcut = {
                name,
                url: url.startsWith('http') ? url : `https://${url}`,
                icon: this.getFavicon(url)
            };
            
            this.shortcuts.push(shortcut);
            await this.saveShortcuts();
            this.renderShortcuts();
            
            this.showNotification(`Added "${name}" to shortcuts`, 'success');
            closeDialog();
        });
        
        nameInput.focus();
        
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') urlInput.focus();
        });
        
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') confirmBtn.click();
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const title = document.getElementById('notificationTitle');
        const messageEl = document.getElementById('notificationMessage');
        
        const titles = {
            success: 'Success',
            error: 'Error',
            info: 'Notice',
            warning: 'Warning'
        };
        
        title.textContent = titles[type] || 'Notice';
        messageEl.textContent = message;
        
        notification.className = 'notification show';
        const bar = notification.querySelector('.notification-bar');
        if (bar) {
            const colors = { success: '#4CAF50', error: '#f44336', warning: '#ff9800', info: '#0078d4' };
            bar.style.background = colors[type] || '#0078d4';
        }
        
        setTimeout(() => {
            this.hideNotification();
        }, 3000);
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        notification.classList.remove('show');
    }

    async saveShortcuts() {
        try {
            await chrome.storage.sync.set({ shortcuts: this.shortcuts });
        } catch (error) {
            console.error('Failed to save shortcuts:', error);
        }
    }

    async loadUserInfo() {
        try {
            // Set fixed username
            this.updateUserDisplay('Hello World');
        } catch (error) {
            console.error('Failed to load user info:', error);
            this.updateUserDisplay('Hello World');
        }
    }

    updateUserDisplay(username) {
        const userElement = document.querySelector('.start-menu-user span');
        if (userElement) {
            userElement.textContent = username;
        }
    }

    async loadBackground() {
        try {
            // 優先從 chrome.storage.sync 讀取
            const syncStored = await chrome.storage.sync.get('backgroundImage');
            if (syncStored.backgroundImage) {
                return syncStored.backgroundImage;
            }
            
            // 如果 sync 中沒有，嘗試從 chrome.storage.local 讀取
            const localStored = await chrome.storage.local.get('backgroundImage');
            return localStored.backgroundImage || null;
        } catch (error) {
            console.error('Failed to load background:', error);
            return null;
        }
    }

    setBackgroundImage(imageData) {
        const desktop = document.querySelector('.desktop');
        if (imageData) {
            desktop.style.backgroundImage = `url(${imageData})`;
            desktop.style.backgroundSize = 'cover';
            desktop.style.backgroundPosition = 'center';
            desktop.style.backgroundRepeat = 'no-repeat';
        } else {
            desktop.style.backgroundImage = '';
        }
    }

    openBackgroundDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'shortcut-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Custom Background</h3>
                <div class="form-group">
                    <label for="backgroundFile" class="file-upload-label">
                        <span class="file-upload-text">Choose File</span>
                        <input type="file" id="backgroundFile" accept="image/*" style="display: none;">
                    </label>
                </div>
                <div class="dialog-buttons">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-clear" id="clearBackground">Clear Background</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const closeDialog = () => {
            dialog.remove();
        };
        
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                closeDialog();
            }
        });
        
        dialog.querySelector('.btn-cancel').addEventListener('click', closeDialog);
        
        dialog.querySelector('.btn-clear').addEventListener('click', async () => {
            try {
                // 清除兩個儲存位置的背景
                await chrome.storage.sync.remove('backgroundImage');
                await chrome.storage.local.remove('backgroundImage');
                
                // 清除背景顯示
                this.setBackgroundImage(null);
                
                this.showNotification('Background cleared successfully', 'success');
                closeDialog();
            } catch (error) {
                console.error('Failed to clear background:', error);
                this.showNotification('Failed to clear background', 'error');
            }
        });
        
        // 監聽檔案選擇變化 - 選擇後自動應用背景
        const fileInput = dialog.querySelector('#backgroundFile');
        const uploadLabel = dialog.querySelector('.file-upload-label');
        const uploadText = dialog.querySelector('.file-upload-text');
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                uploadLabel.classList.add('file-selected');
                uploadText.textContent = '✅ File Selected';
                
                // 自動讀取並應用背景
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const imageData = event.target.result;
                        await this.saveBackground(imageData);
                        this.setBackgroundImage(imageData);
                        this.showNotification('Background applied successfully', 'success');
                        
                        // 立即關閉對話框
                        closeDialog();
                    } catch (error) {
                        console.error('Failed to apply background:', error);
                        this.showNotification('Failed to apply background', 'error');
                    }
                };
                reader.readAsDataURL(file);
            } else {
                uploadLabel.classList.remove('file-selected');
                uploadText.textContent = 'Choose File';
            }
        });
    }

    
    async saveBackground(imageData) {
        try {
            // 檢查圖片大小，chrome.storage.sync 有 8KB 項目限制和 100KB 總限制
            const dataSize = new TextEncoder().encode(imageData).length;
            const SYNC_ITEM_QUOTA = 8192; // 8KB
            
            if (dataSize > SYNC_ITEM_QUOTA) {
                console.warn('Background image too large for sync storage, using local storage instead.');
                await chrome.storage.local.set({ backgroundImage: imageData });
            } else {
                await chrome.storage.sync.set({ backgroundImage: imageData });
            }
        } catch (error) {
            console.error('Failed to save background:', error);
            throw error;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const manager = new NewTabManager();
    
    // 等待 DOM 完全載入後綁定事件
    setTimeout(() => {
        manager.bindEvents();
    }, 0);
});
