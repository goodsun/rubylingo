const fs = require('fs');
const path = require('path');

class DictionaryManager {
  constructor() {
    this.dictionaries = {};
    this.dictionaryPath = path.join(__dirname, '..', '..', 'dictionaries');
    this.loadedLevels = new Set();
  }

  /**
   * Load dictionary for specified level
   * @param {string} level - Dictionary level (basic, business, academic, comprehensive)
   */
  loadDictionary(level) {
    if (this.loadedLevels.has(level)) {
      return;
    }

    const filePath = path.join(this.dictionaryPath, `${level}.json`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Dictionary file not found: ${filePath}`);
    }

    console.log(`📚 Loading ${level} dictionary...`);
    const content = fs.readFileSync(filePath, 'utf8');
    this.dictionaries[level] = JSON.parse(content);
    this.loadedLevels.add(level);
    
    const wordCount = Object.keys(this.dictionaries[level]).length;
    console.log(`✅ Loaded ${wordCount.toLocaleString()} words from ${level} dictionary`);
  }

  /**
   * Ensure dictionary is loaded
   * @param {string} level 
   */
  ensureDictionaryLoaded(level) {
    if (!this.loadedLevels.has(level)) {
      this.loadDictionary(level);
    }
  }

  /**
   * Look up word in dictionary
   * @param {string} word - Word to look up
   * @param {string} level - Dictionary level
   * @returns {Object|null} Dictionary entry or null
   */
  lookup(word, level = 'basic') {
    this.ensureDictionaryLoaded(level);
    
    const dictionary = this.dictionaries[level];
    if (!dictionary) {
      return null;
    }

    // Direct lookup
    if (dictionary[word]) {
      return dictionary[word];
    }

    // Try normalized forms
    const normalized = this.normalizeWord(word);
    if (normalized !== word && dictionary[normalized]) {
      return dictionary[normalized];
    }

    return null;
  }

  /**
   * Get translation for word
   * @param {string} word - Word to translate
   * @param {string} level - Dictionary level
   * @returns {string|null} Primary translation or null
   */
  getTranslation(word, level = 'basic') {
    const entry = this.lookup(word, level);
    return entry ? entry.translation : null;
  }

  /**
   * Get all translations for word
   * @param {string} word - Word to translate
   * @param {string} level - Dictionary level
   * @returns {Array} Array of translations
   */
  getAllTranslations(word, level = 'basic') {
    const entry = this.lookup(word, level);
    return entry ? entry.translations || [entry.translation] : [];
  }

  /**
   * Check if word exists in dictionary
   * @param {string} word - Word to check
   * @param {string} level - Dictionary level
   * @returns {boolean} True if word exists
   */
  hasWord(word, level = 'basic') {
    return this.lookup(word, level) !== null;
  }

  /**
   * Normalize word for lookup
   * @param {string} word - Word to normalize
   * @returns {string} Normalized word
   */
  normalizeWord(word) {
    // Remove common suffixes for better matching
    const suffixes = ['する', 'ます', 'です', 'だ', 'である'];
    
    for (const suffix of suffixes) {
      if (word.endsWith(suffix) && word.length > suffix.length) {
        return word.slice(0, -suffix.length);
      }
    }
    
    return word;
  }

  /**
   * Get dictionary statistics
   * @param {string} level - Dictionary level
   * @returns {Object} Statistics object
   */
  getStats(level = 'basic') {
    this.ensureDictionaryLoaded(level);
    
    const dictionary = this.dictionaries[level];
    const words = Object.keys(dictionary);
    
    return {
      level: level,
      totalWords: words.length,
      memoryUsage: JSON.stringify(dictionary).length,
      loadTime: Date.now()
    };
  }

  /**
   * Get available dictionary levels
   * @returns {Array} Array of available levels
   */
  getAvailableLevels() {
    const levels = [];
    const levelNames = ['basic', 'business', 'academic', 'comprehensive'];
    
    for (const level of levelNames) {
      const filePath = path.join(this.dictionaryPath, `${level}.json`);
      if (fs.existsSync(filePath)) {
        levels.push(level);
      }
    }
    
    return levels;
  }

  /**
   * Preload multiple dictionary levels
   * @param {Array} levels - Array of levels to preload
   */
  preloadDictionaries(levels = ['basic']) {
    console.log('🚀 Preloading dictionaries:', levels.join(', '));
    
    for (const level of levels) {
      try {
        this.loadDictionary(level);
      } catch (error) {
        console.warn(`⚠️ Failed to load ${level} dictionary:`, error.message);
      }
    }
    
    console.log('✅ Dictionary preloading complete');
  }

  /**
   * Get memory usage of loaded dictionaries
   * @returns {Object} Memory usage stats
   */
  getMemoryUsage() {
    const usage = {};
    let totalSize = 0;
    
    for (const level of this.loadedLevels) {
      const size = JSON.stringify(this.dictionaries[level]).length;
      usage[level] = {
        words: Object.keys(this.dictionaries[level]).length,
        bytes: size,
        mb: Math.round(size / 1024 / 1024 * 100) / 100
      };
      totalSize += size;
    }
    
    usage.total = {
      levels: this.loadedLevels.size,
      bytes: totalSize,
      mb: Math.round(totalSize / 1024 / 1024 * 100) / 100
    };
    
    return usage;
  }
}

module.exports = DictionaryManager;