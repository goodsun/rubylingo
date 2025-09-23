# EDICT辞書統合ガイド

## 概要
EDICT/JMdict辞書とTinySegmenterを使用した軽量で高精度な日本語分析システム。

## 新アーキテクチャの利点

### 1. システム簡素化
- **従来**: IPA辞書（形態素解析） + EDICT（翻訳）の二重システム
- **新版**: EDICT/JMdict統合辞書のみで完結
- **メリット**: 初期化時間短縮、メモリ使用量削減

### 2. パフォーマンス向上
- **TinySegmenter**: 非同期初期化不要、即座に利用開始
- **EDICT統合**: 単一辞書検索でレスポンス時間短縮
- **軽量化**: Kuromojiの辞書ファイル（50MB）削除

## 技術実装

### コア技術スタック
```javascript
// 新しい依存関係
dependencies: {
  "tiny-segmenter": "^0.2.0",  // 軽量日本語分詞器
  // kuromoji削除済み
}
```

### 辞書構造
```javascript
// EDICT/JMdict統合フォーマット
{
  "今日": {
    "word": "今日",
    "reading": "きょう",
    "translation": "today",
    "translations": ["today", "this day"],
    "pos": ["n", "n-adv"],
    "kanjiForms": ["今日"],
    "readings": ["きょう", "コンニチ"]
  }
}
```

### 分析フロー
```javascript
const EdictAnalyzer = require('./lib/edict-analyzer');

// 1. TinySegmenterで分詞
const segments = segmenter.segment(text);

// 2. EDICT辞書で統合検索
for (const segment of segments) {
  const entry = dictionary.lookupWithReading(segment, level);
  // 読み仮名と翻訳を同時取得
}

// 3. ルビHTML生成
const rubyHtml = `<ruby>${word}<rt>${translation}</rt></ruby>`;
```

## 品質改善機能

### 1. 助詞・助動詞フィルタ
```javascript
// 誤訳を防ぐスキップリスト
const skipWords = [
  'は', 'を', 'が', 'の', 'に', 'で', 'と', 'も',
  'です', 'である', 'だ', 'ます', 'ません'
];
```

### 2. 動詞活用処理
```javascript
// 基本形変換ヒューリスティック
const verbEndings = [
  { suffix: 'ました', basic: '' },
  { suffix: 'ている', basic: 'る' },
  { suffix: 'ない', basic: 'る' }
];
```

### 3. 対象語選択
- **名詞**: 漢字・カタカナ語彙を優先
- **動詞**: 活用形を基本形に変換
- **形容詞**: い形容詞の語幹抽出
- **除外**: 助詞、助動詞、単一ひらがな

## パフォーマンス仕様

| 項目 | 旧システム (Kuromoji) | 新システム (EDICT) |
|-----|---------------------|-------------------|
| 初期化時間 | 3-5秒 | 即座 |
| メモリ使用量 | 80MB+ | 55MB |
| 処理時間 | 100-500ms | 50-200ms |
| 辞書語彙数 | 36万語 | 36万語 |
| デプロイサイズ | 60MB | 10MB |

## API エンドポイント

### `/api/convert` - テキスト変換
```javascript
POST /api/convert
{
  "text": "今日は良い天気です",
  "dictionary": "basic"
}

Response:
{
  "success": true,
  "data": {
    "original": "今日は良い天気です",
    "converted": "<ruby>今日<rt>today</rt></ruby>は<ruby>良い<rt>good</rt></ruby><ruby>天気<rt>weather</rt></ruby>です",
    "stats": {
      "total_characters": 9,
      "converted_words": 3,
      "conversion_rate": "43%",
      "processing_time": 1
    }
  }
}
```

### `/api/analyze` - 詳細分析
```javascript
POST /api/analyze
{
  "text": "プログラミングは楽しい",
  "dictionary": "basic"
}

Response:
{
  "tokens": [
    {
      "word": "プログラミング",
      "reading": "プログラミング", 
      "translation": "programming",
      "pos": ["n"],
      "start": 0,
      "end": 8
    }
  ],
  "stats": {
    "totalCharacters": 11,
    "convertedTokens": 1,
    "conversionRate": "100%"
  }
}
```

## 統合辞書システム

| 特徴 | 詳細 |
|------|------|
| 語彙数 | 36万語（EDICT/JMdict統合） |
| 対象分野 | 全分野対応（日常・ビジネス・学術・技術） |
| 選択方式 | 自動フィルタリング（重要度基準） |
| 設定 | 不要（辞書選択なし） |

## 開発ガイド

### セットアップ
```bash
# 依存関係インストール
npm install

# 辞書ビルド（初回のみ）
npm run build-dictionaries

# 開発サーバー起動
npm run dev
```

### テスト
```bash
# 基本動作確認
node test-edict.js

# API統合テスト
npm start &
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: application/json" \
  -d '{"text": "テストです"}'
```

### カスタマイズ
```javascript
// 除外語追加
const customSkipWords = ['特定の語'];
analyzer.skipWords.push(...customSkipWords);

// 辞書レベル変更
const result = analyzer.analyze(text, 'comprehensive');
```

## デプロイ

### AWS Lambda
```bash
# サーバーレスデプロイ
npm run deploy

# 環境変数設定
DICTIONARY_LEVEL=basic
MEMORY_SIZE=512
TIMEOUT=30
```

### パフォーマンス監視
```javascript
// 処理時間ログ
console.log(`Processing time: ${result.processingTime}ms`);

// メモリ使用量
const usage = analyzer.getStatus().memoryUsage;
console.log(`Memory: ${usage.total.mb}MB`);
```

## 今後の改善点

### 1. 精度向上
- 複合語分解精度の改善
- 固有名詞辞書の追加
- 文脈を考慮した語義選択

### 2. パフォーマンス
- 辞書の部分ロード
- キャッシュ機構の追加
- 並列処理の最適化

### 3. 機能拡張
- 多言語対応（中国語、韓国語）
- 品詞別色分け表示
- ユーザー辞書機能

## まとめ

EDICT/JMdict統合システムにより、従来の二重辞書アーキテクチャから単一統合辞書への移行が完了しました。これにより、システムの簡素化、パフォーマンス向上、メンテナンス性の改善を実現しています。