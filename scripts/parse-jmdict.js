#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

class JMdictParser {
  constructor() {
    this.inputFile = path.join(__dirname, "..", "data", "JMdict_e.xml");
    this.outputDir = path.join(__dirname, "..", "dictionaries");
    this.entries = [];
    this.stats = {
      totalEntries: 0,
      processedEntries: 0,
      errors: 0,
    };
  }

  async parse() {
    console.log(" JMdict XML解析を開始します...");

    if (!fs.existsSync(this.inputFile)) {
      throw new Error(`JMdictファイルが見つかりません: ${this.inputFile}`);
    }

    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    console.log("📖 XMLファイル読み込み中...");
    const xmlContent = fs.readFileSync(this.inputFile, "utf8");

    console.log("🔍 エントリ解析中...");
    await this.parseEntries(xmlContent);

    console.log("📊 統計情報:");
    console.log(`  総エントリ数: ${this.stats.totalEntries.toLocaleString()}`);
    console.log(`  処理済み: ${this.stats.processedEntries.toLocaleString()}`);
    console.log(`  エラー: ${this.stats.errors}`);

    console.log("📚 辞書ファイル生成中...");
    await this.generateDictionaries();

    console.log("✅ JMdict解析完了");
  }

  parseEntries(xmlContent) {
    // Simple regex-based parsing for better performance
    const entryRegex = /<entry>(.*?)<\/entry>/gs;
    const kebRegex = /<keb>(.*?)<\/keb>/g;
    const rebRegex = /<reb>(.*?)<\/reb>/g;
    const glossRegex = /<gloss.*?>(.*?)<\/gloss>/g;
    const posRegex = /<pos>&([^;]+);<\/pos>/g;

    let match;
    let entryCount = 0;

    while ((match = entryRegex.exec(xmlContent)) !== null) {
      try {
        const entryXml = match[1];
        const entry = this.parseEntry(entryXml);

        if (entry && entry.translations.length > 0) {
          this.entries.push(entry);
          this.stats.processedEntries++;
        }

        entryCount++;

        if (entryCount % 10000 === 0) {
          process.stdout.write(
            `\r処理中: ${entryCount.toLocaleString()} エントリ`
          );
        }
      } catch (error) {
        this.stats.errors++;
        if (this.stats.errors < 10) {
          console.warn("解析エラー:", error.message);
        }
      }
    }

    this.stats.totalEntries = entryCount;
    console.log(`\n✅ ${entryCount.toLocaleString()} エントリ解析完了`);
  }

