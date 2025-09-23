# RubyLingo 辞書戦略

## 🎯 基本方針

### 核心原則

**「語彙数制限 → メモリ制限」へのパラダイムシフト**

従来の語彙数ベース辞書（5,000 語、10,000 語）から、**メモリ使用量ベース辞書（60MB 固定）**への転換により、真の「英単語シャワー効果」を実現する。

### シャワー効果の最大化

- **60MB = 最適メモリ使用量**: 実用性とパフォーマンスのベストバランス
- **レベル別専門化**: 用途に応じた語彙選別で 90%以上のカバレッジ実現
- **段階的成長**: 習熟度に応じた辞書切り替えで継続的学習効果

## 📚 新辞書体系設計

### 4 段階辞書

#### **Level 1: 日常辞書**

```
ターゲット: 一般読書・青空文庫
語彙選別: 日常語彙を頻度順で60MB分収録
推定語彙数: 30,000-40,000語
カバレッジ: 小説・エッセイの90%
用途: 読書入門・初級英語学習
```

#### **Level 2: ビジネス辞書**

```
ターゲット: ニュース・ビジネス文書
語彙選別: ビジネス語彙中心で60MB分収録
推定語彙数: 25,000-35,000語
カバレッジ: 経済記事・企業サイトの90%
用途: ニュース読解・中級英語学習
```

#### **Level 3: 学術辞書**

```
ターゲット: 技術文書・学術論文
語彙選別: 専門・学術語彙中心で60MB分収録
推定語彙数: 20,000-30,000語
カバレッジ: 研究論文・技術記事の90%
用途: 専門書読解・上級英語学習
```

#### **Level 4: 総合辞書**

```
ターゲット: 全分野包括
語彙選別: 全領域を網羅して60MB分収録
推定語彙数: 40,000-50,000語
カバレッジ: あらゆるテキストの95%
用途: 最大シャワー効果・包括的学習
```

## 🔬 辞書生成アルゴリズム

### 語彙選別方針

#### **1. ドメイン特化スコアリング**

```javascript
function calculateDomainScore(word, targetDomain) {
  let score = baseFrequencyScore(word);

  // ドメイン特化ボーナス
  if (targetDomain === "daily") {
    score += getDailyUsageBonus(word);
  } else if (targetDomain === "business") {
    score += getBusinessRelevanceBonus(word);
  } else if (targetDomain === "academic") {
    score += getAcademicImportanceBonus(word);
  }

  return score;
}
```

#### **2. 60MB ターゲット最適化**

```javascript
function build60MBDictionary(entries, targetDomain) {
  const maxSize = 60 * 1024 * 1024; // 60MB
  const scored = entries.map((e) => ({
    ...e,
    score: calculateDomainScore(e.word, targetDomain),
    size: calculateEntrySize(e),
  }));

  // スコア順ソート
  scored.sort((a, b) => b.score - a.score);

  // 60MB制限内で最大語彙数を収録
  let dictionary = {};
  let currentSize = 0;

  for (const entry of scored) {
    if (currentSize + entry.size > maxSize) break;
    dictionary[entry.word] = entry;
    currentSize += entry.size;
  }

  return {
    dictionary,
    stats: {
      wordCount: Object.keys(dictionary).length,
      actualSize: currentSize,
      coverage: estimateCoverage(dictionary, targetDomain),
    },
  };
}
```

#### **3. カバレッジ検証**

```javascript
function validateCoverage(dictionary, targetDomain) {
  const testCorpora = getTestCorpora(targetDomain);
  let totalWords = 0;
  let coveredWords = 0;

  for (const corpus of testCorpora) {
    const words = extractWords(corpus);
    totalWords += words.length;
    coveredWords += words.filter((w) => dictionary[w]).length;
  }

  return {
    coverage: coveredWords / totalWords,
    recommendation: coverage > 0.9 ? "APPROVED" : "NEEDS_IMPROVEMENT",
  };
}
```

## 🎯 レベル別語彙戦略

### Level 1: 日常辞書

#### **対象コーパス**

