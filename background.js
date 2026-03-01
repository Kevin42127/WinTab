chrome.runtime.onInstalled.addListener((details) => {
    console.log('WinTab installed');
    
    // 只在首次安裝時打開歡迎頁面
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: 'https://wintab.vercel.app/',
            active: true
        });
    }
});

// Initialize default settings
chrome.runtime.onStartup.addListener(() => {
    initializeSettings();
});

async function initializeSettings() {
    try {
        const stored = await chrome.storage.sync.get('settings');
        if (!stored.settings) {
            const defaultSettings = {
                bgType: 'gradient',
                bgColor: '#667eea',
                showWeather: true,
                showTodo: true,
                showStats: true,
                defaultEngine: 'google'
            };
            await chrome.storage.sync.set({ settings: defaultSettings });
        }
    } catch (error) {
        console.error('Failed to initialize settings:', error);
    }
}
