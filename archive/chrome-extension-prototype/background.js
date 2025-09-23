// RubyLingo Background Script
// 拡張機能の状態管理

// 初期化時に状態を設定
chrome.runtime.onInstalled.addListener(() => {
  // デフォルトでON
  chrome.storage.sync.set({ enabled: true });
  
  // アイコンを更新
  updateIcon(true);
});

// アイコンクリック時の処理
chrome.action.onClicked.addListener(async (tab) => {
  // 現在の状態を取得
  const result = await chrome.storage.sync.get(['enabled']);
  const currentState = result.enabled !== false;
  
  // 状態を反転
  const newState = !currentState;
  
  // 状態を保存
  await chrome.storage.sync.set({ enabled: newState });
  
  // アイコンを更新
  updateIcon(newState);
  
  // アクティブなタブにメッセージを送信（オプション）
  // これによりcontent.jsが即座に反応できる
  chrome.tabs.sendMessage(tab.id, { 
    action: 'toggle',
    enabled: newState 
  });
});

// 起動時に状態を確認してアイコンを更新
chrome.runtime.onStartup.addListener(async () => {
  const result = await chrome.storage.sync.get(['enabled']);
  const isEnabled = result.enabled !== false;
  updateIcon(isEnabled);
});

// アイコンを更新する関数
function updateIcon(enabled) {
  const iconPath = enabled ? {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  } : {
    "16": "icons/icon16_off.png",
    "48": "icons/icon48_off.png",
    "128": "icons/icon128_off.png"
  };
  
  chrome.action.setIcon({ path: iconPath });
  
  // ツールチップも更新
  const title = enabled ? "RubyLingo (ON) - クリックでOFF" : "RubyLingo (OFF) - クリックでON";
  chrome.action.setTitle({ title: title });
}

// タブが更新されたときの処理（オプション）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    // ページ読み込み完了時に状態を確認
    chrome.storage.sync.get(['enabled'], (result) => {
      const isEnabled = result.enabled !== false;
      updateIcon(isEnabled);
    });
  }
});