- 青空文庫作品（夏目漱石、芥川龍之介等）
- 現代小説サンプル
- 新聞の社会面・文化面
- ブログ・エッセイ

#### **優先語彙カテゴリ**

1. **基本動詞**: する、ある、いる、思う、見る、言う
2. **感情表現**: 嬉しい、悲しい、怒る、驚く
3. **日常名詞**: 家、学校、仕事、時間、人
4. **形容詞**: 大きい、小さい、美しい、面白い
5. **副詞**: とても、少し、もっと、やはり

### Level 2: ビジネス辞書

#### **対象コーパス**

- 経済新聞記事
- 企業プレスリリース
- ビジネス書籍
- 業界レポート

#### **優先語彙カテゴリ**

1. **ビジネス動詞**: 管理、運営、開発、販売、分析
2. **経済用語**: 市場、投資、利益、コスト、効率
3. **組織用語**: 会社、部署、会議、戦略、計画
4. **数値表現**: 増加、減少、割合、統計、データ
5. **技術用語**: システム、ソフトウェア、デジタル

### Level 3: 学術辞書

#### **対象コーパス**

- 学術論文（人文・社会科学）
- 技術文書・マニュアル
- 専門書籍
- 研究レポート

#### **優先語彙カテゴリ**

1. **研究用語**: 研究、調査、分析、検証、考察
2. **学術動詞**: 検討、提案、議論、比較、評価
3. **理論用語**: 概念、理論、仮説、方法、結果
4. **技術用語**: 技術、開発、実装、最適化、設計
5. **専門形容詞**: 複雑、詳細、具体的、抽象的

### Level 4: 総合辞書

#### **対象コーパス**

- 全分野の代表的テキスト
- インターネット記事
- 専門書籍サンプル
- 多様なジャンルの文書

#### **優先語彙カテゴリ**

1. **高頻度語**: 全分野共通の重要語彙
2. **専門用語**: 各分野の基本的専門語
3. **現代語**: 最新の語彙・表現
4. **文語表現**: 格式ある文章での語彙
5. **カタカナ語**: 外来語・新語

## 📊 段階的学習システム

### 辞書レベル推薦アルゴリズム

#### **習熟度判定指標**

```javascript
class LearningProgressAnalyzer {
  analyzeUserProgress(userStats) {
    return {
      conversionRate: userStats.convertedWords / userStats.totalWords,
      noveltyRate: userStats.newWords / userStats.totalWords,
      satisfactionScore:
        userStats.positiveInteractions / userStats.totalInteractions,
      retentionRate: userStats.rememberedWords / userStats.exposedWords,
    };
  }

  recommendLevelChange(progress, currentLevel) {
    // 高い変換率 + 低い新規語彙率 = レベルアップ推奨
    if (progress.conversionRate > 0.85 && progress.noveltyRate < 0.2) {
      return {
        action: "UPGRADE",
        nextLevel: this.getNextLevel(currentLevel),
        reason:
          "現在の辞書は習得済みの語彙が多いため、より高度な辞書を推奨します",
      };
    }

    // 低い変換率 = レベルダウン推奨
    if (progress.conversionRate < 0.3) {
      return {
        action: "DOWNGRADE",
        nextLevel: this.getPreviousLevel(currentLevel),
        reason: "未知の語彙が多すぎるため、基礎的な辞書を推奨します",
      };
    }

    return {
      action: "MAINTAIN",
      reason: "現在の辞書レベルが適切です",
    };
  }
}
```

#### **学習ジャーニー設計**

```
初心者 → Level 1 (日常シャワー)
  ↓ 習熟度80%以上
中級者 → Level 2 (ビジネスシャワー)
  ↓ 習熟度80%以上
上級者 → Level 3 (学術シャワー)
  ↓ 習熟度80%以上
エキスパート → Level 4 (総合シャワー)
```

## 🚀 実装フェーズ

### Phase 1: 日常辞書生成（最優先）

```
目標: 青空文庫での90%カバレッジ実現
期間: 1週間
成果物:
- 日常辞書 (60MB)
- カバレッジ検証レポート
- パフォーマンステスト結果
```

