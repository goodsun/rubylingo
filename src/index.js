const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const path = require("path");

// Import our modules
const DictionaryManager = require("./lib/dictionary");
const EdictAnalyzer = require("./lib/edict-analyzer");

const app = express();

// Initialize components
const dictionaryManager = new DictionaryManager();
const analyzer = new EdictAnalyzer(dictionaryManager);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "RubyLingo API",
  });
});

// OPTIONS handler for CORS preflight
app.options('/api/convert', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// Convert endpoint (real implementation)
app.post('/api/convert', async (req, res) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  try {
    const { text, format = "html" } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "テキストが必要です",
        },
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        success: false,
        error: {
          code: "TEXT_TOO_LONG",
          message: "テキストが長すぎます（最大10,000文字）",
        },
      });
    }

    // Convert text using real morphological analysis
    const result = await analyzer.convertToRuby(text);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Conversion error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "CONVERSION_FAILED",
        message: "変換処理でエラーが発生しました: " + error.message,
      },
    });
  }
});

// Detailed analysis endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "テキストが必要です",
        },
      });
    }

    const analysis = await analyzer.getDetailedAnalysis(text);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "ANALYSIS_FAILED",
        message: "解析処理でエラーが発生しました: " + error.message,
      },
    });
  }
});

// System status endpoint
app.get("/api/status", (req, res) => {
  try {
    const status = analyzer.getStatus();

    res.json({
      success: true,
      data: {
        ...status,
        uptime: process.uptime(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        attribution: {
          dictionary: {
            name: "JMdict/EDICT",
            copyright:
              "© Electronic Dictionary Research and Development Group (EDRDG)",
            license:
              "Creative Commons Attribution-ShareAlike 4.0 International",
            source: "http://www.edrdg.org/jmdict/j_jmdict.html",
          },
          software: {
            name: "RubyLingo",
            license: "MIT",
            repository: "https://github.com/goodsun/rubylingo",
          },
        },
      },
    });
  } catch (error) {
    console.error("Status error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "STATUS_FAILED",
        message: "ステータス取得でエラーが発生しました",
      },
    });
  }
});

// Available dictionaries endpoint
app.get('/api/dictionaries', (req, res) => {
  try {
    const availableDictionaries = [];
    
    // Check which dictionaries are actually available
    if (dictionaryManager.hasWord('テスト', 'business')) {
      availableDictionaries.push({
        value: 'business',
        label: 'ビジネス辞書',
        wordCount: '360,000'
      });
    }
    
    // For local development, check other dictionaries
    if (process.env.NODE_ENV !== 'production') {
      if (dictionaryManager.hasWord('テスト', 'basic')) {
        availableDictionaries.push({
          value: 'basic',
          label: '基礎辞書',
          wordCount: '360,000'
        });
      }
      if (dictionaryManager.hasWord('テスト', 'academic')) {
        availableDictionaries.push({
          value: 'academic',
          label: '学術辞書',
          wordCount: '340,000'
        });
      }
      if (dictionaryManager.hasWord('テスト', 'comprehensive')) {
        availableDictionaries.push({
          value: 'comprehensive',
          label: '総合辞書',
          wordCount: '355,000'
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        dictionaries: availableDictionaries
      }
    });
    
  } catch (error) {
    console.error('Dictionaries error:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'DICTIONARIES_FAILED', 
        message: '辞書リスト取得でエラーが発生しました' 
      }
    });
  }
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Export for Lambda or local server
const port = process.env.PORT || 3000;

// Initialize system on startup
async function initializeSystem() {
  try {
    console.log("🚀 Initializing RubyLingo system...");

    // Preload basic shower dictionary
    dictionaryManager.preloadDictionaries(["basic"]);

    // Initialize analyzer
    await analyzer.initialize();

    console.log("✅ RubyLingo system initialized successfully");
  } catch (error) {
    console.error("❌ System initialization failed:", error);
    throw error;
  }
}

if (process.env.NODE_ENV === "production") {
  // Lambda handler
  module.exports.handler = serverless(app);
} else {
  // Local development server
  initializeSystem()
    .then(() => {
      app.listen(port, () => {
        console.log(` RubyLingo API running on port ${port}`);
        console.log(`🔍 Health check: http://localhost:${port}/api/health`);
        console.log(`🚿 Convert API: http://localhost:${port}/api/convert`);
        console.log(`📊 Status: http://localhost:${port}/api/status`);
      });
    })
    .catch((error) => {
      console.error("Failed to start server:", error);
      process.exit(1);
    });
}
