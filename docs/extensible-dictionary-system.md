# 大量 RubyLingo 辞書システム設計書

## 概要

RubyLingo の核心である「大量 RubyLingo」を実現するための辞書システム。数万語レベルの英単語に継続的に露出させることを唯一の目的とする。

## 基本哲学

### 大量シャワーの原理

**目的**: 英単語を覚えさせることではなく、大量の英単語に触れ続けさせること

- 1 日数千語の英単語露出
- 同じ単語への自然な反復接触
- 無意識レベルでの語彙刷り込み

### 絶対に実装してはならない機能

- ❌ 学習進捗管理
- ❌ 覚えた単語の除外
- ❌ 暗記チェック機能
- ❌ 単語テスト機能
- ❌ ゲーミフィケーション

**理由**: 人間は忘れる生き物。繰り返し浴び続けることこそが重要。

## アーキテクチャ設計

### システム構成

```
Chrome拡張機能（クライアント）
    ↓ HTTP API
形態素解析エンジン（サーバー）
    ↓ クエリ
大規模辞書データベース（50,000語）
```

### API 設計

```javascript
POST /api/tokenize
{
  "text": "重要な会議で新しい戦略を検討した",
  "dictionary": "business",  // 辞書選択のみ
  "max_words": 1000         // 大量処理対応
}

// レスポンス
{
  "tokens": [
    {word: "重要", reading: "ジュウヨウ", english: "important"},
    {word: "会議", reading: "カイギ", english: "meeting"},
    {word: "戦略", reading: "センリャク", english: "strategy"},
    {word: "検討", reading: "ケントウ", english: "consideration"}
  ],
  "total_words": 4,
  "processing_time": 120    // ms
}
```

## 辞書設計

### 4 段階辞書構成（シャワー量で分類）

**基礎辞書（5,000 語）**

- 日常語彙中心
- ニュース・ブログで 70%カバー
- 1 日 1,000-2,000 語の RubyLingo

**ビジネス辞書（10,000 語）**

- ビジネス語彙中心
- 経済記事・企業サイトで 80%カバー
- 1 日 2,000-3,000 語の RubyLingo

**学術辞書（20,000 語）**

- 専門・学術語彙中心
- 技術記事・論文で 90%カバー
- 1 日 3,000-5,000 語の RubyLingo

**総合辞書（50,000 語）**

- 全語彙網羅
- あらゆるサイトで 95%カバー
- 1 日 5,000 語以上の RubyLingo

### 辞書データ構造

```json
{
  "metadata": {
    "name": "総合辞書",
    "total_words": 50000,
    "coverage": "95%",
    "target_exposure": "5000+ words/day",
    "last_updated": "2024-01-01"
  },
  "words": {
    "重要": {
      "english": "important",
      "reading": "ジュウヨウ",
      "frequency": 95, // 使用頻度
      "category": "general" // カテゴリ
    }
  }
}
```

## 技術実装

### 形態素解析エンジン

```python
import MeCab

class WordShowerAnalyzer:
    def __init__(self):
        # IPA辞書を使用した高精度解析
        self.mecab = MeCab.Tagger('-d /usr/local/lib/mecab/dic/ipadic')

    def analyze_for_shower(self, text):
        """大量シャワー用の解析"""
        tokens = []
        node = self.mecab.parseToNode(text)

        while node:
            if self.is_target_word(node):
                tokens.append({
                    'word': node.surface,
                    'reading': node.reading,
                    'base_form': node.base_form
                })
            node = node.next

        return tokens

    def is_target_word(self, node):
        """シャワー対象語かチェック"""
        # 名詞、動詞、形容詞、副詞のみ
        pos = node.part_of_speech.split(',')[0]
        return pos in ['名詞', '動詞', '形容詞', '副詞']
```

### 大量処理対応

```python
class HighVolumeProcessor:
    def __init__(self):
        self.cache = LRUCache(maxsize=10000)
        self.batch_size = 1000

    async def process_large_text(self, text, dictionary_id):
        """大量テキストの並列処理"""
        # テキストを適切なサイズに分割
        chunks = self.split_text(text, self.batch_size)

        # 並列処理でシャワー生成
        tasks = [
            self.process_chunk(chunk, dictionary_id)
            for chunk in chunks
        ]

        results = await asyncio.gather(*tasks)
        return self.merge_results(results)
```

### 辞書選択ロジック

```javascript
class ShowerDictionaryManager {
  constructor() {
    this.dictionaries = {
      basic: 5000,
      business: 10000,
      academic: 20000,
      comprehensive: 50000,
    };
  }

  selectOptimalDictionary(user_level, content_type) {
    // ユーザーの興味と露出量のバランス
    if (content_type === "news") return "basic";
    if (content_type === "business") return "business";
    if (content_type === "academic") return "academic";
    return "comprehensive"; // 最大シャワー
  }
}
```

## パフォーマンス最適化

### 大量シャワー高速化

