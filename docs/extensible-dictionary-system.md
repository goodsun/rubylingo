# 拡張可能辞書システム設計書

## 概要
RubyLingoの学習特化型辞書システム。ユーザーの学習レベルと目的に応じて辞書を選択・追加できる仕組み。

## 基本コンセプト

### 学習効率最優先
- **既知語を除外**: 基本単語（私、今日、です）は含まない
- **目的別特化**: 学習目標に応じた語彙のみ
- **段階的学習**: レベル別に語彙を整理

### 一石二鳥のメリット
1. **軽量化**: 必要な語彙のみで辞書サイズ削減
2. **学習効率**: ノイズ（既知語）がない集中学習

## Phase別実装計画

### Phase 1: 基本3辞書（MVP）
**実装期間**: 追加1-2日  
**技術的難易度**: 低

#### 辞書構成
```
dictionaries/
├── toeic500.json    # 基礎ビジネス英語 (500KB, 約1000語)
├── toeic700.json    # 中級ビジネス英語 (1MB, 約2000語)
└── toeic900.json    # 上級・専門英語 (1.5MB, 約3000語)
```

#### UI仕様
```
┌────────────────┐
│ RubyLingo      │
│                │
│   ● ON         │
│                │
│ 辞書:          │
│ [▼ TOEIC 500] │ ← プルダウンで選択
│                │
└────────────────┘
```

#### 各辞書の特徴

**TOEIC 500 (基礎)**
- ビジネス基礎語彙
- 例: 会議(meeting), 提案(proposal), 締切(deadline)
- 対象: ビジネス英語初心者

**TOEIC 700 (中級)**
- 中級ビジネス語彙
- 例: 戦略(strategy), 分析(analysis), 効率(efficiency)
- 対象: 日常業務で英語使用

**TOEIC 900 (上級)**
- 専門用語・学術語彙
- 例: 統合(integration), 相関(correlation), 仮説(hypothesis)
- 対象: 高度な英語コミュニケーション

#### 技術仕様
```javascript
// 辞書メタデータ
const dictionaries = {
  "toeic500": {
    name: "TOEIC 500",
    file: "dictionaries/toeic500.json",
    category: "基礎",
    wordCount: 1000
  },
  "toeic700": {
    name: "TOEIC 700", 
    file: "dictionaries/toeic700.json",
    category: "中級",
    wordCount: 2000
  },
  "toeic900": {
    name: "TOEIC 900",
    file: "dictionaries/toeic900.json", 
    category: "上級",
    wordCount: 3000
  }
};
```

### Phase 2: 分野別辞書追加
**実装期間**: 2週間  
**技術的難易度**: 中

#### 追加辞書例
```
dictionaries/
├── it-terms.json        # IT・技術用語
├── medical.json         # 医療用語
├── legal.json           # 法律用語
├── finance.json         # 金融用語
├── daily-conversation.json  # 日常会話
└── travel.json          # 旅行英語
```

#### 辞書配信システム
```javascript
// 辞書一覧管理（GitHub Pages等でホスト）
const dictionaryRegistry = {
  "registry_version": "1.0",
  "base_url": "https://rubylingo-dict.github.io/",
  "dictionaries": [
    {
      "id": "it-terms",
      "name": "IT用語",
      "category": "専門",
      "version": "1.0.0",
      "size": "200KB",
      "wordCount": 500,
      "downloadUrl": "it-terms.json",
      "builtin": false,
      "description": "プログラミング・システム開発用語"
    }
  ]
};
```

#### ダウンロード機能
```javascript
// 辞書ダウンロード
async function downloadDictionary(dictId) {
  const registry = await fetchDictionaryRegistry();
  const dict = registry.dictionaries.find(d => d.id === dictId);
  
  const response = await fetch(dict.downloadUrl);
  const data = await response.json();
  
  // IndexedDBに保存
  await saveDictionaryToStorage(dictId, data);
}
```

#### UI拡張
```
┌─────────────────────┐
│ 辞書選択            │
│                     │
│ 使用中の辞書:       │
│ ☑ TOEIC 500        │
│ ☑ IT用語           │
│ □ 医療用語         │ ← ダウンロード済み
│                     │
│ [+ 辞書を追加]      │ ← ストアから追加
│                     │
└─────────────────────┘
```

### Phase 3: 高度機能
**実装期間**: 3週間  
**技術的難易度**: 高

#### 実装予定機能