### Phase 2: 全レベル辞書生成

```
目標: 4段階すべての辞書完成
期間: 2週間
成果物:
- ビジネス辞書 (60MB)
- 学術辞書 (60MB)
- 総合辞書 (60MB)
- 各レベルの品質検証
```

### Phase 3: 推薦システム実装

```
目標: 自動レベル推薦機能
期間: 1週間
成果物:
- 習熟度判定アルゴリズム
- レベル推薦UI
- ユーザー学習履歴管理
```

## 📈 期待される効果

### 学習効果の飛躍的向上

```
Before (語彙数制限):
- basic 5,000語: カバレッジ 10-20%
- 英単語露出: 100-200語/章
- 学習効果: 限定的

After (60MBシャワー):
- 日常シャワー 30,000語: カバレッジ 90%
- 英単語露出: 800-1,200語/章
- 学習効果: 圧倒的
```

### ユーザー体験の革新

1. **即座の実感**: 読書開始直後から大量英単語シャワー
2. **継続的成長**: レベルアップによる新鮮さ維持
3. **個別最適化**: 習熟度に応じた辞書自動推薦

### 技術的メリット

1. **一定メモリ使用**: 60MB 固定でメモリ管理が容易
2. **高いカバレッジ**: 実用的なテキストの 90%以上をカバー
3. **スケーラブル**: 新分野の辞書を 60MB 制限で追加可能

## 🎯 成功指標

### 技術指標

- **カバレッジ**: 各レベルで対象分野の 90%以上
- **メモリ効率**: 60MB±5%以内
- **応答速度**: 変換処理 100ms 以内

### 学習効果指標

- **英単語露出量**: 従来の 5-10 倍増加
- **継続率**: レベル推薦による学習継続率向上
- **満足度**: ユーザー評価 4.5/5.0 以上

### ビジネス指標

- **利用時間**: セッション時間の延長
- **リテンション**: 月次継続率の向上
- **成長**: 段階的辞書切り替えによるエンゲージメント増加

## 💡 将来展望

### 短期拡張（3-6 ヶ月）

- **分野特化辞書**: 医療、法律、IT 等の専門分野
- **地域特化辞書**: 関西弁、方言等の地域語彙
- **時代特化辞書**: 古典、現代語等の時代別語彙

### 中期拡張（6-12 ヶ月）

- **AI 個別化**: ユーザー読書履歴に基づく辞書カスタマイズ
- **動的辞書**: リアルタイム語彙追加・更新
- **多言語展開**: 中国語、韓国語等への適用

### 長期展望（1 年以上）

- **適応型学習**: AI による最適語彙選別
- **コミュニティ辞書**: ユーザー投稿による辞書拡充
- **言語横断**: 複数言語同時シャワー学習

## 📋 実装チェックリスト

### 辞書生成システム

- [ ] ドメイン特化スコアリング実装
- [ ] 60MB 制限最適化アルゴリズム
- [ ] カバレッジ検証システム
- [ ] 品質評価メトリクス

### 4 段階辞書作成

- [ ] 日常辞書生成
- [ ] ビジネス辞書生成
- [ ] 学術辞書生成
- [ ] 総合辞書生成

### 推薦システム

- [ ] 習熟度判定アルゴリズム
- [ ] レベル推薦ロジック
- [ ] ユーザー学習履歴管理
- [ ] 推薦 UI 実装

### 検証・最適化

- [ ] パフォーマンステスト
- [ ] カバレッジ検証
- [ ] ユーザビリティテスト
- [ ] A/B テスト実施

## 🔚 まとめ

この「60MB 辞書戦略」により、RubyLingo は真の意味での「継続的英単語シャワーシステム」となる。語彙数制限からメモリ制限への発想転換により、実用性を保ちながら学習効果を最大化できる。

**核心価値**: 「どのレベルでも最大シャワー効果」を実現し、ユーザーの成長に応じて継続的な学習体験を提供する革新的辞書システム。
