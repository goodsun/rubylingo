const kuromoji = require('kuromoji');
const path = require('path');

class MorphologicalAnalyzer {
  constructor(dictionaryManager) {
    this.dictionary = dictionaryManager;
    this.tokenizer = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Initialize kuromoji tokenizer
   * @returns {Promise} Initialization promise
   */
  async initialize() {
    if (this.isInitialized) {
      return this.tokenizer;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    console.log('🔧 Initializing kuromoji...');
    
    this.initializationPromise = new Promise((resolve, reject) => {
      kuromoji.builder({
        dicPath: path.join(__dirname, '..', '..', 'node_modules', 'kuromoji', 'dict')
      }).build((err, tokenizer) => {
        if (err) {
          console.error('❌ Kuromoji initialization failed:', err);
          reject(err);
        } else {
          this.tokenizer = tokenizer;
          this.isInitialized = true;
          console.log('✅ Kuromoji initialized successfully');
          resolve(tokenizer);
        }
      });
    });

    return this.initializationPromise;
  }

  /**
   * Analyze text and return tokens with translations
   * @param {string} text - Text to analyze
   * @param {string} dictionaryLevel - Dictionary level to use
   * @returns {Promise<Array>} Array of analyzed tokens
   */
  async analyze(text, dictionaryLevel = 'basic') {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    
    // Tokenize with kuromoji
    const tokens = this.tokenizer.tokenize(text);
    
    // Process tokens and add translations
    const processedTokens = [];
    
    for (const token of tokens) {
      if (this.isTargetWord(token)) {
        const translation = this.dictionary.getTranslation(
          token.surface_form, 
          dictionaryLevel
        );
        
        if (translation) {
          processedTokens.push({
            word: token.surface_form,
            reading: token.reading || token.surface_form,
            translation: translation,
            pos: token.pos,
            pos_detail_1: token.pos_detail_1,
            basic_form: token.basic_form,
            start: token.word_position - 1, // Convert to 0-based index
            end: token.word_position - 1 + token.surface_form.length
          });
        }
      }
    }

    const processingTime = Date.now() - startTime;
    
    return {
      tokens: processedTokens,
      processingTime: processingTime,
      originalTokens: tokens.length,
      convertedTokens: processedTokens.length,
      conversionRate: tokens.length > 0 ? (processedTokens.length / tokens.length) : 0
    };
  }

  /**
   * Check if token should be processed for translation
   * @param {Object} token - Kuromoji token
   * @returns {boolean} True if token should be processed
   */
  isTargetWord(token) {
    const pos = token.pos;
    const surface = token.surface_form;
    
    // Target parts of speech
    const targetPos = ['名詞', '動詞', '形容詞', '副詞'];
    
    if (!targetPos.includes(pos)) {
      return false;
    }
    
    // Skip very short words (likely particles/suffixes)
    if (surface.length < 2) {
      return false;
    }
    
    // Skip pure hiragana particles and common words
    const skipPatterns = [
      /^[あいうえおかがきぎくぐけげこごさざしじすずせぜそぞただちぢつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもやゆよらりるれろわをん]+$/,
      /^[、。！？\s]+$/
    ];
    
    for (const pattern of skipPatterns) {
      if (pattern.test(surface)) {
        return false;
      }
    }
    
    // Skip numbers and symbols
    if (/^[\d\.\,\-\+\*\/\=]+$/.test(surface)) {
      return false;
    }
    
    return true;
  }

  /**
   * Get detailed token information
   * @param {string} text - Text to analyze
   * @param {string} dictionaryLevel - Dictionary level
   * @returns {Promise<Object>} Detailed analysis result
   */
  async getDetailedAnalysis(text, dictionaryLevel = 'basic') {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const result = await this.analyze(text, dictionaryLevel);
    const tokens = this.tokenizer.tokenize(text);
    
    return {
      ...result,
      text: text,
      dictionaryLevel: dictionaryLevel,
      stats: {
        totalCharacters: text.length,
        totalTokens: tokens.length,
        targetTokens: tokens.filter(t => this.isTargetWord(t)).length,
        translatedTokens: result.tokens.length,
        conversionRate: Math.round(result.conversionRate * 100) + '%'
      },
      allTokens: tokens.map(token => ({
        surface: token.surface_form,
        reading: token.reading,
        pos: token.pos,
        pos_detail: token.pos_detail_1,
        basic_form: token.basic_form,
        isTarget: this.isTargetWord(token)
      }))
    };
  }

  /**
   * Convert text to ruby HTML
   * @param {string} text - Text to convert
   * @param {string} dictionaryLevel - Dictionary level
   * @returns {Promise<Object>} Conversion result with HTML
   */
  async convertToRuby(text, dictionaryLevel = 'basic') {
    const analysis = await this.analyze(text, dictionaryLevel);
    
    let result = '';
    let lastIndex = 0;
    
    // Sort tokens by position to ensure proper text reconstruction
    const sortedTokens = analysis.tokens.sort((a, b) => a.start - b.start);
    
    for (const token of sortedTokens) {
      // Add text before this token
      if (token.start > lastIndex) {
        result += text.slice(lastIndex, token.start);
      }
      
      // Add ruby element without color class
      result += `<ruby>${token.word}<rt>${token.translation}</rt></ruby>`;
      
      lastIndex = token.end;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      result += text.slice(lastIndex);
    }
    
    return {
      original: text,
      converted: result,
      stats: {
        total_characters: text.length,
        converted_words: analysis.tokens.length,
        conversion_rate: Math.round(analysis.conversionRate * 100) + '%',
        processing_time: analysis.processingTime
      }
    };
  }

  /**
   * Get analyzer status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      hasTokenizer: this.tokenizer !== null,
      dictionaryLevels: this.dictionary.getAvailableLevels(),
      memoryUsage: this.dictionary.getMemoryUsage()
    };
  }
}

module.exports = MorphologicalAnalyzer;