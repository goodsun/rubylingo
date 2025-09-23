# RubyLingo 大量 RubyLingo Chrome 拡張機能 開発フロー

## 概要

「大量 RubyLingo」を実現する Chrome 拡張機能の開発から公開までの完全ガイド。

## 基本哲学

### 開発の最重要原則

**シンプルさこそが大量シャワーを実現する**

- 複雑な機能は開発しない（シャワーの妨げになる）
- 設定項目は最小限（辞書選択と ON/OFF のみ）
- 学習管理機能は一切実装しない

### 開発目標

1. **大量語彙への露出**: 数万語レベルの RubyLingo
2. **高速処理**: 1 秒以内のルビ表示
3. **読書体験維持**: コンテンツ消費を阻害しない
4. **継続可能性**: 毎日使い続けられる軽量性

## 開発フロー

### Phase 1: 基本シャワー実装（2 週間）

#### Week 1: Chrome 拡張機能の基盤

```bash
# プロジェクト初期化
mkdir rubylingo-shower
cd rubylingo-shower

# 基本ファイル構成
touch manifest.json
touch content.js
touch background.js
touch popup.html popup.js popup.css

# APIクライアント作成
mkdir api
touch api/shower-client.js
```

**1.1 manifest.json（シャワー特化）**

```json
{
  "manifest_version": 3,
  "name": "RubyLingo - RubyLingo",
  "version": "1.0.0",
  "description": "大量RubyLingoで語彙爆増",

  "permissions": ["storage"],
  "host_permissions": ["<all_urls>"],

  "action": {
    "default_popup": "popup.html"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["api/shower-client.js", "content.js"],
      "run_at": "document_idle"
    }
  ],

  "background": {
    "service_worker": "background.js"
  }
}
```

**1.2 シャワー API クライアント**

```javascript
// api/shower-client.js
class ShowerAPIClient {
  constructor() {
    this.baseURL = "https://api.rubylingo.com";
    this.cache = new Map();
  }

  async getWordShower(text, dictionary = "basic") {
    const cacheKey = `${dictionary}:${text.slice(0, 100)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseURL}/api/tokenize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, dictionary }),
      });

      const result = await response.json();
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Shower API Error:", error);
      return { tokens: [] }; // フォールバック
    }
  }
}
```

**1.3 シャワー表示エンジン**

```javascript
// content.js - シャワー専用
class WordShowerEngine {
  constructor() {
    this.apiClient = new ShowerAPIClient();
    this.isEnabled = true;
    this.currentDictionary = "basic";
    this.processedElements = new WeakSet();
  }

  async startShower() {
    // 日本語テキストを検出してシャワー開始
    const textNodes = this.findJapaneseTextNodes();

    for (const node of textNodes) {
      await this.addWordShower(node);
    }
  }

  async addWordShower(textNode) {
    const text = textNode.textContent;
    const { tokens } = await this.apiClient.getWordShower(
      text,
      this.currentDictionary
    );

    // ルビ生成
    const fragment = this.createShowerFragment(text, tokens);
    textNode.parentNode.replaceChild(fragment, textNode);
  }

  createShowerFragment(text, tokens) {
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    tokens.forEach((token) => {
      const index = text.indexOf(token.word, lastIndex);

      // 前のテキスト
      if (index > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex, index))
        );
      }

      // ルビ付き単語（シャワー）
      const ruby = document.createElement("ruby");
      ruby.textContent = token.word;
      ruby.className = "word-shower";

      const rt = document.createElement("rt");
      rt.textContent = token.english;
      rt.className = "shower-translation";

      ruby.appendChild(rt);
      fragment.appendChild(ruby);

