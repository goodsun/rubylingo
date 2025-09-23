# RubyLingo MVP実装計画

## Phase 1: API中心最小実装

### 核心価値
**「平文 → 英単語シャワー用構造化テキスト変換API」**

日本語テキストを受け取り、英訳ルビ付きHTMLを返すシンプルなAPI。
これがあれば無限の応用展開が可能。

## 実装構成

### 1. ペライチフロントエンド
```
frontend/
├── index.html          # シンプルなテキスト変換UI
├── style.css           # 最小限のスタイル
└── script.js           # API呼び出し処理
```

**特徴**:
- テキストエリア1つ
- 変換ボタン1つ  
- 結果表示エリア1つ
- 開発時間: 半日

### 2. ルビ変換API
```
api/
├── main.py             # FastAPI サーバー
├── morphological.py    # 形態素解析処理
├── dictionary.py       # 辞書管理
├── converter.py        # ルビ変換ロジック
└── requirements.txt    # 依存関係
```

**API仕様**:
```javascript
POST /api/ruby-convert
{
  "text": "重要な会議で新しい戦略を検討した。",
  "dictionary": "comprehensive"  // optional
}

// Response
{
  "original": "重要な会議で新しい戦略を検討した。",
  "converted": "<ruby>重要<rt>important</rt></ruby>な<ruby>会議<rt>meeting</rt></ruby>で<ruby>新しい<rt>new</rt></ruby><ruby>戦略<rt>strategy</rt></ruby>を<ruby>検討<rt>consideration</rt></ruby>した。",
  "stats": {
    "total_words": 5,
    "converted_words": 5,
    "conversion_rate": "100%",
    "processing_time": 120
  }
}
```

### 3. 辞書データ
```
dictionaries/
├── ipa_dictionary/     # MeCab IPA辞書
├── japanese_english.json  # 日英対訳辞書
└── frequency_data.json    # 語彙頻度データ
```

**辞書構成**:
- **基本辞書**: 10,000語（日常・ビジネス語彙）
- **拡張辞書**: 30,000語（専門・学術語彙）  
- **総合辞書**: 50,000語（包括的語彙）

## 技術スタック

### バックエンド
- **Python 3.9+**
- **FastAPI**: 高速API開発
- **MeCab + IPAdic**: 形態素解析
- **uvicorn**: ASGIサーバー

### フロントエンド  
- **Vanilla HTML/CSS/JS**: フレームワーク不使用
- **シンプル**: 学習曲線なし、即座に理解可能

### インフラ
- **開発**: ローカル環境
- **本番**: Heroku/Railway/Vercel等の簡単デプロイ

## 開発スケジュール

### Week 1: API開発
**Day 1-2**: 基本API構造
```python
# main.py 基本構造
from fastapi import FastAPI
import MeCab

app = FastAPI(title="RubyLingo API")

@app.post("/api/ruby-convert")
async def convert_to_ruby(request: ConvertRequest):
    # 形態素解析
    # 辞書参照
    # ルビHTML生成
    return response
```

**Day 3-4**: 形態素解析統合
```python  
# morphological.py
class MorphologicalAnalyzer:
    def __init__(self):
        self.mecab = MeCab.Tagger('-d /usr/local/lib/mecab/dic/ipadic')
    
    def analyze(self, text):
        # 日本語テキストを単語に分割
        # 品詞情報付きトークン生成
        return tokens
```

**Day 5-7**: 辞書統合・ルビ生成
```python
# converter.py  
class RubyConverter:
    def convert_to_ruby_html(self, text, tokens, dictionary):
        # トークンと辞書から英訳ルビHTML生成
        return ruby_html
```

### Week 2: フロントエンド・統合
**Day 8-9**: ペライチUI作成
```html
<!-- index.html -->
<div class="converter">
    <h1>英単語シャワー変換</h1>
    <textarea id="input" placeholder="日本語を入力..."></textarea>
    <button onclick="convert()">シャワー変換</button>
    <div id="output" class="ruby-display"></div>
</div>
```

**Day 10-12**: 統合テスト・デバッグ
- API-フロントエンド連携
- エラーハンドリング
- パフォーマンステスト

**Day 13-14**: デプロイ・公開
- 本番環境デプロイ
- 動作確認
- 初期ユーザーテスト

## 成功指標

### 技術指標
- **応答速度**: 500ms以内
- **変換精度**: 80%以上
- **可用性**: 99%以上

### 利用指標  
- **初回インプレッション**: 「これは使える！」
- **変換品質**: 実用的なシャワー効果
- **応用可能性**: 他システムでの活用イメージ

## Phase 2以降の展開

### 短期展開（1-3ヶ月）
- **WordPress プラグイン**: ブログでの活用
- **Chrome拡張機能**: ブラウザ統合  
- **学習アプリ**: 専用アプリ開発

### 中期展開（3-12ヶ月）
- **電子書籍サービス**: 出版社との連携
- **ニュースサイト**: メディアとの統合
- **企業向けAPI**: B2Bサービス化

### 長期展開（1年以上）
- **多言語対応**: 中国語、韓国語等
- **AI強化**: 文脈理解による精度向上
- **プラットフォーム化**: エコシステム構築

## リソース要件

### 開発リソース
- **バックエンドエンジニア×1**: 2週間
- **フロントエンドエンジニア×1**: 3日
- **データ準備×1**: 3日

### インフラコスト
- **開発環境**: $0（ローカル）
- **本番環境**: $20-50/月（初期）
- **辞書データ**: 初期作成のみ

## まとめ

この計画は「大量英単語シャワー」の核心価値を最短で実現する。

**重要原則**:
1. **API完成が最優先**: 応用展開はその後
2. **シンプルさ重視**: 複雑な機能は一切排除  
3. **即座の価値提供**: 使ってすぐに効果実感

2週間でMVP完成、その後は無限の応用展開が可能になる。