  parseEntry(entryXml) {
    // Extract kanji forms
    const kanjiMatches = [...entryXml.matchAll(/<keb>(.*?)<\/keb>/g)];
    const kanjiForms = kanjiMatches.map((m) => m[1]);

    // Extract reading forms
    const readingMatches = [...entryXml.matchAll(/<reb>(.*?)<\/reb>/g)];
    const readings = readingMatches.map((m) => m[1]);

    // Extract glosses (English translations)
    const glossMatches = [...entryXml.matchAll(/<gloss.*?>(.*?)<\/gloss>/g)];
    const translations = glossMatches
      .map((m) => m[1].trim())
      .filter((t) => t.length > 0);

    // Extract part of speech
    const posMatches = [...entryXml.matchAll(/<pos>&([^;]+);<\/pos>/g)];
    const partOfSpeech = posMatches.map((m) => m[1]);

    // Determine primary word form
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
      frequency: this.estimateFrequency(primaryWord, translations),
    };
  }

  estimateFrequency(word, translations) {
    // Improved frequency estimation
    let score = 50; // Base score

    // Prioritize common kanji words
    if (/[\u4e00-\u9faf]/.test(word)) {
      score += 25; // Contains kanji - likely important
    }

    // Word length scoring (adjusted)
    if (word.length === 1) score += 15;
    else if (word.length === 2) score += 30; // Most common word length
    else if (word.length === 3) score += 20;
    else if (word.length === 4) score += 10;
    else if (word.length > 4) score -= 5;

    // Translation quality indicators
    if (translations.some((t) => t.length < 10)) score += 20;
    if (translations.length === 1) score += 15; // Single meaning = basic word
    if (translations.some((t) => /^[a-z]+$/.test(t))) score += 10; // Simple English word

    // Hiragana-only words
    if (/^[\u3040-\u309f]+$/.test(word)) {
      if (word.length <= 3) score += 30; // Short hiragana words are common
      else score += 10;
    }

    // Common word patterns
    const commonKanji = [
      "人",
      "日",
      "本",
      "国",
      "時",
      "年",
      "手",
      "目",
      "心",
      "水",
      "火",
      "金",
      "木",
      "土",
      "山",
      "川",
      "田",
    ];
    if (commonKanji.some((k) => word.includes(k))) score += 20;

    // Business/academic common words
    const businessWords = [
      "会議",
      "重要",
      "戦略",
      "企業",
      "経済",
      "技術",
      "開発",
      "管理",
      "営業",
      "販売",
    ];
    if (businessWords.includes(word)) score += 40;

    // Basic verbs and adjectives
    const basicWords = [
      "する",
      "ある",
      "いる",
      "なる",
      "言う",
      "思う",
      "見る",
      "来る",
      "行く",
      "出る",
      "入る",
      "大きい",
      "小さい",
      "新しい",
      "古い",
      "良い",
      "悪い",
      "高い",
      "安い",
    ];
    if (basicWords.includes(word)) score += 35;

    // Avoid symbols and marks
    if (/[ゝゞ]/.test(word)) score = 5; // Repetition marks are rare

    return Math.min(100, Math.max(1, score));
  }

  async generateDictionaries() {
    // Sort by estimated frequency
    const sortedEntries = this.entries.sort(
      (a, b) => b.frequency - a.frequency
    );

    console.log("📊 レベル別辞書生成:");

    // Generate level-based dictionaries
    const levels = {
      basic: { size: 5000, description: "基礎語彙" },
      business: { size: 10000, description: "ビジネス語彙" },
      academic: { size: 20000, description: "学術語彙" },
      comprehensive: { size: 50000, description: "総合語彙" },
    };

    for (const [level, config] of Object.entries(levels)) {
      const entries = sortedEntries.slice(0, config.size);
      const dictionary = this.createDictionary(entries);

      const outputPath = path.join(this.outputDir, `${level}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(dictionary, null, 2), "utf8");

      console.log(
        `  ${level}: ${entries.length.toLocaleString()}語 -> ${outputPath}`
      );
    }

    // Generate metadata
    const metadata = {
      generatedAt: new Date().toISOString(),
      totalEntries: this.stats.processedEntries,
      levels: Object.keys(levels),
      source: "JMdict/EDICT",
      license: "Creative Commons Attribution-ShareAlike 4.0",
    };

    fs.writeFileSync(
      path.join(this.outputDir, "metadata.json"),
      JSON.stringify(metadata, null, 2),
      "utf8"
    );

    console.log("📄 メタデータ生成完了");
  }

  createDictionary(entries) {
    const dictionary = {};

    entries.forEach((entry) => {
      // Add primary word
      dictionary[entry.word] = {
        reading: entry.reading,
        translation: entry.primary,
        translations: entry.translations,
        pos: entry.pos,
        frequency: entry.frequency,
      };

      // Add alternative kanji forms
      entry.kanjiForms.forEach((kanji) => {
        if (kanji !== entry.word && !dictionary[kanji]) {
          dictionary[kanji] = {
            reading: entry.reading,
            translation: entry.primary,
            translations: entry.translations,
            pos: entry.pos,
            frequency: entry.frequency,
          };
        }
      });

      // Add reading forms for hiragana/katakana lookup
      entry.readings.forEach((reading) => {
        if (reading !== entry.word && !dictionary[reading]) {
          dictionary[reading] = {
            reading: reading,
            translation: entry.primary,
            translations: entry.translations,
            pos: entry.pos,
            frequency: entry.frequency,
          };
        }
      });
    });

    return dictionary;
  }
}

// CLI usage
if (require.main === module) {
  const parser = new JMdictParser();

  parser
    .parse()
    .then(() => {
      console.log("🎉 辞書生成完了!");

      // Show generated files
      const files = fs.readdirSync(parser.outputDir);
      console.log("📁 生成されたファイル:");
      files.forEach((file) => {
        const filepath = path.join(parser.outputDir, file);
        const stats = fs.statSync(filepath);
        console.log(`  ${file} (${Math.round(stats.size / 1024)}KB)`);
      });
    })
    .catch((err) => {
      console.error("❌ エラー:", err.message);
      process.exit(1);
    });
}

module.exports = JMdictParser;
