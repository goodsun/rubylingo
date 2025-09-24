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
  
  const requestStart = Date.now();
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
    const convertStart = Date.now();
    const result = await analyzer.convertToRuby(text);
    const convertDuration = Date.now() - convertStart;
    const totalDuration = Date.now() - requestStart;

    // Add performance metrics to response
    result.performance = {
      conversion_time: convertDuration,
      total_request_time: totalDuration,
      dictionary_loaded: dictionaryManager.isLoaded
    };

    console.log(`🔄 Conversion completed: ${convertDuration}ms (total: ${totalDuration}ms)`);

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

// Lambda-optimized initialization
let isInitialized = false;
let initPromise = null;

async function initializeSystem() {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const startTime = Date.now();
      console.log("🚀 Initializing RubyLingo system...");

      // Initialize analyzer first (lightweight)
      await analyzer.initialize();

      // Only preload dictionary on first request for Lambda (lazy loading)
      if (process.env.NODE_ENV !== "production") {
        dictionaryManager.preloadDictionaries();
      }

      const duration = Date.now() - startTime;
      console.log(`✅ RubyLingo system initialized successfully in ${duration}ms`);
      isInitialized = true;
    } catch (error) {
      console.error("❌ System initialization failed:", error);
      initPromise = null; // Reset promise to allow retry
      throw error;
    }
  })();

  return initPromise;
}

// Ensure dictionary is loaded for Lambda requests
async function ensureDictionaryLoaded() {
  if (process.env.NODE_ENV === "production" && !dictionaryManager.isLoaded) {
    const startTime = Date.now();
    console.log("📚 Loading dictionary on-demand...");
    dictionaryManager.preloadDictionaries();
    const duration = Date.now() - startTime;
    console.log(`✅ Dictionary loaded in ${duration}ms`);
  }
}

if (process.env.NODE_ENV === "production") {
  // Lambda handler with lazy initialization
  const lambdaHandler = async (event, context) => {
    // Handle warmer events to keep Lambda warm
    if (event.warmer) {
      console.log('🔥 Warmer ping - keeping Lambda warm');
      await initializeSystem(); // Ensure system is initialized
      return { statusCode: 200, body: 'Warmer ping' };
    }

    // Initialize system if not already done
    await initializeSystem();
    
    // Ensure dictionary is loaded for conversion requests
    if (event.path && (event.path.includes('/convert') || event.path.includes('/analyze'))) {
      await ensureDictionaryLoaded();
    }
    
    return serverless(app)(event, context);
  };
  
  module.exports.handler = lambdaHandler;
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
