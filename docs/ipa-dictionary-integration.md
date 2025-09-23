# IPA辞書統合ガイド

## 概要
Chrome拡張機能でIPA辞書（MeCab用辞書）を活用する方法と制限事項。

## 技術的制約

### 1. ファイルサイズ制限
- **IPA辞書フルサイズ**: 約50-100MB
- **Chrome拡張機能推奨**: 10MB以下
- **Chrome Web Store上限**: 200MB（ただし審査が厳しくなる）

### 2. 形態素解析エンジン
- **MeCab**: C++製、ブラウザで直接動作不可
- **kuromoji.js**: JavaScript製、IPA辞書互換
- **TinySegmenter**: 超軽量だが精度低い

## 実装方法

### 方法1: kuromoji.js統合（推奨）

#### インストール
```bash
npm install kuromoji
```

#### 辞書の準備
```javascript
// 最小構成の辞書ファイル（約3MB）
const dictFiles = [
  'base.dat',      // 基本辞書
  'check.dat',     // チェック用
  'tid.dat',       // 品詞ID
  'tid_pos.dat',   // 品詞マッピング
  'tid_map.dat',   // 品詞変換
  'cc.dat'         // 文字種情報
];
```

#### 実装例
```javascript
// content.js の更新版
let tokenizer = null;

// kuromoji初期化
async function initKuromoji() {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ 
      dicPath: chrome.runtime.getURL('dict/')
    }).build((err, _tokenizer) => {
      if (err) {
        reject(err);
      } else {
        tokenizer = _tokenizer;
        resolve();
      }
    });
  });
}

// テキスト処理
function processTextWithKuromoji(text) {
  if (!tokenizer) return [];
  
  const tokens = tokenizer.tokenize(text);
  return tokens.map(token => ({
    surface: token.surface_form,     // 表層形
    baseForm: token.basic_form,      // 基本形
    reading: token.reading,          // 読み
    pos: token.pos,                  // 品詞
    english: dictionary[token.basic_form] || null
  }));
}
```

### 方法2: 軽量カスタム辞書

#### 辞書フォーマット
```javascript
// custom-dict.json
{
  "今日": {
    "reading": "キョウ",
    "pos": "名詞-副詞可能",
    "baseForm": "今日",
    "english": "today",
    "frequency": 95  // 使用頻度
  },
  "天気": {
    "reading": "テンキ",
    "pos": "名詞-一般",
    "baseForm": "天気",
    "english": "weather",
    "frequency": 87
  }
}
```

#### 頻出語抽出スクリプト
```python
# extract_frequent_words.py
import MeCab
import json
from collections import Counter

# コーパスから頻出語を抽出
def extract_frequent_words(corpus_file, top_n=5000):
    mecab = MeCab.Tagger()
    word_freq = Counter()
    
    with open(corpus_file, 'r') as f:
        for line in f:
            node = mecab.parseToNode(line)
            while node:
                if node.surface:
                    features = node.feature.split(',')
                    base_form = features[6] if features[6] != '*' else node.surface
                    word_freq[base_form] += 1
                node = node.next
    
    return word_freq.most_common(top_n)
```

### 方法3: ハイブリッドアプローチ

```javascript
// 1. 基本語彙は内蔵辞書
const basicDict = require('./basic-5000.json');

// 2. 追加辞書はオンデマンド
async function loadExtendedDict(category) {
  const response = await fetch(
    chrome.runtime.getURL(`dict/extended/${category}.json`)
  );
  return await response.json();
}

// 3. Web APIフォールバック（オプション）
async function lookupUnknownWord(word) {
  // ローカルサーバーまたはCDN経由
  const cached = await chrome.storage.local.get(word);
  if (cached[word]) return cached[word];
  
  // 実際のAPI呼び出しは避ける（オフライン動作のため）
}
```

## パフォーマンス最適化

### 1. 遅延読み込み
```javascript
// 可視範囲のみ処理
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      processTextNode(entry.target);
    }
  });
});
```

### 2. 辞書キャッシュ
```javascript
// IndexedDBを使用
const dbName = 'RubyLingoDB';
const dbVersion = 1;

async function cacheDict() {
  const db = await openDB(dbName, dbVersion, {
    upgrade(db) {
      db.createObjectStore('dictionary', { keyPath: 'word' });
    }
  });
  
  // バッチ挿入で高速化
  const tx = db.transaction('dictionary', 'readwrite');
  await Promise.all(
    Object.entries(dictionary).map(([word, data]) =>
      tx.store.add({ word, ...data })
    )
  );
}
```

### 3. メモリ管理
```javascript
// 使用頻度の低い単語を定期的に解放
const wordUsageCache = new Map();
const MAX_CACHE_SIZE = 10000;

function manageCacheMemory() {
  if (wordUsageCache.size > MAX_CACHE_SIZE) {
    // LRU方式で削除
    const sortedEntries = [...wordUsageCache.entries()]
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    
    sortedEntries.slice(0, 1000).forEach(([word]) => {
      wordUsageCache.delete(word);
    });
  }
}
```

## 実装手順

### Phase 1: 基本実装（1週間）
1. kuromoji.js統合
2. 最小辞書（1000語）作成
3. 基本的な形態素解析実装

### Phase 2: 辞書拡張（1週間）
1. 頻出5000語辞書作成
2. 英訳マッピング追加
3. パフォーマンステスト

### Phase 3: 最適化（1週間）
1. 遅延読み込み実装
2. キャッシュ機構追加
3. メモリ使用量最適化

## ファイルサイズ比較

| 方式 | 辞書サイズ | 精度 | 起動時間 |
|-----|-----------|-----|---------|
| フルIPA辞書 | 50-100MB | 最高 | 遅い |
| kuromoji軽量版 | 3-5MB | 高 | 普通 |
| カスタム5000語 | 500KB | 中 | 高速 |
| TinySegmenter | 25KB | 低 | 即座 |

## 推奨構成

**開発初期（MVP）**:
- カスタム5000語辞書
- 簡易形態素解析
- 総容量: 1MB以下

**製品版**:
- kuromoji.js軽量版
- 基本10000語 + 英訳
- 総容量: 5MB以下

**将来的な拡張**:
- IndexedDBで追加辞書
- カテゴリ別辞書（IT用語、医療用語等）
- ユーザー辞書機能

## まとめ

IPA辞書をフルサイズで使用するのは現実的ではありませんが、kuromoji.jsと軽量化した辞書を組み合わせることで、実用的な精度を保ちながらChrome拡張機能として動作させることが可能です。段階的なアプローチで、まずは基本語彙から始めて、徐々に辞書を拡充していくのが現実的な選択肢です。