const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'RubyLingo API'
  });
});

// Convert endpoint (placeholder)
app.post('/api/convert', async (req, res) => {
  try {
    const { text, dictionary = 'basic', format = 'html' } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'INVALID_INPUT', 
          message: 'テキストが必要です' 
        }
      });
    }

    // Placeholder response
    res.json({
      success: true,
      data: {
        original: text,
        converted: `<ruby>${text}<rt>placeholder</rt></ruby>`,
        stats: {
          total_characters: text.length,
          converted_words: 1,
          conversion_rate: '100%',
          processing_time: 50
        }
      }
    });
    
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'CONVERSION_FAILED', 
        message: '変換処理でエラーが発生しました' 
      }
    });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export for Lambda or local server
const port = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  module.exports.handler = serverless(app);
} else {
  app.listen(port, () => {
    console.log(`RubyLingo API running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
  });
}