      lastIndex = index + token.word.length;
    });

    // 残りのテキスト
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    return fragment;
  }
}
```

#### Week 2: UI/UX とスタイリング

**2.1 超シンプルポップアップ**

```html
<!-- popup.html -->
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="popup.css" />
  </head>
  <body>
    <div class="shower-control">
      <h1>RubyLingo</h1>

      <div class="toggle">
        <input type="checkbox" id="showerToggle" />
        <label for="showerToggle">シャワー開始</label>
      </div>

      <div class="dictionary-select">
        <label>シャワー強度:</label>
        <select id="dictionarySelect">
          <option value="basic">基礎 (5,000語)</option>
          <option value="business">ビジネス (10,000語)</option>
          <option value="academic">学術 (20,000語)</option>
          <option value="comprehensive">最大 (50,000語)</option>
        </select>
      </div>
    </div>
    <script src="popup.js"></script>
  </body>
</html>
```

**2.2 シャワー専用スタイル**

```css
/* popup.css */
.shower-control {
  width: 250px;
  padding: 20px;
  font-family: "Segoe UI", sans-serif;
}

.shower-control h1 {
  color: #2196f3;
  font-size: 18px;
  margin: 0 0 15px 0;
  text-align: center;
}

.toggle {
  margin-bottom: 15px;
  text-align: center;
}

.dictionary-select label {
  font-size: 12px;
  color: #666;
}

.dictionary-select select {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
}

/* ページ内シャワースタイル */
.word-shower {
  background: rgba(33, 150, 243, 0.1);
  border-radius: 2px;
  margin: 0 1px;
}

.shower-translation {
  font-size: 0.7em;
  color: #1976d2;
  font-weight: 500;
}
```

### Phase 2: シャワー API 開発（4 週間）

#### Week 3-4: バックエンド API

**2.1 FastAPI サーバー構築**

```python
# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import MeCab
import json
import asyncio
from typing import List, Dict

app = FastAPI(title="RubyLingo Shower API")

class ShowerRequest(BaseModel):
    text: str
    dictionary: str = "basic"
    max_words: int = 1000

class WordToken(BaseModel):
    word: str
    reading: str
    english: str
    frequency: int

class ShowerResponse(BaseModel):
    tokens: List[WordToken]
    total_words: int
    processing_time: int

class WordShowerProcessor:
    def __init__(self):
        self.mecab = MeCab.Tagger('-d /usr/local/lib/mecab/dic/ipadic')
        self.dictionaries = self.load_dictionaries()

    def load_dictionaries(self):
        """50,000語の大規模辞書読み込み"""
        with open('dictionaries/comprehensive.json', 'r') as f:
            comprehensive = json.load(f)
        with open('dictionaries/business.json', 'r') as f:
            business = json.load(f)
        with open('dictionaries/basic.json', 'r') as f:
            basic = json.load(f)

        return {
            'comprehensive': comprehensive,
            'academic': comprehensive,  # サブセット
            'business': business,
            'basic': basic
        }

    async def process_for_shower(self, text: str, dictionary: str) -> List[WordToken]:
        """大量シャワー生成処理"""
        import time
        start_time = time.time()

        # 形態素解析
        tokens = []
        node = self.mecab.parseToNode(text)
        dict_data = self.dictionaries[dictionary]

        while node:
            if self.is_shower_target(node):
                word = node.surface
                base_form = node.feature.split(',')[6]
                reading = node.feature.split(',')[7]

                # 辞書から英訳取得
                english = dict_data.get(word) or dict_data.get(base_form)
                if english:
                    tokens.append(WordToken(
                        word=word,
                        reading=reading if reading != '*' else word,
                        english=english,
                        frequency=self.get_frequency(word, dict_data)
                    ))
            node = node.next

        processing_time = int((time.time() - start_time) * 1000)
        return tokens, processing_time

    def is_shower_target(self, node):
        """シャワー対象の品詞チェック"""
        pos = node.feature.split(',')[0]
        return pos in ['名詞', '動詞', '形容詞', '副詞']

