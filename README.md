# RubyLingo - 日本語テキスト英訳ルビAPI
A fast Japanese text to English ruby conversion API using TinySegmenter and EDICT/JMdict dictionary, providing instant translation for large-scale English vocabulary exposure.

## 0. 概要

### 最も重要な価値提供

**日本語テキストに英訳ルビを高速で挿入し、大量の英単語学習機会を提供する。**

これがRubyLingo APIの核心価値である。

### APIの威力

- **高速処理**: 平均200ms以下でテキスト変換
- **大量語彙**: 36万語のEDICT/JMdict辞書を活用
- **簡単統合**: REST APIであらゆるアプリケーションに統合可能
- **サーバーレス**: AWS Lambdaで自動スケーリング

### 設計思思

- ✅ シンプルなAPIインターフェース
- ✅ 高速レスポンス時間
- ✅ サーバーレス構成でメンテナンスフリー
- ✅ 無料で無制限利用（現在）
- ✅ EDICTプロジェクトの信頼性ある辞書データ

**基本原則**: APIとしてシンプルで高速、あらゆるアプリケーションに組み込み可能。

---

## 1. サービス概要

### 1.1 サービス名

RubyLingo API

### 1.2 コア機能

**「日本語テキスト → 英訳ルビHTML変換」**

入力された日本語テキストをTinySegmenterで分析し、EDICT/JMdict辞書から英訳を取得し、HTMLルビタグ付きのテキストを返すAPIサービス。

### 1.3 API利用例

**リクエスト:**

```bash
curl -X POST https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/api/convert \
  -H "Content-Type: application/json" \
  -d '{"text":"重要な会議で新しい戦略を検討した。"}'
```

**レスポンス:**

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
    },
    "performance": {
      "conversion_time": 120,
      "total_request_time": 150,
      "dictionary_loaded": true
    }
  }
}
```

**効果**: 1文で5つの英単語に自動変換（150msで処理完了）

## 2. 大量シャワー実現機能

### 2.1 基本動作

1. Web ページの日本語テキストを検出
2. API で軽量日本語分詞（TinySegmenter使用）
3. EDICT/JMdict辞書から英訳ルビを挿入
4. 元のページレイアウトを維持

### 2.2 辞書切り替え（唯一の設定）

- **基礎辞書**: 日常語彙中心（5,000 語）
- **ビジネス辞書**: ビジネス語彙中心（10,000 語）
- **学術辞書**: 専門・学術語彙中心（20,000 語）
- **総合辞書**: 全語彙（50,000 語）

### 2.3 ON/OFF 制御

- **拡張機能アイコンクリック**: シャワー ON ⟷ OFF
- **ON 状態**: 全サイトで自動 RubyLingo
- **OFF 状態**: 通常ブラウジング

## 3. 技術仕様

### 3.1 アーキテクチャ

```
Chrome拡張機能（フロントエンド）
    ↓
日本語分詞API（バックエンド）
    ↓
EDICT/JMdict統合辞書
```

### 3.2 API 設計

```javascript
POST /api/convert
{
  "text": "重要な会議で戦略を検討"
}

