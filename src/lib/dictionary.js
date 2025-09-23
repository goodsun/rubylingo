const fs = require('fs');
const path = require('path');

class DictionaryManager {
  constructor() {
    this.dictionary = null;
    this.dictionaryPath = path.join(__dirname, '..', '..', 'dictionaries', 'shower');
    this.isLoaded = false;
  }

  /**
   * Load the unified EDICT dictionary
   */
  loadDictionary() {
    if (this.isLoaded) {
      return;
    }

    const filePath = path.join(this.dictionaryPath, 'business.json');
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Dictionary file not found: ${filePath}`);
    }

    console.log(`📚 Loading EDICT unified dictionary...`);
    const content = fs.readFileSync(filePath, 'utf8');
    this.dictionary = JSON.parse(content);
    this.isLoaded = true;
    
    const wordCount = Object.keys(this.dictionary).length;
    const fileSize = Math.round(fs.statSync(filePath).size / 1024 / 1024 * 10) / 10;
    console.log(`✅ Loaded ${wordCount.toLocaleString()} words from EDICT unified dictionary (${fileSize}MB)`);
  }

  /**
   * Ensure dictionary is loaded
   */
  ensureDictionaryLoaded() {
    if (!this.isLoaded) {
      this.loadDictionary();
    }
  }

  /**
   * Look up word in dictionary
   * @param {string} word - Word to look up
   * @returns {Object|null} Dictionary entry or null
   */
  lookup(word) {
    this.ensureDictionaryLoaded();
    
    if (!this.dictionary) {
      return null;
    }

    // Direct lookup
    if (this.dictionary[word]) {
      return this.dictionary[word];
    }

    // Try normalized forms
    const normalized = this.normalizeWord(word);
    if (normalized !== word && this.dictionary[normalized]) {
      return this.dictionary[normalized];
    }

    return null;
  }

  /**
   * Look up word with reading information
   * @param {string} word - Word to look up
   * @returns {Object|null} Dictionary entry with reading or null
   */
  lookupWithReading(word) {
    const entry = this.lookup(word);
    if (!entry) {
      return null;
    }

    // Return full entry with reading information
    return {
      word: word,
      reading: entry.reading || entry.readings?.[0] || word,
      translation: entry.translation || entry.primary,
      translations: entry.translations || [entry.translation || entry.primary],
      pos: entry.pos || [],
      kanjiForms: entry.kanjiForms || [word],
      readings: entry.readings || [entry.reading || word]
    };
  }

  /**
   * Get translation for word
   * @param {string} word - Word to translate
   * @returns {string|null} Primary translation or null
   */
  getTranslation(word) {
    const entry = this.lookup(word);
    return entry ? entry.translation : null;
  }

  /**
   * Get all translations for word
   * @param {string} word - Word to translate
   * @returns {Array} Array of translations
   */
  getAllTranslations(word) {
    const entry = this.lookup(word);
    return entry ? entry.translations || [entry.translation] : [];
  }

  /**
   * Check if word exists in dictionary
   * @param {string} word - Word to check
   * @returns {boolean} True if word exists
   */
  hasWord(word) {
    return this.lookup(word) !== null;
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
   * @returns {Object} Statistics object
   */
  getStats() {
    this.ensureDictionaryLoaded();
    
    if (!this.dictionary) {
      return {
        level: 'unified',
        totalWords: 0,
        memoryUsage: 0,
        loadTime: null
      };
    }
    
    const words = Object.keys(this.dictionary);
    
    return {
      level: 'unified',
      totalWords: words.length,
      memoryUsage: JSON.stringify(this.dictionary).length,
      loadTime: Date.now()
    };
  }

  /**
   * Get available dictionary levels (returns single unified level for EDICT)
   * @returns {Array} Array of available levels
   */
  getAvailableLevels() {
    const filePath = path.join(this.dictionaryPath, 'business.json');
    
    if (fs.existsSync(filePath)) {
      return ['unified'];
    }
    
    return [];
  }

  /**
   * Preload the unified dictionary
   */
  preloadDictionaries() {
    console.log('🚀 Preloading EDICT unified dictionary');
    
    try {
      this.loadDictionary();
    } catch (error) {
      console.warn(`⚠️ Failed to load unified dictionary:`, error.message);
    }
    
    console.log('✅ Dictionary preloading complete');
  }

  /**
   * Get memory usage of loaded dictionary
   * @returns {Object} Memory usage stats
   */
  getMemoryUsage() {
    if (!this.isLoaded || !this.dictionary) {
      return {
        unified: { words: 0, bytes: 0, mb: 0 },
        total: { levels: 0, bytes: 0, mb: 0 }
      };
    }
    
    const size = JSON.stringify(this.dictionary).length;
    const usage = {
      unified: {
        words: Object.keys(this.dictionary).length,
        bytes: size,
        mb: Math.round(size / 1024 / 1024 * 100) / 100
      }
    };
    
    usage.total = {
      levels: 1,
      bytes: size,
      mb: Math.round(size / 1024 / 1024 * 100) / 100
    };
    
    return usage;
  }
}

module.exports = DictionaryManager;