@app.post("/api/tokenize", response_model=ShowerResponse)
async def create_word_shower(request: ShowerRequest):
    processor = WordShowerProcessor()

    try:
        tokens, processing_time = await processor.process_for_shower(
            request.text, request.dictionary
        )

        return ShowerResponse(
            tokens=tokens,
            total_words=len(tokens),
            processing_time=processing_time
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Shower generation failed: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### Week 5-6: 大規模辞書整備

**2.2 50,000 語辞書作成スクリプト**

```python
# dictionary_builder.py
import pandas as pd
import json
from collections import defaultdict

class MassiveDictionaryBuilder:
    def __init__(self):
        self.word_frequencies = defaultdict(int)
        self.translations = {}

    def build_comprehensive_dictionary(self):
        """50,000語の包括辞書構築"""

        # 1. 基本語彙 (5,000語)
        basic_words = self.load_basic_vocabulary()

        # 2. ビジネス語彙 (10,000語)
        business_words = self.load_business_vocabulary()

        # 3. 学術語彙 (20,000語)
        academic_words = self.load_academic_vocabulary()

        # 4. 専門語彙 (15,000語)
        specialized_words = self.load_specialized_vocabulary()

        # 統合と重複除去
        comprehensive = {
            **basic_words,
            **business_words,
            **academic_words,
            **specialized_words
        }

        return comprehensive

    def save_dictionaries(self):
        """レベル別辞書保存"""
        comprehensive = self.build_comprehensive_dictionary()

        # 使用頻度でソート
        sorted_words = sorted(
            comprehensive.items(),
            key=lambda x: self.word_frequencies[x[0]],
            reverse=True
        )

        # レベル別に分割
        dictionaries = {
            'basic': dict(sorted_words[:5000]),
            'business': dict(sorted_words[:10000]),
            'academic': dict(sorted_words[:20000]),
            'comprehensive': dict(sorted_words[:50000])
        }

        # ファイル保存
        for level, words in dictionaries.items():
            with open(f'dictionaries/{level}.json', 'w', encoding='utf-8') as f:
                json.dump(words, f, ensure_ascii=False, indent=2)

        print(f"辞書構築完了: {len(comprehensive)}語")

if __name__ == "__main__":
    builder = MassiveDictionaryBuilder()
    builder.save_dictionaries()
```

### Phase 3: 本格運用対応（4 週間）

#### Week 7-8: パフォーマンス最適化

**3.1 高速シャワー処理**

```javascript
// 高速化されたcontent.js
class OptimizedShowerEngine {
  constructor() {
    this.apiClient = new ShowerAPIClient();
    this.cache = new Map();
    this.processQueue = [];
    this.isProcessing = false;
  }

  async startOptimizedShower() {
    // バッチ処理でAPI呼び出し最小化
    const textChunks = this.collectTextChunks();

    // 並列処理
    const promises = textChunks.map((chunk) => this.processBatch(chunk));

    await Promise.all(promises);
  }

  async processBatch(textChunk) {
    // 大量テキストを効率的に処理
    const batchSize = 1000;
    const text = textChunk.map((node) => node.textContent).join("\n");

    if (text.length > batchSize) {
      const { tokens } = await this.apiClient.getWordShower(text);
      this.applyShowerToChunk(textChunk, tokens);
    }
  }

  // インターセクションオブザーバーで可視範囲のみ処理
  setupLazyShower() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.addWordShower(entry.target);
        }
      });
    });

    document.querySelectorAll("p, div, span").forEach((el) => {
      if (this.hasJapanese(el.textContent)) {
        observer.observe(el);
      }
    });
  }
}
```

#### Week 9-10: デプロイメント・運用

**3.2 CI/CD パイプライン**

```yaml
# .github/workflows/shower-deploy.yml
name: RubyLingo Shower Deployment

on:
  push:
    branches: [main]

jobs:
  test-shower-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: シャワー品質テスト
        run: |
          npm test
          python test_shower_api.py

      - name: 辞書整合性チェック
        run: |
          python validate_dictionaries.py

  deploy-extension:
    needs: test-shower-quality
    runs-on: ubuntu-latest
    steps:
      - name: Chrome Web Store 自動デプロイ
        run: |
          npm run build
          npm run deploy:chrome-store

  deploy-api:
    needs: test-shower-quality
    runs-on: ubuntu-latest
    steps:
      - name: API サーバーデプロイ
        run: |
          docker build -t shower-api .
          docker push gcr.io/project/shower-api
          kubectl apply -f k8s/
```

**3.3 監視・アラート**

```python
# monitoring.py
class ShowerMonitoring:
    def __init__(self):
        self.metrics = {
            'shower_requests_per_second': 0,
            'avg_response_time': 0,
            'shower_quality_score': 0,
            'error_rate': 0
        }

    def monitor_shower_health(self):
        """シャワー健全性監視"""
        while True:
            # API応答時間チェック
            if self.metrics['avg_response_time'] > 1000:
                self.alert_slow_shower()

            # エラー率チェック
            if self.metrics['error_rate'] > 0.01:
                self.alert_shower_degradation()

            # シャワー品質チェック
            if self.metrics['shower_quality_score'] < 0.9:
                self.alert_quality_issue()

            time.sleep(60)

    def alert_slow_shower(self):
        """シャワー速度低下アラート"""
        send_slack_alert(" シャワー速度低下検出")

    def alert_shower_degradation(self):
        """シャワー品質低下アラート"""
        send_slack_alert("⚠️ シャワー品質低下")
```

## 開発体制

### 必要なスキルセット

- **フロントエンド**: JavaScript, Chrome Extension API
- **バックエンド**: Python, FastAPI, MeCab
- **インフラ**: Docker, Kubernetes, GCP
- **辞書**: 語彙学、翻訳、データサイエンス

### 開発チーム構成（推奨）

- **フロントエンドエンジニア ×1**: Chrome 拡張機能開発
- **バックエンドエンジニア ×1**: API・インフラ開発
- **言語学者 ×1**: 辞書構築・品質管理
- **プロダクトマネージャー ×1**: シャワー効果最適化

## 品質保証

### テスト戦略

```javascript
// シャワー品質テスト
describe("WordShower Quality Tests", () => {
  test("大量語彙露出テスト", async () => {
    const text =
      "重要な会議で新しい戦略を検討した結果、効率的な解決策を発見した。";
    const result = await showerEngine.process(text);

    // シャワー密度チェック
    expect(result.tokens.length).toBeGreaterThan(5);

    // 露出品質チェック
    expect(result.coverage_rate).toBeGreaterThan(0.8);
  });

  test("高速レスポンステスト", async () => {
    const start = Date.now();
    await showerEngine.process(largeSampleText);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000); // 1秒以内
  });
});
```

### 成功指標

- **シャワー密度**: 1 文あたり平均 3 語以上の英単語露出
- **処理速度**: 95%のリクエストが 1 秒以内
- **利用継続率**: 週次アクティブ率 70%以上
- **露出総量**: ユーザーあたり 1 日 3,000 語以上

## リリース戦略

### Phase 1: クローズド β（100 ユーザー）

- 基本シャワー機能検証
- レスポンス速度最適化
- 初期品質改善

### Phase 2: オープン β（1,000 ユーザー）

- 大量辞書での実証
- 負荷テスト・スケール検証
- ユーザーフィードバック収集

### Phase 3: 一般公開（10,000 ユーザー目標）

- Chrome Web Store 公開
- マーケティング展開
- 継続的改善サイクル確立

## まとめ

この開発フローは「大量 RubyLingo」という明確な目標に特化している。

**開発の核心原則**:

1. **シンプルさ**: 複雑な機能は一切開発しない
2. **大量語彙**: 50,000 語レベルの圧倒的な辞書
3. **高速処理**: 1 秒以内のシャワー開始
4. **継続性**: 毎日使い続けられる軽量性

技術的には十分実現可能であり、適切な開発体制で 10 週間程度での完成が見込める。
