#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

class ShowerDictionaryBuilder {
  constructor() {
    this.inputFile = path.join(__dirname, "..", "data", "JMdict_e.xml");
    this.outputDir = path.join(__dirname, "..", "dictionaries", "shower");
    this.targetSize = 60 * 1024 * 1024; // 60MB
    this.entries = [];

    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async buildShowerDictionaries() {
    console.log("💎 60MB辞書生成を開始します...");

    // Parse JMdict if not already done
    if (this.entries.length === 0) {
      await this.parseJMdict();
    }

    // Build 4 levels of shower dictionaries
    const levels = [
      { name: "daily", description: "日常辞書", target: "daily-life" },
      { name: "business", description: "ビジネス辞書", target: "business" },
      { name: "academic", description: "学術辞書", target: "academic" },
      {
        name: "comprehensive",
        description: "総合辞書",
        target: "comprehensive",
      },
    ];

    const results = {};

    for (const level of levels) {
      console.log(`\n🚿 ${level.description}を生成中...`);
      const dictionary = this.build60MBDictionary(level.target);

      const outputPath = path.join(this.outputDir, `${level.name}.json`);
      fs.writeFileSync(
        outputPath,
        JSON.stringify(dictionary.data, null, 2),
        "utf8"
      );

      results[level.name] = {
        ...dictionary.stats,
        filePath: outputPath,
        description: level.description,
      };

      console.log(`✅ ${level.description}完成:`);
      console.log(
        `   語彙数: ${dictionary.stats.wordCount.toLocaleString()}語`
      );
      console.log(
        `   サイズ: ${
          Math.round((dictionary.stats.actualSize / 1024 / 1024) * 10) / 10
        }MB`
      );
      console.log(`   効率: ${Math.round(dictionary.stats.efficiency * 100)}%`);
    }

    // Generate metadata
    this.generateMetadata(results);

    console.log("\n🎉 全辞書生成完了!");
    this.printSummary(results);
  }

  async parseJMdict() {
    console.log("📖 JMdict解析中...");

    if (!fs.existsSync(this.inputFile)) {
      throw new Error(`JMdictファイルが見つかりません: ${this.inputFile}`);
    }

    const xmlContent = fs.readFileSync(this.inputFile, "utf8");
    const entryRegex = /<entry>(.*?)<\/entry>/gs;

    let match;
    let count = 0;

    while ((match = entryRegex.exec(xmlContent)) !== null) {
      try {
        const entry = this.parseEntry(match[1]);
        if (entry && entry.translations.length > 0) {
          this.entries.push(entry);
        }

        count++;
        if (count % 10000 === 0) {
          process.stdout.write(`\r処理中: ${count.toLocaleString()} エントリ`);
        }
      } catch (error) {
        // Skip problematic entries
      }
    }

    console.log(
      `\n✅ ${this.entries.length.toLocaleString()} エントリ解析完了`
    );
  }

  parseEntry(entryXml) {
    const kanjiMatches = [...entryXml.matchAll(/<keb>(.*?)<\/keb>/g)];
    const kanjiForms = kanjiMatches.map((m) => m[1]);

    const readingMatches = [...entryXml.matchAll(/<reb>(.*?)<\/reb>/g)];
    const readings = readingMatches.map((m) => m[1]);

    const glossMatches = [...entryXml.matchAll(/<gloss.*?>(.*?)<\/gloss>/g)];
    const translations = glossMatches
      .map((m) => m[1].trim())
      .filter((t) => t.length > 0);

    const posMatches = [...entryXml.matchAll(/<pos>&([^;]+);<\/pos>/g)];
    const partOfSpeech = posMatches.map((m) => m[1]);

    const primaryWord = kanjiForms[0] || readings[0];
    const primaryReading = readings[0];

    if (!primaryWord || translations.length === 0) {
      return null;
    }

    return {
      word: primaryWord,
      reading: primaryReading,
      kanjiForms: kanjiForms,
      readings: readings,
      translations: translations,
      primary: translations[0],
      pos: partOfSpeech,
      dailyScore: this.calculateDailyScore(
        primaryWord,
        translations,
        partOfSpeech
      ),
      businessScore: this.calculateBusinessScore(
        primaryWord,
        translations,
        partOfSpeech
      ),
      academicScore: this.calculateAcademicScore(
        primaryWord,
        translations,
        partOfSpeech
      ),
      comprehensiveScore: this.calculateComprehensiveScore(
        primaryWord,
        translations,
        partOfSpeech
      ),
    };
  }

  calculateDailyScore(word, translations, pos) {
    let score = 50;

    // 日常語彙ボーナス
    const dailyWords = [
      "人",
      "時",
      "日",
      "年",
      "月",
      "水",
      "火",
      "木",
      "金",
      "土",
      "山",
      "川",
      "田",
      "心",
      "手",
      "目",
      "口",
      "足",
      "家",
      "学校",
      "仕事",
      "友達",
      "家族",
      "料理",
      "音楽",
      "映画",
      "本",
      "新聞",
      "電話",
      "車",
      "電車",
      "朝",
      "昼",
      "夜",
      "今日",
      "明日",
      "昨日",
      "今",
      "前",
      "後",
      "上",
      "下",
      "中",
      "外",
      "近く",
      "遠く",
      "大きい",
      "小さい",
      "新しい",
      "古い",
      "良い",
      "悪い",
      "美しい",
      "面白い",
      "楽しい",
      "嬉しい",
      "悲しい",
      "する",
      "いる",
      "ある",
      "なる",
      "行く",
      "来る",
      "帰る",
      "食べる",
      "飲む",
      "見る",
      "聞く",
      "話す",
      "読む",
      "書く",
    ];

    if (dailyWords.some((w) => word.includes(w) || w.includes(word))) {
      score += 30;
    }

    // 簡単な英訳ボーナス
    if (translations.some((t) => t.length < 8 && /^[a-z]+$/.test(t))) {
      score += 25;
    }

    // 基本品詞ボーナス
    if (pos.includes("n") || pos.includes("v5") || pos.includes("adj")) {
      score += 20;
    }

    // 短い単語ボーナス（日常語は短い傾向）
    if (word.length === 1) score += 20;
    else if (word.length === 2) score += 35;
    else if (word.length === 3) score += 25;

    // ひらがな語ボーナス
    if (/^[\u3040-\u309f]+$/.test(word)) {
      score += 25;
    }

    return Math.min(100, Math.max(1, score));
  }

  calculateBusinessScore(word, translations, pos) {
    let score = 40;

    // ビジネス語彙ボーナス
    const businessWords = [
      "会議",
      "企業",
      "会社",
      "組織",
      "管理",
      "経営",
      "営業",
      "販売",
      "市場",
      "顧客",
      "利益",
      "売上",
      "費用",
      "投資",
      "資金",
      "予算",
      "計画",
      "戦略",
      "目標",
      "成果",
      "効率",
      "品質",
      "サービス",
      "商品",
      "製品",
      "開発",
      "設計",
      "生産",
      "製造",
      "技術",
      "システム",
      "データ",
      "情報",
      "分析",
      "報告",
      "提案",
      "契約",
      "取引",
      "交渉",
      "決定",
      "承認",
      "責任",
      "担当",
      "部署",
      "チーム",
      "上司",
      "部下",
      "同僚",
    ];

    if (businessWords.some((w) => word.includes(w) || w.includes(word))) {
      score += 40;
    }

    // ビジネス英訳ボーナス
    const businessEnglish = [
      "management",
      "business",
      "company",
      "market",
      "sales",
      "profit",
      "strategy",
      "plan",
      "development",
      "system",
      "data",
      "analysis",
      "report",
      "meeting",
      "team",
      "project",
    ];

    if (
      translations.some((t) =>
        businessEnglish.some((be) => t.toLowerCase().includes(be))
      )
    ) {
      score += 35;
    }

    // カタカナ語ボーナス（外来語多い）
    if (/[\u30a0-\u30ff]/.test(word)) {
      score += 20;
    }

    // 名詞・動詞重視
    if (pos.includes("n") || pos.includes("vs")) {
      score += 15;
    }

    return Math.min(100, Math.max(1, score));
  }

  calculateAcademicScore(word, translations, pos) {
    let score = 35;

    // 学術語彙ボーナス
    const academicWords = [
      "研究",
      "調査",
      "分析",
      "検討",
      "考察",
      "議論",
      "検証",
      "実験",
      "観察",
      "測定",
      "評価",
      "比較",
      "理論",
      "概念",
      "仮説",
      "方法",
      "手法",
      "技法",
      "原理",
      "法則",
      "定義",
      "分類",
      "体系",
      "文献",
      "資料",
      "文書",
      "論文",
      "報告",
      "発表",
      "学会",
      "会議",
      "討論",
      "質問",
      "回答",
      "科学",
      "技術",
      "工学",
      "医学",
      "心理",
      "社会",
      "経済",
      "政治",
      "歴史",
      "文学",
      "哲学",
    ];

    if (academicWords.some((w) => word.includes(w) || w.includes(word))) {
      score += 40;
    }

    // 学術英訳ボーナス
    const academicEnglish = [
      "research",
      "study",
      "analysis",
      "theory",
      "method",
      "concept",
      "hypothesis",
      "experiment",
      "observation",
      "evaluation",
      "comparison",
      "literature",
      "academic",
      "scientific",
      "technical",
    ];

    if (
      translations.some((t) =>
        academicEnglish.some((ae) => t.toLowerCase().includes(ae))
      )
    ) {
      score += 35;
    }

    // 長い英訳（専門的）
    if (translations.some((t) => t.length > 10)) {
      score += 20;
    }

    // 専門品詞
    if (pos.includes("n") || pos.includes("adj-na")) {
      score += 15;
    }

    // 漢字重視（学術語は漢字多い）
    if (/[\u4e00-\u9faf]/.test(word) && word.length >= 3) {
      score += 25;
    }

    return Math.min(100, Math.max(1, score));
  }

  calculateComprehensiveScore(word, translations, pos) {
    // 総合スコアは各分野のバランス
    const dailyScore = this.calculateDailyScore(word, translations, pos);
    const businessScore = this.calculateBusinessScore(word, translations, pos);
    const academicScore = this.calculateAcademicScore(word, translations, pos);

    // 最高スコアをベースに、他分野のボーナス
    const maxScore = Math.max(dailyScore, businessScore, academicScore);
    const diversity = (dailyScore + businessScore + academicScore) / 3;

    return Math.round(maxScore * 0.7 + diversity * 0.3);
  }

  build60MBDictionary(targetDomain) {
    console.log(`🎯 ${targetDomain}辞書の語彙選別中...`);

    // スコアに基づいて選別
    const scoreField = `${targetDomain}Score`;
    const scoredEntries = this.entries
      .filter((entry) => entry[scoreField] > 30) // 最低スコア
      .sort((a, b) => b[scoreField] - a[scoreField]);

    console.log(`📊 候補語彙: ${scoredEntries.length.toLocaleString()}語`);

    // 60MB制限内で辞書生成
    let dictionary = {};
    let currentSize = 0;
    let wordCount = 0;

    for (const entry of scoredEntries) {
      const entryData = {
        reading: entry.reading,
        translation: entry.primary,
        translations: entry.translations,
        pos: entry.pos,
        score: entry[scoreField],
      };

      // エントリサイズ計算
      const entrySize = this.calculateEntrySize(entry.word, entryData);

      if (currentSize + entrySize > this.targetSize) {
        break;
      }

      // メイン単語追加
      dictionary[entry.word] = entryData;
      currentSize += entrySize;
      wordCount++;

      // 読み形・漢字形も追加（スペースがあれば）
      for (const form of [...entry.kanjiForms, ...entry.readings]) {
        if (form !== entry.word && !dictionary[form]) {
          const formSize = this.calculateEntrySize(form, entryData);
          if (currentSize + formSize <= this.targetSize) {
            dictionary[form] = entryData;
            currentSize += formSize;
            wordCount++;
          }
        }
      }

      // 進捗表示
      if (wordCount % 1000 === 0) {
        const progress = Math.round((currentSize / this.targetSize) * 100);
        process.stdout.write(
          `\r進捗: ${progress}% (${wordCount.toLocaleString()}語, ${Math.round(
            currentSize / 1024 / 1024
          )}MB)`
        );
      }
    }

    console.log(`\n✅ 辞書生成完了: ${wordCount.toLocaleString()}語`);

    return {
      data: dictionary,
      stats: {
        wordCount: wordCount,
        actualSize: currentSize,
        targetSize: this.targetSize,
        efficiency: currentSize / this.targetSize,
        avgScore:
          scoredEntries
            .slice(0, wordCount)
            .reduce((sum, e) => sum + e[scoreField], 0) / wordCount,
      },
    };
  }

  calculateEntrySize(word, entryData) {
    // JSON文字列サイズを概算
    const jsonString = JSON.stringify({ [word]: entryData });
    return Buffer.byteLength(jsonString, "utf8");
  }

  generateMetadata(results) {
    const metadata = {
      generatedAt: new Date().toISOString(),
      strategy: "60MB Shower Dictionary",
      targetSize: "60MB per dictionary",
      levels: Object.keys(results),
      totalDictionaries: Object.keys(results).length,
      source: "JMdict/EDICT",
      license: "Creative Commons Attribution-ShareAlike 4.0",
      dictionaries: results,
    };

    const metadataPath = path.join(this.outputDir, "metadata.json");
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf8");

    console.log("📄 メタデータ生成完了:", metadataPath);
  }

  printSummary(results) {
    console.log("\n📊 辞書生成サマリー:");
    console.log("=".repeat(50));

    for (const [level, stats] of Object.entries(results)) {
      console.log(`\n💎 ${stats.description}:`);
      console.log(`   語彙数: ${stats.wordCount.toLocaleString()}語`);
      console.log(
        `   サイズ: ${
          Math.round((stats.actualSize / 1024 / 1024) * 10) / 10
        }MB / 60MB`
      );
      console.log(`   効率: ${Math.round(stats.efficiency * 100)}%`);
      console.log(`   平均スコア: ${Math.round(stats.avgScore)}`);
      console.log(`   ファイル: ${path.basename(stats.filePath)}`);
    }

    console.log("\n🎉 全ての辞書が60MB制限内で生成されました！");
    console.log("各辞書は対象分野で最大のシャワー効果を発揮します。");
  }
}

// CLI usage
if (require.main === module) {
  const builder = new ShowerDictionaryBuilder();

  builder
    .buildShowerDictionaries()
    .then(() => {
      console.log("\n🚀 辞書システム準備完了!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ エラー:", err.message);
      process.exit(1);
    });
}

module.exports = ShowerDictionaryBuilder;