// レスポンス
{
  "success": true,
  "data": {
    "original": "重要な会議で戦略を検討",
    "converted": "<ruby>重要<rt>important</rt></ruby>な<ruby>会議<rt>meeting</rt></ruby>で<ruby>戦略<rt>strategy</rt></ruby>を<ruby>検討<rt>consideration</rt></ruby>",
    "stats": {
      "total_characters": 11,
      "converted_words": 4,
      "conversion_rate": "57%",
      "processing_time": 2
    }
  }
}
```

### 3.3 パフォーマンス要件

- **レスポンス時間**: 500ms以内（コールドスタート除く）
- **同時処理**: 1000 リクエスト/秒
- **語彙数**: 約36万語（EDICT/JMdict）
- **精度**: 主要語彙カバー率 95%以上

## 4. 大量シャワー効果測定

### 4.1 露出量指標

- **1 日の英単語露出数**: 目標 3,000 語以上
- **ユニーク単語数**: 目標 500 語以上/日
- **反復回数**: 同一単語の遭遇頻度

### 4.2 利用パターン

- **ニュースサイト**: 1 記事で 50-100 語露出
- **ブログ記事**: 1 記事で 100-200 語露出
- **SNS**: 1 投稿で 5-20 語露出
- **技術記事**: 1 記事で 200-500 語露出

## 5. 開発計画

### 5.1 Phase 1: 基本シャワー実装（2 週間）

- [ ] Chrome 拡張機能の基本構造
- [ ] 形態素解析 API 開発
- [ ] 基礎辞書 5,000 語整備
- [ ] ルビ表示エンジン

### 5.2 Phase 2: 大規模辞書化（4 週間）

- [ ] 辞書を 50,000 語に拡充
- [ ] 分野別辞書整備
- [ ] API 性能最適化
- [ ] 複数辞書切り替え機能

### 5.3 Phase 3: シャワー最適化（4 週間）

- [ ] 動的コンテンツ対応
- [ ] レスポンス速度改善
- [ ] 大量サイト対応テスト
- [ ] ユーザビリティ改善

## 6. 成功指標

### 6.1 シャワー効果指標

- **日次利用時間**: 平均 30 分以上
- **英単語露出総数**: 1 セッション 1,000 語以上
- **継続利用率**: 週 5 日以上利用 70%

### 6.2 技術指標（EDICT版）

- **API 応答速度**: 平均 200ms 以下（コールドスタート除く）
- **語彙カバー率**: 主要語彙 95%以上
- **エラー率**: 1%以下
- **メモリ使用量**: 55MB以下（従来比30%削減）

## 7. ユーザーストーリー

### 7.1 メインユースケース

**「ニュースを読むだけで RubyLingo」**

1. Yahoo!ニュースにアクセス
2. 自動で全記事に英単語ルビが表示
3. 記事を読む = 自動的に数百の英単語に露出
4. 1 日 10 記事読む = 3,000 語の RubyLingo

### 7.2 対象コンテンツ

- **ニュースサイト**: 時事英語に大量露出
- **技術ブログ**: IT 英語に特化露出
- **趣味サイト**: 興味分野の英語露出
- **SNS**: 日常英語に継続露出

## 8. 価値提案

### 8.1 ユーザーメリット

- **学習時間ゼロ**: 普段のブラウジングが自動学習
- **大量インプット**: 1 日数千語の英単語に自然露出
- **継続性**: 特別な意識不要で自然に続く
- **文脈学習**: 生きた日本語文章での語彙習得

### 8.2 既存ツールとの差別化

- **設定不要**: インストールするだけで RubyLingo 開始
- **選択不要**: 全サイトが自動で英語学習装置に
- **学習不要**: 使い方を覚える必要なし
- **大量語彙**: 数万語レベルの圧倒的な語彙数

## 9. 制約事項

### 9.1 意図的制約（哲学的理由）

- **学習管理機能なし**: シャワーを浴びることのみに集中
- **進捗表示なし**: 数値に惑わされず純粋な露出体験
- **カスタマイズ制限**: 設定で迷わずシャワーに専念

### 9.2 技術制約

- **日本語サイト限定**: 日本語テキストがある場合のみ動作
- **API 依存**: インターネット接続必須
- **処理速度**: 大量テキストで若干の遅延可能性

---

**最重要**: この拡張機能は英単語を覚えさせるツールではない。
**大量の RubyLingo を浴び続けるための装置である。**

---

## API 仕様書

### 📋 API ドキュメント
- **[API 仕様書](docs/API_SPECIFICATION.md)** - 詳細なAPI仕様とサンプルコード
- **[OpenAPI/Swagger](docs/openapi.yaml)** - 機械可読なAPI仕様

### 🌐 API エンドポイント
**Base URL**: `https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1`

**主要エンドポイント**:
- `GET /api/health` - ヘルスチェック
- `POST /api/convert` - テキスト変換（ルビ挿入）
- `POST /api/analyze` - 詳細な形態素解析
- `GET /api/status` - システム状態
- `GET /api/dictionaries` - 辞書情報

### 💻 使用例
```bash
# テキスト変換
curl -X POST https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/api/convert \
  -H "Content-Type: application/json" \
  -d '{"text":"今日は良い天気です。"}'
```

---

## ライセンス

### ソフトウェアライセンス
このソフトウェアは [MIT License](https://opensource.org/licenses/MIT) の下で提供されています。

### 辞書データライセンス
このシステムは JMdict/EDICT プロジェクトの辞書データを使用しています：

- **JMdict/EDICT Dictionary**
- **著作権**: © Electronic Dictionary Research and Development Group (EDRDG)
- **ライセンス**: [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/)
- **出典**: http://www.edrdg.org/jmdict/j_jmdict.html

#### 帰属表示
「このソフトウェアは JMdict/EDICT 辞書ファイルを使用しています。これらのファイルは Electronic Dictionary Research and Development Group の財産であり、同グループのライセンスに従って使用されています。」

JMdict/EDICT ライセンスの詳細: http://www.edrdg.org/edrdg/licence.html
