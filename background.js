// ==========================================
// 1. 全局配置缓存
// ==========================================
let config = {
  enableBookmarks: true,
  activeInForeground: true,
  whitelist: []
};

// 初始化：从存储中读取配置
chrome.storage.sync.get({
  enableBookmarks: true,
  activeInForeground: true,
  whitelist: [] // 默认值改为空数组
}, (items) => {
  updateConfig(items);
});

// 监听配置修改
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    chrome.storage.sync.get(null, (items) => updateConfig(items));
  }
});

// 辅助函数：更新内存中的配置
function updateConfig(items) {
  config.enableBookmarks = items.enableBookmarks !== false;
  config.activeInForeground = items.activeInForeground !== false;
  
  // --- 修复报错的核心代码 ---
  // 判断数据类型：如果是数组直接用，如果是字符串则转换
  if (Array.isArray(items.whitelist)) {
    config.whitelist = items.whitelist;
  } else if (typeof items.whitelist === 'string') {
    // 兼容旧数据
    config.whitelist = items.whitelist.split('\n').map(s => s.trim()).filter(s => s);
  } else {
    config.whitelist = [];
  }
}


// ==========================================
// 2. 右键菜单逻辑 (已升级适配数组)
// ==========================================

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToWhitelist",
    title: "🚫 在此网站禁用 (加入白名单)", 
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "addToWhitelist") {
    let domain = "";
    try {
      const url = new URL(tab.url);
      domain = url.hostname;
    } catch (e) { return; }

    // 读取当前存储
    const items = await chrome.storage.sync.get({ whitelist: [] });
    let list = [];

    // 数据格式兼容处理
    if (Array.isArray(items.whitelist)) {
      list = items.whitelist;
    } else if (typeof items.whitelist === 'string') {
      list = items.whitelist.split('\n').map(s => s.trim()).filter(s => s);
    }

    // 避免重复添加
    if (!list.includes(domain)) {
      list.push(domain);
      
      // 保存为新格式 (数组)
      await chrome.storage.sync.set({ whitelist: list });
      console.log(`已将 ${domain} 添加到白名单`);
    }
  }
});


// ==========================================
// 3. 核心拦截逻辑
// ==========================================
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0 || details.transitionType !== 'auto_bookmark') return;
  
  if (!config.enableBookmarks) return;

  // 检查白名单 (数组匹配)
  const isWhitelisted = config.whitelist.some(item => details.url.includes(item));
  if (isWhitelisted) return;

  chrome.tabs.create({ 
    url: details.url, 
    active: config.activeInForeground 
  });

  chrome.tabs.goBack(details.tabId).catch(() => {});
});