const TinySegmenter = require('tiny-segmenter');
const path = require('path');

class EdictAnalyzer {
  constructor(dictionaryManager) {
    this.dictionary = dictionaryManager;
    this.segmenter = new TinySegmenter();
    this.isInitialized = true; // TinySegmenter doesn't need async initialization
  }

  /**
   * Initialize analyzer (compatibility method)
   * @returns {Promise} Resolved immediately since TinySegmenter doesn't need init
   */
  async initialize() {
    return Promise.resolve();
  }

  /**
   * Analyze text and return tokens with translations
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Analysis result
   */
  async analyze(text) {
    const startTime = Date.now();
    
    // Tokenize with TinySegmenter
    const segments = this.segmenter.segment(text);
    
    // Process segments and add translations
    const processedTokens = [];
    let position = 0;
    
    for (const segment of segments) {
      // Skip whitespace and punctuation
      if (segment.trim() === '' || this.isPunctuation(segment)) {
        position += segment.length;
        continue;
      }
      
      // Look up in dictionary (try exact match first)
      let entry = null;
      
      if (this.isTargetSegment(segment)) {
        // Try exact match first
        entry = this.dictionary.lookupWithReading(segment);
        
        // If no exact match, try basic form lookup
        if (!entry) {
          const basicForm = this.getBasicForm(segment);
          if (basicForm !== segment) {
            entry = this.dictionary.lookupWithReading(basicForm);
          }
        }
        
        // Special handling for compound segments
        if (!entry && segment.includes('まし')) {
          // Try splitting at まし for past tense verbs
          const parts = segment.split('まし');
          if (parts.length === 2 && parts[0]) {
            const verbForm = parts[0] + 'る';
            entry = this.dictionary.lookupWithReading(verbForm);
          }
        }
      }
      
      if (entry && entry.translation) {
        processedTokens.push({
          word: segment,
          reading: entry.reading || segment,
          translation: entry.translation,
          translations: entry.translations || [entry.translation],
          pos: entry.pos || [],
          basic_form: entry.word || segment,
          start: position,
          end: position + segment.length
        });
      }
      
      position += segment.length;
    }

    const processingTime = Date.now() - startTime;
    
    return {
      tokens: processedTokens,
      processingTime: processingTime,
      originalTokens: segments.length,
      convertedTokens: processedTokens.length,
      conversionRate: segments.length > 0 ? (processedTokens.length / segments.length) : 0
    };
  }

  /**
   * Check if segment is punctuation
   * @param {string} segment - Text segment
   * @returns {boolean} True if punctuation
   */
  isPunctuation(segment) {
    return /^[、。！？…\s\u3000\.,!?\-]+$/.test(segment);
  }

  /**
   * Check if segment should be processed
   * @param {string} segment - Text segment
   * @returns {boolean} True if should process
   */
  isTargetSegment(segment) {
    // Skip very short segments
    if (segment.length < 1) return false;
    
    // Skip pure numbers
    if (/^\d+$/.test(segment)) return false;
    
    // Skip pure ASCII (except single letters which might be abbreviations)
    if (/^[a-zA-Z]+$/.test(segment) && segment.length > 1) return false;
    
    // Skip common Japanese particles, auxiliaries, and copulas
    const skipWords = [
      // Particles
      'は', 'を', 'が', 'の', 'に', 'で', 'と', 'も', 'から', 'まで', 'より', 'へ', 'や', 'か', 'ば', 'けれど', 'けれども',
      // Auxiliary verbs and copulas that often get misidentified
      'です', 'である', 'だ', 'ます', 'ません', 'ました', 'ませんでした',
      // Common single hiragana that are often misidentified
      'し', 'て', 'た', 'く', 'に', 'ば', 'る', 'れ', 'ろ', 'う', 'え', 'お', 'い',
      // Common interjections and particles
      'な', 'ね', 'よ', 'わ', 'ぞ', 'ぜ', 'さ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ'
    ];
    if (skipWords.includes(segment)) return false;
    
    // Process everything else (kanji, hiragana, katakana, mixed)
    return true;
  }