**複数辞書同時使用**
```javascript
// 選択された複数辞書をマージ
function mergeActiveDictionaries(selectedDicts) {
  const merged = {};
  selectedDicts.forEach(dict => {
    Object.assign(merged, dict.words);
  });
  return merged;
}
```

**ユーザー辞書**
```javascript
// ユーザーが独自に追加した単語
const userDictionary = {
  "customWord": "custom translation",
  // ユーザーが手動で追加
};
```

**辞書管理**
- 辞書の有効/無効切り替え
- 辞書の削除
- 使用統計表示

## 技術的実装詳細

### ファイル構成
```
rubylingo/
├── manifest.json
├── dictionaries/           # 辞書フォルダ
│   ├── toeic500.json
│   ├── toeic700.json
│   └── toeic900.json
├── src/
│   ├── dictionary-manager.js  # 辞書管理
│   ├── content.js
│   └── popup.js
└── docs/
```

### 辞書フォーマット
```json
{
  "metadata": {
    "name": "TOEIC 500",
    "version": "1.0.0",
    "category": "基礎",
    "wordCount": 1000,
    "lastUpdated": "2024-01-01"
  },
  "words": {
    "会議": "meeting",
    "提案": "proposal",
    "契約": "contract",
    "交渉": "negotiation"
  }
}
```

### 辞書管理システム
```javascript
class DictionaryManager {
  constructor() {
    this.activeDictionaries = new Set(['toeic500']); // デフォルト
    this.loadedDictionaries = new Map();
  }
  
  async loadDictionary(dictId) {
    // 内蔵辞書またはダウンロード済み辞書を読み込み
  }
  
  async downloadDictionary(dictId) {
    // 外部から辞書をダウンロード
  }
  
  getMergedDictionary() {
    // アクティブな辞書をマージして返す
  }
}
```

### ストレージ設計
```javascript
// Chrome Storage Sync（設定用）
{
  "enabled": true,
  "activeDictionaries": ["toeic500", "it-terms"],
  "dictionarySettings": {
    "autoUpdate": true,
    "showWordCount": true
  }
}

// IndexedDB（辞書データ用）
{
  "dictionaries": {
    "toeic500": { /* 辞書データ */ },
    "it-terms": { /* 辞書データ */ }
  },
  "userDictionary": { /* ユーザー追加語彙 */ }
}
```

## 制約と解決策

### Chrome拡張機能の制限

**問題**: 外部ドメインアクセス制限
```json
// manifest.json で事前許可
{
  "host_permissions": [
    "https://rubylingo-dict.github.io/*"
  ]
}
```

**問題**: ファイルサイズ制限
**解決**: IndexedDBで大容量データ管理

**問題**: セキュリティ制限
**解決**: 信頼できるドメインのみ許可

### パフォーマンス考慮

**遅延読み込み**
```javascript
// 必要時のみ辞書を読み込み
async function loadDictionaryOnDemand(dictId) {
  if (!this.loadedDictionaries.has(dictId)) {
    await this.loadDictionary(dictId);
  }
  return this.loadedDictionaries.get(dictId);
}
```

**メモリ管理**
```javascript
// 使用頻度の低い辞書は解放
function optimizeMemoryUsage() {
  // LRU方式で辞書を管理
}
```

## リリース戦略

### v1.0 (MVP)
- 基本3辞書
- シンプルなプルダウン選択
- 基本的なルビ表示機能

### v1.1
- 辞書ダウンロード機能
- 5-10種類の専門辞書追加

### v1.2  
- 複数辞書同時使用
- ユーザー辞書機能

### v2.0
- 辞書共有機能
- 学習統計機能
- 高度なカスタマイズ

## 期待される効果

### ユーザーメリット
1. **学習効率向上**: 既知語のノイズ除去
2. **目的特化学習**: 必要な語彙に集中
3. **段階的レベルアップ**: 適切な難易度調整
4. **軽量動作**: 最小限のリソース使用

### 技術的メリット
1. **拡張性**: 無限に辞書追加可能
2. **保守性**: 辞書とロジックの分離
3. **パフォーマンス**: 必要最小限のデータ読み込み
4. **ユーザビリティ**: 直感的な辞書管理

## まとめ

この拡張可能辞書システムにより、RubyLingoは：
- 学習者のレベルと目的に完全適応
- 軽量でありながら高機能
- 将来的な機能拡張に対応
- シンプルな操作性を維持

段階的な実装により、リスクを最小化しながら高価値なプロダクトを実現できます。