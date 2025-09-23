# RubyLingo AWS Lambda 完結型仕様書

## 概要

「平文 →RubyLingo 用構造化テキスト変換」を AWS Lambda 1 つで完全実現する最小構成システム。

## 核心価値

**入力**: 日本語平文
**出力**: 英訳ルビ付き HTML
**効果**: 大量 RubyLingo による自然学習

### 変換例

```
入力: "重要な会議で新しい戦略を検討した。"
出力: "<ruby>重要<rt>important</rt></ruby>な<ruby>会議<rt>meeting</rt></ruby>で<ruby>新しい<rt>new</rt></ruby><ruby>戦略<rt>strategy</rt></ruby>を<ruby>検討<rt>consideration</rt></ruby>した。"
効果: 1文で5つの英単語に自動露出
```

## システム構成

### AWS Lambda 単体構成

```
┌─────────────────────────────────┐
│        AWS Lambda Function     │
├─────────────────────────────────┤
│  Express.js Server              │
│  ├── 静的ファイル配信           │
│  │   ├── index.html             │
│  │   ├── style.css              │
│  │   └── script.js              │
│  └── API エンドポイント         │
│      └── POST /api/convert      │
├─────────────────────────────────┤
│  kuromoji.js (形態素解析)       │
├─────────────────────────────────┤
│  辞書データ (JSON)              │
│  └── 50,000語 日英対訳辞書      │
└─────────────────────────────────┘
```

### Lambda Layers 構成

```
Layer 1: Dependencies (30MB)
├── node_modules/
│   ├── express/
│   ├── kuromoji/
│   └── serverless-http/

Layer 2: Dictionary Data (20MB)
├── dictionaries/
│   ├── basic.json      (5,000語)
│   ├── business.json   (10,000語)
│   ├── academic.json   (20,000語)
│   └── comprehensive.json (50,000語)

Function Code (5MB)
├── index.js           # Lambda handler
├── lib/
│   ├── analyzer.js    # kuromoji wrapper
│   └── converter.js   # ルビ変換ロジック
└── public/
    ├── index.html     # フロントエンド
    ├── style.css      # スタイル
    └── script.js      # API呼び出し
```

## API 仕様

### エンドポイント

```
POST /api/convert
Content-Type: application/json
```

### リクエスト

```json
{
  "text": "重要な会議で新しい戦略を検討した。",
  "dictionary": "comprehensive",
  "format": "html"
}
```

### レスポンス

```json
{
  "success": true,
  "data": {
    "original": "重要な会議で新しい戦略を検討した。",
    "converted": "<ruby>重要<rt>important</rt></ruby>な<ruby>会議<rt>meeting</rt></ruby>で<ruby>新しい<rt>new</rt></ruby><ruby>戦略<rt>strategy</rt></ruby>を<ruby>検討<rt>consideration</rt></ruby>した。",
    "stats": {
      "total_characters": 17,
      "converted_words": 5,
      "conversion_rate": "100%",
      "processing_time": 150
    }
  }
}
```

### エラーレスポンス

```json
{
  "success": false,
  "error": {
    "code": "ANALYSIS_FAILED",
    "message": "形態素解析に失敗しました"
  }
}
```

## フロントエンド仕様

### UI 構成

```html
<!DOCTYPE html>
<html>
  <head>
    <title>RubyLingo - RubyLingo</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <div class="container">
      <h1>RubyLingo</h1>

      <div class="input-section">
        <textarea
          id="inputText"
          placeholder="日本語テキストを入力してください..."
          rows="10"
        ></textarea>
      </div>

      <div class="controls">
        <select id="dictionarySelect">
          <option value="basic">基礎 (5,000語)</option>
          <option value="business">ビジネス (10,000語)</option>
          <option value="academic">学術 (20,000語)</option>
          <option value="comprehensive">総合 (50,000語)</option>
        </select>
        <button id="convertBtn">RubyLingo!</button>
      </div>

      <div class="output-section">
        <div id="outputText"></div>
        <div id="stats"></div>
      </div>
    </div>

    <script src="script.js"></script>
  </body>
</html>
```

### JavaScript 処理

```javascript
// script.js
document.getElementById("convertBtn").addEventListener("click", async () => {
  const text = document.getElementById("inputText").value;
  const dictionary = document.getElementById("dictionarySelect").value;

  if (!text.trim()) return;

  try {
    const response = await fetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, dictionary }),
    });

    const result = await response.json();

    if (result.success) {
      document.getElementById("outputText").innerHTML = result.data.converted;
      document.getElementById(
        "stats"
      ).innerHTML = `変換語数: ${result.data.stats.converted_words} |
                 処理時間: ${result.data.stats.processing_time}ms`;
    }
  } catch (error) {
    console.error("変換エラー:", error);
  }
});
```

## 技術仕様

### Runtime Environment

- **Node.js**: 18.x
- **Memory**: 1024MB
- **Timeout**: 30 秒
- **Architecture**: x86_64

### Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "kuromoji": "^0.1.2",
    "serverless-http": "^3.2.0",
    "cors": "^2.8.5"
  }
}
```

### Lambda Handler

```javascript
// index.js
const express = require("express");
const serverless = require("serverless-http");
const kuromoji = require("kuromoji");
const path = require("path");
const fs = require("fs");

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

// Global variables (Lambda container reuse)
let tokenizer = null;
let dictionaries = {};

// Initialize kuromoji (cold start)
const initializeKuromoji = async () => {
  if (tokenizer) return tokenizer;

  return new Promise((resolve, reject) => {
    kuromoji
      .builder({ dicPath: "/opt/kuromoji-dict/" })
      .build((err, _tokenizer) => {
        if (err) reject(err);
        else {
          tokenizer = _tokenizer;
          resolve(tokenizer);
        }
      });
  });
};

