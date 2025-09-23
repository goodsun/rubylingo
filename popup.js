// RubyLingo Popup Script

// DOM要素
const toggle = document.getElementById('toggle');
const status = document.getElementById('status');
const dictionarySelect = document.getElementById('dictionarySelect');

// 初期化
async function init() {
  // 現在の状態を取得
  const result = await chrome.storage.sync.get(['enabled', 'selectedDictionary']);
  const isEnabled = result.enabled !== false;
  const selectedDict = result.selectedDictionary || 'toeic500';
  
  // UIを更新
  updateUI(isEnabled);
  dictionarySelect.value = selectedDict;
  
  // トグルのイベントリスナー
  toggle.addEventListener('change', async () => {
    const newState = toggle.checked;
    
    // 状態を保存
    await chrome.storage.sync.set({ enabled: newState });
    
    // UIを更新
    updateUI(newState);
    
    // バックグラウンドスクリプトに通知（アイコン更新のため）
    chrome.runtime.sendMessage({ 
      action: 'updateIcon',
      enabled: newState 
    });
    
    // アクティブなタブを取得
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.id) {
      // コンテンツスクリプトに状態変更を通知
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggle',
          enabled: newState
        });
      } catch (error) {
        // コンテンツスクリプトがまだ読み込まれていない場合
        // ページをリロードすることで反映させる
        if (newState) {
          chrome.tabs.reload(tab.id);
        }
      }
    }
  });
  
  // 辞書選択のイベントリスナー
  dictionarySelect.addEventListener('change', async () => {
    const selectedDict = dictionarySelect.value;
    
    // 選択を保存
    await chrome.storage.sync.set({ selectedDictionary: selectedDict });
    
    // アクティブなタブを取得
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.id) {
      // コンテンツスクリプトに辞書変更を通知
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'changeDictionary',
          dictionary: selectedDict
        });
      } catch (error) {
        // コンテンツスクリプトがまだ読み込まれていない場合は無視
        console.log('Content script not ready');
      }
    }
  });
}

// UIを更新
function updateUI(enabled) {
  toggle.checked = enabled;
  status.textContent = enabled ? 'ON' : 'OFF';
  document.body.classList.toggle('disabled', !enabled);
}

// 初期化実行
init();