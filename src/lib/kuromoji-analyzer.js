const kuromoji = require('kuromoji');
const path = require('path');

class KuromojiAnalyzer {
  constructor(dictionaryManager) {
    this.dictionary = dictionaryManager;
    this.tokenizer = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * Initialize kuromoji tokenizer
   * @returns {Promise} Initialization promise
   */
  async initialize() {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      console.log('🔧 Initializing Kuromoji tokenizer...');
      const startTime = Date.now();
      
      // Use built-in dictionary path - kuromoji comes with dict
      kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' })
        .build((err, tokenizer) => {
          if (err) {
            console.error('❌ Kuromoji initialization failed:', err);
            this.initPromise = null;
            reject(err);
          } else {
            this.tokenizer = tokenizer;
            this.isInitialized = true;
            const duration = Date.now() - startTime;
            console.log(`✅ Kuromoji tokenizer initialized in ${duration}ms`);
            resolve();
          }
        });
    });

    return this.initPromise;
  }

  /**
   * Analyze text and return tokens with translations
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Analysis result
   */
  async analyze(text) {
    const startTime = Date.now();
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.tokenizer) {
      throw new Error('Kuromoji tokenizer not initialized');
    }
    
    // Tokenize with Kuromoji
    const tokens = this.tokenizer.tokenize(text);
    
    // Process tokens and add translations
    const processedTokens = [];
    let currentPosition = 0;
    
    for (const token of tokens) {
      // Calculate token position in text
      const tokenStart = text.indexOf(token.surface_form, currentPosition);
      const tokenEnd = tokenStart + token.surface_form.length;
      
      // Skip punctuation and particles
      if (this.isPunctuation(token.surface_form) || !this.isTargetToken(token)) {
        currentPosition = tokenEnd;
        continue;
      }
      
      // Look up in dictionary (try multiple forms)
      let entry = null;
      
      // Try basic form first (most reliable)
      if (token.basic_form && token.basic_form !== '*') {
        entry = this.dictionary.lookupWithReading(token.basic_form);
      }
      
      // Try surface form if basic form lookup failed
      if (!entry && token.surface_form !== token.basic_form) {
        entry = this.dictionary.lookupWithReading(token.surface_form);
      }
      
      // Skip expensive reading lookup for now due to performance
      // TODO: Implement efficient reading-based lookup with indexed dictionary
      // if (!entry && token.reading && token.reading !== '*') {
      //   const hiraganaReading = this.katakanaToHiragana(token.reading);
      //   entry = this.dictionary.lookupByReading(hiraganaReading);
      // }
      
      if (entry && entry.translation) {
        processedTokens.push({
          word: token.surface_form,
          reading: token.reading || token.surface_form,
          translation: entry.translation,
          translations: entry.translations || [entry.translation],
          pos: token.pos_detail_1 ? [token.pos_detail_1] : [],
          basic_form: token.basic_form || token.surface_form,
          start: tokenStart,
          end: tokenEnd,
          // Additional kuromoji-specific data
          pos_detail: [token.pos_detail_1, token.pos_detail_2, token.pos_detail_3].filter(x => x && x !== '*'),
          conjugation_type: token.conjugated_type !== '*' ? token.conjugated_type : null,
          conjugation_form: token.conjugated_form !== '*' ? token.conjugated_form : null
        });
      }
      
      currentPosition = tokenEnd;
    }

    const processingTime = Date.now() - startTime;
    
    return {
      tokens: processedTokens,
      processingTime: processingTime,
      originalTokens: tokens.length,
      convertedTokens: processedTokens.length,
      conversionRate: tokens.length > 0 ? (processedTokens.length / tokens.length) : 0,
      // Additional metadata for debugging
      allTokens: tokens.map((token, index) => {
        let position = 0;
        for (let i = 0; i < index; i++) {
          position += tokens[i].surface_form.length;
        }
        return {
          surface: token.surface_form,
          reading: token.reading,
          pos: token.pos,
          basic_form: token.basic_form,
          isTarget: this.isTargetToken(token),
          isPunctuation: this.isPunctuation(token.surface_form),
          start: position,
          end: position + token.surface_form.length
        };
      })
    };
  }

  /**
   * Check if token is punctuation
   * @param {string} surface - Token surface
   * @returns {boolean} True if punctuation
   */
  isPunctuation(surface) {
    return /^[、。！？…\s\u3000\.,!?\-「」『』（）【】\[\]]+$/.test(surface);
  }

  /**
   * Check if token should be translated
   * @param {Object} token - Kuromoji token
   * @returns {boolean} True if should be translated
   */
  isTargetToken(token) {
    // Skip very short tokens
    if (token.surface_form.length < 2) return false;
    
    // Include nouns, verbs, adjectives, adverbs
    const targetPOS = ['名詞', '動詞', '形容詞', '副詞', '連体詞'];
    
    // Check main POS
    if (targetPOS.includes(token.pos)) return true;
    
    // Check detailed POS for specific noun types
    if (token.pos === '名詞') {
      const excludedTypes = ['助数詞', '非自立', '代名詞', '数'];
      return !excludedTypes.includes(token.pos_detail_1);
    }
    
    return false;
  }

  /**
   * Convert katakana to hiragana for dictionary lookup
   * @param {string} katakana - Katakana string
   * @returns {string} Hiragana string
   */
  katakanaToHiragana(katakana) {
    return katakana.replace(/[\u30A1-\u30F6]/g, function(match) {
      const char = match.charCodeAt(0) - 0x60;
      return String.fromCharCode(char);
    });
  }

  /**
   * Convert to ruby HTML format
   * @param {string} text - Original text
   * @returns {Promise<Object>} Conversion result
   */
  async convertToRuby(text) {
    const analysisStart = Date.now();
    const analysis = await this.analyze(text);
    const analysisTime = Date.now() - analysisStart;

    const conversionStart = Date.now();
    
    // Build ruby HTML
    let result = '';
    let lastIndex = 0;
    const tokens = analysis.tokens;

    // Sort tokens by position to handle overlaps
    const sortedTokens = tokens.sort((a, b) => a.start - b.start);

    for (const token of sortedTokens) {
      const startPos = token.start;
      const endPos = token.end;

      // Add text before this token
      if (startPos > lastIndex) {
        result += text.slice(lastIndex, startPos);
      }

      // Add ruby tag
      result += `<ruby>${token.word}<rt>${token.translation}</rt></ruby>`;
      lastIndex = endPos;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      result += text.slice(lastIndex);
    }

    const conversionTime = Date.now() - conversionStart;
    const totalTime = Date.now() - analysisStart;

    return {
      original: text,
      converted: result,
      stats: {
        total_characters: text.length,
        converted_words: tokens.length,
        conversion_rate: Math.round((tokens.length / analysis.originalTokens) * 100) + '%',
        processing_time: totalTime
      },
      performance: {
        analysis_time: analysisTime,
        conversion_time: conversionTime,
        total_time: totalTime
      },
      debug: {
        original_tokens: analysis.originalTokens,
        target_tokens: analysis.allTokens.filter(t => t.isTarget).length,
        translated_tokens: tokens.length
      }
    };
  }

  /**
   * Get detailed analysis (for /api/analyze endpoint)
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Detailed analysis
   */
  async getDetailedAnalysis(text) {
    const analysis = await this.analyze(text);
    
    return {
      tokens: analysis.tokens,
      processingTime: analysis.processingTime,
      originalTokens: analysis.originalTokens,
      convertedTokens: analysis.convertedTokens,
      conversionRate: analysis.conversionRate,
      text: text,
      stats: {
        totalCharacters: text.length,
        totalTokens: analysis.originalTokens,
        targetTokens: analysis.allTokens.filter(t => t.isTarget).length,
        translatedTokens: analysis.convertedTokens,
        conversionRate: Math.round(analysis.conversionRate * 100) + '%'
      },
      allTokens: analysis.allTokens
    };
  }

  /**
   * Get analyzer status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      analyzer: {
        type: 'Kuromoji + EDICT',
        version: '1.0.0',
        dictionary_loaded: this.dictionary.isLoaded,
        tokenizer_loaded: this.isInitialized,
        total_words: this.dictionary.isLoaded ? Object.keys(this.dictionary.dictionary).length : 0
      }
    };
  }
}

module.exports = KuromojiAnalyzer;