// Load dictionaries
const loadDictionaries = () => {
  if (Object.keys(dictionaries).length > 0) return;

  ["basic", "business", "academic", "comprehensive"].forEach((level) => {
    const dictPath = `/opt/dictionaries/${level}.json`;
    dictionaries[level] = JSON.parse(fs.readFileSync(dictPath, "utf8"));
  });
};

// Convert to ruby HTML
const convertToRuby = (text, dictionaryLevel) => {
  const tokens = tokenizer.tokenize(text);
  const dictionary = dictionaries[dictionaryLevel] || dictionaries.basic;

  let result = "";
  let lastIndex = 0;

  tokens.forEach((token) => {
    const surface = token.surface_form;
    const baseForm = token.basic_form;
    const startPos = text.indexOf(surface, lastIndex);

    // Add text before token
    if (startPos > lastIndex) {
      result += text.slice(lastIndex, startPos);
    }

    // Add ruby or plain text
    const english = dictionary[surface] || dictionary[baseForm];
    if (english && isTargetWord(token)) {
      result += `<ruby>${surface}<rt>${english}</rt></ruby>`;
    } else {
      result += surface;
    }

    lastIndex = startPos + surface.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    result += text.slice(lastIndex);
  }

  return result;
};

const isTargetWord = (token) => {
  const pos = token.pos;
  return ["名詞", "動詞", "形容詞", "副詞"].includes(pos);
};

// API Routes
app.post("/api/convert", async (req, res) => {
  try {
    const startTime = Date.now();
    const { text, dictionary = "basic" } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_INPUT", message: "テキストが必要です" },
      });
    }

    // Initialize on first request
    await initializeKuromoji();
    loadDictionaries();

    const converted = convertToRuby(text, dictionary);
    const processingTime = Date.now() - startTime;

    // Calculate stats
    const tokens = tokenizer.tokenize(text);
    const convertedWords = tokens.filter(
      (token) =>
        isTargetWord(token) &&
        (dictionaries[dictionary][token.surface_form] ||
          dictionaries[dictionary][token.basic_form])
    ).length;

    res.json({
      success: true,
      data: {
        original: text,
        converted: converted,
        stats: {
          total_characters: text.length,
          converted_words: convertedWords,
          conversion_rate:
            Math.round((convertedWords / tokens.length) * 100) + "%",
          processing_time: processingTime,
        },
      },
    });
  } catch (error) {
    console.error("Conversion error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "CONVERSION_FAILED",
        message: "変換処理でエラーが発生しました",
      },
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

module.exports.handler = serverless(app);
```

## デプロイ仕様

### Serverless Framework

```yaml
# serverless.yml
service: rubylingo-api

frameworkVersion: "3"

provider:
  name: aws
  runtime: nodejs18.x
  region: ap-northeast-1
  memorySize: 1024
  timeout: 30
  environment:
    NODE_ENV: production

functions:
  app:
    handler: index.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - http:
          path: /
          method: ANY
          cors: true
    layers:
      - { Ref: DependenciesLambdaLayer }
      - { Ref: DictionariesLambdaLayer }

layers:
  dependencies:
    path: layers/dependencies
    name: rubylingo-dependencies
    compatibleRuntimes:
      - nodejs18.x

  dictionaries:
    path: layers/dictionaries
    name: rubylingo-dictionaries
    compatibleRuntimes:
      - nodejs18.x
```

### デプロイコマンド

```bash
# 初回デプロイ
npm install
npm run build:layers
serverless deploy

# 更新デプロイ
serverless deploy function -f app
```

## パフォーマンス仕様

### 目標値

- **Cold Start**: 3 秒以内
- **Warm Request**: 500ms 以内
- **Conversion Rate**: 80%以上
- **Memory Usage**: 512MB 以下

### 最適化

- **Container Reuse**: tokenizer/辞書の初期化回避
- **Layer 分離**: 依存関係の効率的管理
- **JSON 最適化**: 辞書データの軽量化

## コスト試算

### AWS Lambda 課金

- **リクエスト**: $0.20 per 1M requests
- **Duration**: $0.0000166667 per GB-second
- **推定**: 1000req/月 ≈ $2-5/月

### 運用コスト

- **開発**: $0（ローカル開発）
- **本番**: $5-20/月（利用量次第）
- **メンテナンス**: ほぼ$0（サーバーレス）

## セキュリティ

### API 保護

- **Rate Limiting**: API Gateway throttling
- **CORS**: 適切なオリジン制限
- **Input Validation**: テキスト長・形式チェック

### データ保護

- **No Logging**: ユーザーテキストのログ保存なし
- **Encryption**: 通信は HTTPS 強制
- **Privacy**: 個人情報の非収集

## 拡張計画

### Phase 2: 機能拡張

- **複数言語**: 中国語、韓国語対応
- **API 認証**: 開発者向け API キー
- **統計機能**: 利用状況分析

### Phase 3: 統合展開

- **Chrome 拡張**: ブラウザ統合
- **WordPress Plugin**: CMS 統合
- **Mobile App**: ネイティブアプリ

## まとめ

この仕様は「大量 RubyLingo」の核心価値を最小構成で実現する。

**特徴**:

- **極限シンプル**: Lambda 1 つで完結
- **即座展開**: デプロイ 10 分、動作確認即座
- **無限拡張**: API 完成後の応用は無限大
- **最小コスト**: サーバーレスで運用コスト最小

AWS Lambda 完結型により、理想的な英語学習体験を最短・最小コストで実現する。
