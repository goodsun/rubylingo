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

// Common response helpers
const sendSuccess = (res, data) => {
  res.json({ success: true, data });
};

const sendError = (res, status, code, message) => {
  res.status(status).json({
    success: false,
    error: { code, message }
  });
};

// Input validation middleware
const validateTextInput = (req, res, next) => {
  const { text } = req.body;
  
  if (!text || typeof text !== "string") {
    return sendError(res, 400, "INVALID_INPUT", "テキストが必要です");
  }
  
  if (text.length > 30000) {
    return sendError(res, 400, "TEXT_TOO_LONG", "テキストが長すぎます（最大30,000文字）");
  }
  
  next();
};

// Performance tracking middleware
const trackPerformance = (req, res, next) => {
  req.startTime = Date.now();
  next();
};

// Lambda CORS headers middleware for specific endpoints
const addLambdaCorsHeaders = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
};

// Health check endpoint
app.get("/api/health", (req, res) => {
  sendSuccess(res, {
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "RubyLingo API",
  });
});

// OPTIONS handler for CORS preflight
app.options('/api/convert', addLambdaCorsHeaders, (req, res) => {
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.sendStatus(200);
});

// Convert endpoint (real implementation)
app.post('/api/convert', addLambdaCorsHeaders, trackPerformance, validateTextInput, async (req, res) => {
  try {
    const { text, format = "html" } = req.body;

    // Convert text using real morphological analysis
    const convertStart = Date.now();
    const result = await analyzer.convertToRuby(text);
    const convertDuration = Date.now() - convertStart;
    const totalDuration = Date.now() - req.startTime;

    // Add performance metrics to response
    result.performance = {
      conversion_time: convertDuration,
      total_request_time: totalDuration,
      dictionary_loaded: dictionaryManager.isLoaded
    };

    console.log(`🔄 Conversion completed: ${convertDuration}ms (total: ${totalDuration}ms)`);

    sendSuccess(res, result);
  } catch (error) {
    console.error("Conversion error:", error);
    sendError(res, 500, "CONVERSION_FAILED", "変換処理でエラーが発生しました: " + error.message);
  }
});

// Detailed analysis endpoint
app.post("/api/analyze", validateTextInput, async (req, res) => {
  try {
    const { text } = req.body;
    const analysis = await analyzer.getDetailedAnalysis(text);
    sendSuccess(res, analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    sendError(res, 500, "ANALYSIS_FAILED", "解析処理でエラーが発生しました: " + error.message);
  }
});

// System status endpoint
app.get("/api/status", (req, res) => {
  try {
    const status = analyzer.getStatus();

    const statusData = {
      ...status,
      uptime: process.uptime(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      attribution: {
        dictionary: {
          name: "JMdict/EDICT",
          copyright: "© Electronic Dictionary Research and Development Group (EDRDG)",
          license: "Creative Commons Attribution-ShareAlike 4.0 International",
          source: "http://www.edrdg.org/jmdict/j_jmdict.html",
        },
        software: {
          name: "RubyLingo",
          license: "MIT",
          repository: "https://github.com/goodsun/rubylingo",
        },
      },
    };

    sendSuccess(res, statusData);
  } catch (error) {
    console.error("Status error:", error);
    sendError(res, 500, "STATUS_FAILED", "ステータス取得でエラーが発生しました");
  }
});

// Available dictionaries endpoint (simplified for EDICT unified dictionary)
app.get('/api/dictionaries', (req, res) => {
  try {
    // Return unified dictionary info since we're using single EDICT dictionary
    const dictionaryInfo = {
      dictionaries: [{
        value: 'unified',
        label: 'EDICT統合辞書',
        wordCount: '360,000',
        description: 'JMdict/EDICT統合辞書（全語彙）'
      }]
    };
    
    sendSuccess(res, dictionaryInfo);
  } catch (error) {
    console.error('Dictionaries error:', error);
    sendError(res, 500, 'DICTIONARIES_FAILED', '辞書リスト取得でエラーが発生しました');
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
