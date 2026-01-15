// 默认规则
const defaultRules = [
  { id: 1, domain: 'youtube.com', keyword: '/watch', active: true },
  { id: 2, domain: 'youtube.com', keyword: '/shorts/', active: true },
  { id: 3, domain: 'bilibili.com', keyword: '/video/', active: true },
  { id: 4, domain: 'bilibili.com', keyword: '/bangumi/play/', active: true },
  { id: 5, domain: 'douyin.com', keyword: '/', active: true },
];

// 全局变量
let currentRules = [];
let currentWhitelist = [];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({
    enableLinks: true,
    enableBookmarks: true,
    enableVideo: true,
    whitelist: [],
    customRules: null
  }, (items) => {
    // 恢复开关状态
    if(document.getElementById('enableLinks')) document.getElementById('enableLinks').checked = items.enableLinks;
    if(document.getElementById('enableBookmarks')) document.getElementById('enableBookmarks').checked = items.enableBookmarks;
    if(document.getElementById('enableVideo')) document.getElementById('enableVideo').checked = items.enableVideo;

    // 1. 处理增强规则
    if (!items.customRules) {
      currentRules = [...defaultRules];
    } else {
      currentRules = items.customRules;
    }
    renderRulesList();

    // 2. 处理白名单
    if (typeof items.whitelist === 'string') {
      currentWhitelist = items.whitelist.split('\n').map(s => s.trim()).filter(s => s);
    } else if (Array.isArray(items.whitelist)) {
      currentWhitelist = items.whitelist;
    } else {
      currentWhitelist = [];
    }
    renderWhitelist();
  });
});

// =======================
// 渲染逻辑：增强规则
// =======================
function renderRulesList() {
  const container = document.getElementById('rulesList');
  container.innerHTML = '';

  if (currentRules.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">暂无规则</div>';
    return;
  }

  currentRules.forEach((rule, index) => {
    const item = document.createElement('div');
    item.className = 'rule-item';
    
    // 注意：这里删除了 onclick 属性
    item.innerHTML = `
      <div class="rule-info">
        <span class="rule-domain">${rule.domain}</span>
        <span class="rule-keyword">${rule.keyword}</span>
      </div>
      <div class="action-group">
        <label class="switch" style="transform: scale(0.8);">
          <input type="checkbox" class="rule-toggle" ${rule.active ? 'checked' : ''}>
          <span class="slider round"></span>
        </label>
        <button class="edit-btn">✏️ 修改</button>
        <button class="delete-btn">🗑️ 删除</button>
      </div>
    `;

    // --- 核心修复：使用 JS 动态绑定事件 ---
    
    // 1. 绑定开关
    item.querySelector('.rule-toggle').addEventListener('change', (e) => {
      currentRules[index].active = e.target.checked;
    });

    // 2. 绑定修改按钮
    item.querySelector('.edit-btn').addEventListener('click', () => {
      editRule(index);
    });

    // 3. 绑定删除按钮
    item.querySelector('.delete-btn').addEventListener('click', () => {
      deleteRule(index);
    });

    container.appendChild(item);
  });
}

// =======================
// 渲染逻辑：白名单
// =======================
function renderWhitelist() {
  const container = document.getElementById('whitelistList');
  container.innerHTML = '';

  if (currentWhitelist.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">暂无白名单域名</div>';
    return;
  }

  currentWhitelist.forEach((domain, index) => {
    const item = document.createElement('div');
    item.className = 'rule-item';
    // 注意：这里删除了 onclick 属性
    item.innerHTML = `
      <div class="rule-info">
        <span class="rule-domain">${domain}</span>
      </div>
      <div class="action-group">
        <button class="edit-btn">✏️ 修改</button>
        <button class="delete-btn">🗑️ 删除</button>
      </div>
    `;

    // --- 核心修复：使用 JS 动态绑定事件 ---

    // 1. 绑定修改按钮
    item.querySelector('.edit-btn').addEventListener('click', () => {
      editWhitelist(index);
    });

    // 2. 绑定删除按钮
    item.querySelector('.delete-btn').addEventListener('click', () => {
      deleteWhitelist(index);
    });

    container.appendChild(item);
  });
}

// =======================
// 动作逻辑函数
// =======================

// --- 增强规则操作 ---
document.getElementById('addRuleBtn').addEventListener('click', () => {
  const d = document.getElementById('newDomain').value.trim();
  const k = document.getElementById('newKeyword').value.trim();
  if (!d || !k) return alert('请填写完整');
  currentRules.push({ id: Date.now(), domain: d, keyword: k, active: true });
  document.getElementById('newDomain').value = '';
  document.getElementById('newKeyword').value = '';
  renderRulesList();
});

function deleteRule(index) {
  if(confirm('确定删除此规则？')) {
    currentRules.splice(index, 1);
    renderRulesList();
  }
}

function editRule(index) {
  const rule = currentRules[index];
  const newDomain = prompt("修改域名:", rule.domain);
  if (newDomain === null) return;
  const newKeyword = prompt("修改关键词:", rule.keyword);
  if (newKeyword === null) return;
  
  if (newDomain && newKeyword) {
    currentRules[index].domain = newDomain.trim();
    currentRules[index].keyword = newKeyword.trim();
    renderRulesList();
  }
}

// --- 白名单操作 ---
document.getElementById('addWhiteBtn').addEventListener('click', () => {
  const d = document.getElementById('newWhiteDomain').value.trim();
  if (!d) return alert('请输入域名');
  // 简单去重
  if (!currentWhitelist.includes(d)) {
    currentWhitelist.push(d);
  }
  document.getElementById('newWhiteDomain').value = '';
  renderWhitelist();
});

function deleteWhitelist(index) {
  if(confirm('确定移除此白名单域名？')) {
    currentWhitelist.splice(index, 1);
    renderWhitelist();
  }
}

function editWhitelist(index) {
  const oldVal = currentWhitelist[index];
  const newVal = prompt("修改白名单域名:", oldVal);
  if (newVal !== null && newVal.trim() !== "") {
    currentWhitelist[index] = newVal.trim();
    renderWhitelist();
  }
}

// =======================
// 保存所有设置
// =======================
document.getElementById('saveBtn').addEventListener('click', () => {
  chrome.storage.sync.set({
    enableLinks: document.getElementById('enableLinks').checked,
    enableBookmarks: document.getElementById('enableBookmarks').checked,
    enableVideo: document.getElementById('enableVideo').checked,
    whitelist: currentWhitelist,
    customRules: currentRules
  }, () => {
    const status = document.getElementById('status');
    status.textContent = '✅ 保存成功';
    status.style.opacity = '1';
    setTimeout(() => { status.style.opacity = '0'; }, 2000);
  });
});