  /**
   * Get basic form of word (simple heuristic)
   * @param {string} word - Word to convert
   * @returns {string} Basic form
   */
  getBasicForm(word) {
    // Special handling for specific words
    if (word === 'しています' || word === 'している') return 'する';
    if (word === 'います' || word === 'いる') return 'いる';
    if (word === 'あります' || word === 'ある') return 'ある';
    
    // Common verb endings (more comprehensive)
    const verbEndings = [
      // Polite forms
      { suffix: 'ませんでした', basic: '' },
      { suffix: 'ました', basic: '' },
      { suffix: 'ません', basic: '' },
      { suffix: 'ます', basic: '' },
      
      // Te-form and progressive
      { suffix: 'ている', basic: 'る' },
      { suffix: 'ていた', basic: 'る' },
      { suffix: 'てる', basic: 'る' },
      { suffix: 'て', basic: 'る' },
      
      // Past forms
      { suffix: 'なかった', basic: 'る' },
      { suffix: 'った', basic: 'う' },
      { suffix: 'いた', basic: 'く' },
      { suffix: 'んだ', basic: 'む' },
      { suffix: 'した', basic: 'す' },
      { suffix: 'た', basic: 'る' },
      
      // Negative forms
      { suffix: 'ない', basic: 'る' },
      { suffix: 'わない', basic: 'う' },
      { suffix: 'かない', basic: 'く' },
      { suffix: 'がない', basic: 'ぐ' },
      { suffix: 'さない', basic: 'す' },
      { suffix: 'たない', basic: 'つ' },
      { suffix: 'なない', basic: 'ぬ' },
      { suffix: 'ばない', basic: 'ぶ' },
      { suffix: 'まない', basic: 'む' },
      { suffix: 'らない', basic: 'る' }
    ];
    
    // Common adjective endings
    const adjEndings = [
      { suffix: 'くなかった', basic: 'い' },
      { suffix: 'かった', basic: 'い' },
      { suffix: 'くない', basic: 'い' },
      { suffix: 'くて', basic: 'い' },
      { suffix: 'く', basic: 'い' }
    ];
    
    // Try verb endings
    for (const ending of verbEndings) {
      if (word.endsWith(ending.suffix) && word.length > ending.suffix.length) {
        const stem = word.slice(0, -ending.suffix.length);
        // For specific patterns like 食べました → 食べる
        if (ending.suffix === 'ました' && stem.endsWith('べ')) {
          return stem + 'る';
        }
        return stem + ending.basic;
      }
    }
    
    // Try adjective endings
    for (const ending of adjEndings) {
      if (word.endsWith(ending.suffix) && word.length > ending.suffix.length) {
        return word.slice(0, -ending.suffix.length) + ending.basic;
      }
    }
    
    // Try removing する for suru-verbs
    if (word.endsWith('する') && word.length > 2) {
      return word.slice(0, -2);
    }
    
    return word;
  }

  /**
   * Get detailed token information
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Detailed analysis result
   */
  async getDetailedAnalysis(text) {
    const result = await this.analyze(text);
    const segments = this.segmenter.segment(text);
    
    return {
      ...result,
      text: text,
      stats: {
        totalCharacters: text.length,
        totalTokens: segments.length,
        targetTokens: segments.filter(s => this.isTargetSegment(s)).length,
        translatedTokens: result.tokens.length,
        conversionRate: Math.round(result.conversionRate * 100) + '%'
      },
      allTokens: segments.map(segment => ({
        surface: segment,
        isTarget: this.isTargetSegment(segment),
        isPunctuation: this.isPunctuation(segment)
      }))
    };
  }

  /**
   * Convert text to ruby HTML
   * @param {string} text - Text to convert
   * @returns {Promise<Object>} Conversion result with HTML
   */
  async convertToRuby(text) {
    const analysis = await this.analyze(text);
    
    let result = '';
    let lastIndex = 0;
    
    // Sort tokens by position to ensure proper text reconstruction
    const sortedTokens = analysis.tokens.sort((a, b) => a.start - b.start);
    
    for (const token of sortedTokens) {
      // Add text before this token
      if (token.start > lastIndex) {
        result += text.slice(lastIndex, token.start);
      }
      
      // Add ruby element
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
      hasTokenizer: true,
      tokenizerType: 'TinySegmenter',
      dictionaryLevels: this.dictionary.getAvailableLevels(),
      memoryUsage: this.dictionary.getMemoryUsage()
    };
  }
}

module.exports = EdictAnalyzer;