// RubyLingo Content Script
// 日本語テキストに英訳ルビを追加

// 日本語判定用正規表現
const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;

// 処理済み要素を記録
const processedElements = new WeakSet();

// 拡張機能の状態
let isEnabled = true;

// 初期化
async function init() {
  // 状態を取得
  const result = await chrome.storage.sync.get(['enabled']);
  isEnabled = result.enabled !== false; // デフォルトはtrue

  if (isEnabled) {
    processPage();
  }

  // 状態変更を監視
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
      isEnabled = changes.enabled.newValue;
      if (isEnabled) {
        processPage();
      } else {
        removeAllRuby();
      }
    }
  });
}

// ページ全体を処理
function processPage() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // 除外する要素
        const excludeTags = ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'INPUT', 'TEXTAREA'];
        if (excludeTags.includes(node.parentNode.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // すでに処理済みの要素
        if (node.parentNode.tagName === 'RUBY' || node.parentNode.tagName === 'RT') {
          return NodeFilter.FILTER_REJECT;
        }
        
        // 日本語を含むテキストのみ
        if (japaneseRegex.test(node.textContent)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        
        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }

  // 各テキストノードを処理
  textNodes.forEach(processTextNode);
}

// テキストノードを処理
function processTextNode(textNode) {
  const text = textNode.textContent;
  const parent = textNode.parentNode;
  
  // すでに処理済みならスキップ
  if (processedElements.has(parent)) {
    return;
  }
  
  // トークン分割（簡易版）
  const tokens = tokenizeText(text);
  
  // 新しい要素を作成
  const fragment = document.createDocumentFragment();
  
  tokens.forEach(token => {
    if (japaneseRegex.test(token) && dictionary[token]) {
      // ルビ付き要素を作成
      const ruby = document.createElement('ruby');
      ruby.textContent = token;
      ruby.classList.add('rubylingo-ruby');
      
      const rt = document.createElement('rt');
      rt.textContent = dictionary[token];
      rt.classList.add('rubylingo-rt');
      
      ruby.appendChild(rt);
      fragment.appendChild(ruby);
    } else {
      // 通常のテキスト
      fragment.appendChild(document.createTextNode(token));
    }
  });
  
  // 元のテキストノードを置換
  parent.replaceChild(fragment, textNode);
  processedElements.add(parent);
}

// テキストをトークンに分割（簡易版）
function tokenizeText(text) {
  // 単語境界で分割（より高度な形態素解析は後で実装）
  const tokens = [];
  let current = '';
  
  for (let char of text) {
    if (japaneseRegex.test(char)) {
      // 日本語文字
      if (current && !japaneseRegex.test(current[0])) {
        tokens.push(current);
        current = '';
      }
      current += char;
      
      // 簡易的な単語区切り（助詞や句読点で区切る）
      if (['は', 'を', 'に', 'で', 'が', 'の', 'と', 'や', 'から', 'まで', 'より', '。', '、'].includes(char)) {
        tokens.push(current);
        current = '';
      }
    } else {
      // 非日本語文字
      if (current && japaneseRegex.test(current[0])) {
        tokens.push(current);
        current = '';
      }
      current += char;
    }
  }
  
  if (current) {
    tokens.push(current);
  }
  
  return tokens;
}

// すべてのルビを削除
function removeAllRuby() {
  const rubyElements = document.querySelectorAll('.rubylingo-ruby');
  rubyElements.forEach(ruby => {
    const text = ruby.childNodes[0].textContent; // ルビのベーステキスト
    ruby.replaceWith(document.createTextNode(text));
  });
  processedElements = new WeakSet();
}

// スタイルを追加
function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .rubylingo-ruby {
      ruby-align: center;
    }
    .rubylingo-rt {
      font-size: 0.5em;
      color: #666;
    }
  `;
  document.head.appendChild(style);
}

// 初期化実行
addStyles();
init();

// 動的コンテンツ対応（オプション）
const observer = new MutationObserver((mutations) => {
  if (!isEnabled) return;
  
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const walker = document.createTreeWalker(
          node,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: function(node) {
              const excludeTags = ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'INPUT', 'TEXTAREA'];
              if (excludeTags.includes(node.parentNode.tagName)) {
                return NodeFilter.FILTER_REJECT;
              }
              if (node.parentNode.tagName === 'RUBY' || node.parentNode.tagName === 'RT') {
                return NodeFilter.FILTER_REJECT;
              }
              if (japaneseRegex.test(node.textContent)) {
                return NodeFilter.FILTER_ACCEPT;
              }
              return NodeFilter.FILTER_REJECT;
            }
          }
        );
        
        let textNode;
        while (textNode = walker.nextNode()) {
          processTextNode(textNode);
        }
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});