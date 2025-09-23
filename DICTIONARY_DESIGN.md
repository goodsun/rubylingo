# RubyLingo 辞書設計書 - JMdict実装版

## 概要

JMdict/EDICTオープンソース辞書を使用したRubyLingoの辞書システム設計。手作業での辞書作成を排除し、高品質な20万語レベルの辞書を実現する。

## JMdict/EDICT採用理由

### データ品質
- **20万エントリー**: 28万以上の見出し語-読み組み合わせ
- **継続メンテナンス**: 1991年開始、毎日更新
- **信頼性**: インターネット標準の日英辞書として広く使用
- **多義語対応**: 複数の翻訳候補を提供

### ライセンス適合性
- **Creative Commons Attribution-ShareAlike 4.0**
- 商用利用可能（帰属表示必要）
- 改変・再配布可能
- RubyLingoプロジェクトと完全互換

## データ構造

### JMdict XML構造
```xml
<entry>
<ent_seq>1000320</ent_seq>
<k_ele><keb>重要</keb></k_ele>
<r_ele><reb>じゅうよう</reb></r_ele>
<sense>
  <gloss>important</gloss>
  <gloss>momentous</gloss> 
  <gloss>essential</gloss>
  <pos>&adj-na;</pos>
</sense>
</entry>
```

### RubyLingo用JSON変換形式
```json
{
  "重要": {
    "reading": "じゅうよう",
    "translations": ["important", "momentous", "essential"],
    "primary": "important",
    "pos": "adj-na",
    "frequency": 95
  }
}
```

## 辞書レベル分割設計

### 頻度ベース4段階分割
1. **基礎辞書 (5,000語)**: 日常語彙 - 1日1,000-2,000語シャワー
2. **ビジネス辞書 (10,000語)**: ビジネス語彙 - 1日2,000-3,000語シャワー  
3. **学術辞書 (20,000語)**: 専門語彙 - 1日3,000-5,000語シャワー
4. **総合辞書 (50,000語)**: 全語彙 - 1日5,000語以上シャワー

### 頻度データソース
- **語彙頻度コーパス**: 新聞・ウェブテキストから算出
- **BCCWJ (Balanced Corpus of Contemporary Written Japanese)** 参照
- **手動調整**: ビジネス・学術語彙の重み付け

## 技術実装

### データパイプライン
```
JMdict XML → パーサー → 頻度分析 → レベル分割 → JSON出力
```

### 変換スクリプト設計
```javascript
// scripts/build-dictionary.js
class JMdictProcessor {
  async processXML(xmlPath) {
    const entries = await this.parseXML(xmlPath);
    const processed = this.extractTranslations(entries);
    const scored = this.addFrequencyScores(processed);
    const leveled = this.splitByLevels(scored);
    return leveled;
  }
  
  extractTranslations(entries) {
    return entries.map(entry => ({
      word: entry.keb || entry.reb,
      reading: entry.reb,
      translations: entry.senses.flatMap(s => s.glosses),
      primary: entry.senses[0].glosses[0],
      pos: entry.senses[0].pos
    }));
  }
}
```

### 辞書統合処理
```javascript
// src/lib/dictionary.js
class DictionaryManager {
  constructor() {
    this.dictionaries = {};
    this.loadDictionaries();
  }
  
  lookup(word, level = 'basic') {
    const dict = this.dictionaries[level];
    return dict[word] || dict[this.getBaseForm(word)];
  }
  
  getTranslation(word, level = 'basic') {
    const entry = this.lookup(word, level);
    return entry ? entry.primary : null;
  }
}
```

## 形態素解析統合

### kuromoji + JMdict統合
```javascript
// src/lib/analyzer.js
class MorphologicalAnalyzer {
  constructor(dictionaryManager) {
    this.dictionary = dictionaryManager;
    this.initializeKuromoji();
  }
  
  async analyze(text, dictionaryLevel) {
    const tokens = this.tokenizer.tokenize(text);
    
    return tokens.map(token => {
      const translation = this.dictionary.getTranslation(
        token.surface_form, 
        dictionaryLevel
      );
      
      return {
        word: token.surface_form,
        reading: token.reading,
        pos: token.pos,
        translation: translation
      };
    }).filter(token => token.translation && this.isTargetWord(token));
  }
  
  isTargetWord(token) {
    return ['名詞', '動詞', '形容詞', '副詞'].includes(token.pos);
  }
}
```

## パフォーマンス最適化

### メモリ効率化
- **段階的ロード**: 使用頻度に応じた辞書分割
- **圧縮JSON**: gzip圧縮で50%サイズ削減
- **キャッシュ戦略**: LRUキャッシュで高速アクセス

### 処理時間目標
- **基礎辞書**: 100ms以内
- **ビジネス辞書**: 200ms以内  
- **学術辞書**: 400ms以内
- **総合辞書**: 800ms以内

## 実装ロードマップ

### Phase 1: 基盤構築 (1週間)
1. **JMdict XMLダウンロード・解析**
2. **変換スクリプト開発**
3. **JSON辞書生成**
4. **kuromoji統合テスト**

### Phase 2: 最適化 (1週間)  
1. **頻度データ統合**
2. **レベル分割実装**
3. **パフォーマンステスト**
4. **品質評価**

### Phase 3: 統合 (1週間)
1. **Express API統合**
2. **フロントエンド接続** 
3. **エンドツーエンドテスト**
4. **本番デプロイ**

## 品質保証

### データ品質指標
- **カバレッジ**: 一般テキストの95%以上
- **精度**: 翻訳品質90%以上
- **一貫性**: 同一語の翻訳統一
- **鮮度**: 月次JMdict更新追従

### テスト戦略
```javascript
describe('JMdict Dictionary Quality', () => {
  test('基礎語彙カバレッジ', () => {
    const coverage = testBasicVocabularyCoverage();
    expect(coverage).toBeGreaterThan(0.95);
  });
  
  test('翻訳品質', () => {
    const accuracy = testTranslationAccuracy();
    expect(accuracy).toBeGreaterThan(0.90);
  });
});
```

## 運用・保守

### 更新プロセス
1. **週次**: JMdict最新版チェック
2. **月次**: 辞書データ更新・再生成
3. **四半期**: 頻度データ見直し
4. **年次**: レベル分割基準調整

### 監視指標
- **辞書ヒット率**: 単語検索成功率
- **応答時間**: 辞書参照速度
- **メモリ使用量**: 辞書サイズ効率
- **更新遅延**: JMdict同期状況

## 法的コンプライアンス

### 帰属表示要件
- **アプリ内表示**: "JMdict/EDICT dictionary"
- **ドキュメント**: EDRDG帰属明記
- **API応答**: 辞書出典情報含有
- **配布**: ライセンス文書同梱

### ライセンス遵守
- **Creative Commons Attribution-ShareAlike 4.0**準拠
- **EDRDG License Statement**完全遵守
- **改変時**: 同一ライセンス継承
- **商用利用**: 帰属表示で自由利用

## まとめ

JMdict/EDICT採用により、手作業辞書作成を完全排除し、20万語レベルの高品質辞書を即座に実現できる。オープンソースの信頼性と継続的メンテナンスにより、長期的な品質保証も確保される。

**重要利点**:
1. **開発時間短縮**: 辞書作成工数ゼロ
2. **品質保証**: 実績ある辞書データ
3. **継続更新**: 毎日の自動更新
4. **法的安全性**: 明確なライセンス