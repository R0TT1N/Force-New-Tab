// 默认设置
const defaultSettings = {
  enableLinks: true,
  enableBookmarks: true,
  activeInForeground: true,
  enableVideo: true // 对应 "增强规则" 总开关
};

// 1. 初始化：读取设置并回显状态
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(defaultSettings, (items) => {
    document.getElementById('p_enableLinks').checked = items.enableLinks;
    document.getElementById('p_enableBookmarks').checked = items.enableBookmarks;
    document.getElementById('p_activeInForeground').checked = items.activeInForeground;
    // 这里对应 enableVideo
    document.getElementById('p_enableVideo').checked = items.enableVideo;
  });
});

// 2. 封装保存函数
function saveSetting(key, value) {
  let setting = {};
  setting[key] = value;
  chrome.storage.sync.set(setting);
}

// 3. 绑定监听事件
document.getElementById('p_enableLinks').addEventListener('change', (e) => saveSetting('enableLinks', e.target.checked));
document.getElementById('p_enableBookmarks').addEventListener('change', (e) => saveSetting('enableBookmarks', e.target.checked));
document.getElementById('p_activeInForeground').addEventListener('change', (e) => saveSetting('activeInForeground', e.target.checked));

// 关键：这里控制 enableVideo，与 Options 页面完全一致
document.getElementById('p_enableVideo').addEventListener('change', (e) => {
  saveSetting('enableVideo', e.target.checked);
});

// 4. 修复“打开两个页面”的 Bug
document.getElementById('openFullSettings').addEventListener('click', () => {
  // 直接调用标准 API，不使用 window.open 回退，防止重复触发
  chrome.runtime.openOptionsPage();
});