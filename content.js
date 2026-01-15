let config = {
  enableLinks: true,
  whitelist: [],
  enableVideo: true,
  customRules: [] 
};

// 初始化
chrome.storage.sync.get(null, (items) => updateLocalConfig(items));

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    chrome.storage.sync.get(null, (items) => updateLocalConfig(items));
  }
});

function updateLocalConfig(items) {
  config.enableLinks = items.enableLinks !== false;
  config.enableVideo = items.enableVideo !== false;
  
  // 白名单适配：
  // 以前是字符串 split，现在可能是数组。为了保险，做个双重判断。
  if (Array.isArray(items.whitelist)) {
    config.whitelist = items.whitelist;
  } else if (typeof items.whitelist === 'string') {
    config.whitelist = items.whitelist.split('\n').map(s => s.trim()).filter(s => s);
  } else {
    config.whitelist = [];
  }

  // 规则适配
  if (Array.isArray(items.customRules)) {
    config.customRules = items.customRules;
  } else {
    config.customRules = []; 
  }
}

function isWhitelisted() {
  const currentDomain = window.location.hostname;
  // 数组遍历匹配
  return config.whitelist.some(d => currentDomain.includes(d));
}

document.addEventListener('click', function(e) {
  if (!config.enableLinks) return;
  if (isWhitelisted()) return;

  let target = e.target.closest('a');
  if (!target || !target.href) return;
  if (target.href.startsWith('javascript:') || target.href.startsWith('#')) return;
  if (e.shiftKey) return;

  // 增强规则逻辑
  if (config.enableVideo) {
    const currentHost = window.location.hostname;
    const targetHref = target.href;

    for (const rule of config.customRules) {
      if (!rule.active) continue;
      if (currentHost.includes(rule.domain)) {
        if (targetHref.includes(rule.keyword)) {
          target.target = '_blank';
          e.stopPropagation();
          return;
        }
      }
    }
  }

  target.target = '_blank';
}, true);