```python
class ShowerOptimizer:
    def __init__(self):
        self.word_cache = {}      # 単語レベルキャッシュ
        self.phrase_cache = {}    # フレーズレベルキャッシュ

    def optimize_for_shower(self, text):
        # 1. キャッシュ済み単語の高速処理
        cached_words = self.get_cached_words(text)

        # 2. 新規単語のバッチ処理
        new_words = self.extract_new_words(text)
        translated = self.batch_translate(new_words)

        # 3. 結果をマージしてシャワー生成
        return self.merge_shower_data(cached_words, translated)
```

### レスポンス時間目標

- **基礎辞書**: 200ms 以内
- **ビジネス辞書**: 500ms 以内
- **学術辞書**: 800ms 以内
- **総合辞書**: 1000ms 以内

## スケーラビリティ

### 大量ユーザー対応

```yaml
# インフラ構成
load_balancer:
  - nginx
  - 1000 req/sec

api_servers:
  - FastAPI × 5台
  - 各200 req/sec処理能力

morphological_analysis:
  - MeCab専用サーバー × 3台
  - GPUアクセラレーション

dictionary_database:
  - PostgreSQL（50,000語）
  - Redis（高頻度語キャッシュ）
```

### 辞書拡張計画

```
Year 1: 50,000語（基本完成）
Year 2: 100,000語（専門分野拡充）
Year 3: 200,000語（業界特化辞書）
```

## 品質保証

### シャワー効果測定

```python
class ShowerEffectMeasurer:
    def measure_exposure(self, user_session):
        """英単語露出量の測定"""
        return {
            'total_words_exposed': len(session.exposed_words),
            'unique_words': len(set(session.exposed_words)),
            'repeat_encounters': self.count_repeats(session),
            'exposure_rate': self.calc_words_per_minute(session)
        }

    def analyze_shower_quality(self, text, tokens):
        """シャワー品質の分析"""
        coverage = len(tokens) / len(self.extract_all_words(text))
        return {
            'coverage_rate': coverage,
            'shower_density': len(tokens) / len(text.split()),
            'quality_score': self.calc_quality_score(coverage, tokens)
        }
```

### 形態素解析精度

- **目標精度**: 95%以上
- **測定方法**: 人手評価データとの比較
- **改善サイクル**: 月次での精度測定・改善

## 運用指標

### シャワー効果指標

- **日次英単語露出数**: 目標 3,000 語以上
- **ユニーク単語数**: 目標 500 語以上/日
- **同一単語遭遇回数**: 平均 3 回以上
- **シャワー継続時間**: 目標 30 分以上/日

### システム指標

- **API 応答速度**: 95%tile 1 秒以内
- **可用性**: 99.9%以上
- **エラー率**: 1%以下
- **同時接続数**: 1,000 ユーザー対応

## セキュリティ

### プライバシー保護

```python
class PrivacyProtection:
    def anonymize_text(self, text):
        """個人情報の匿名化"""
        # 固有名詞の除去
        # メールアドレス等の匿名化
        return self.remove_pii(text)

    def no_logging_policy(self):
        """ログなし方針"""
        # ユーザーのテキストは一切保存しない
        # 統計情報のみ記録
        pass
```

### API 制限

- **レート制限**: 100req/min/user
- **テキスト長制限**: 10,000 文字/request
- **認証**: API キー必須

## デプロイメント

### CI/CD パイプライン

```yaml
stages:
  - dictionary_validation: # 辞書データの整合性チェック
      - word_count_validation
      - duplicate_check
      - quality_assessment

  - performance_test: # シャワー性能テスト
      - load_testing (1000 req/sec)
      - response_time_check
      - shower_quality_test

  - deployment: # 段階的デプロイ
      - staging_deploy
      - shower_effect_validation
      - production_deploy
```

### 監視

```python
class ShowerMonitoring:
    def monitor_shower_health(self):
        """シャワー健全性の監視"""
        metrics = {
            'words_per_second': self.measure_throughput(),
            'shower_quality': self.measure_quality(),
            'user_exposure': self.measure_exposure(),
            'system_health': self.check_system()
        }

        if metrics['shower_quality'] < 0.9:
            self.alert_shower_degradation()
```

## 今後の拡張

### 将来的な辞書拡充

1. **専門分野特化**

   - IT・エンジニアリング辞書（20,000 語）
   - 医療・バイオ辞書（15,000 語）
   - 法律・金融辞書（10,000 語）

2. **言語対応拡張**

   - 中国語ルビシャワー
   - 韓国語ルビシャワー
   - フランス語ルビシャワー

3. **AI 活用**
   - 文脈に応じた訳語選択
   - ユーザーの読解レベル推定
   - 最適なシャワー強度自動調整

## まとめ

この辞書システムは「大量 RubyLingo」という明確な哲学のもと設計される。

**重要原則**:

1. 覚えさせるのではなく、浴び続けさせる
2. 学習管理ではなく、露出量最大化
3. 複雑な機能ではなく、シンプルなシャワー

技術的には十分実現可能であり、適切に実装すれば革新的な英語学習体験を提供できる。
