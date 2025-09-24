# RubyLingo API 仕様書

## 概要

RubyLingo APIは、日本語テキストに英訳ルビを自動挿入するサービスです。EDICT/JMdict辞書とTinySegmenterを使用して、高精度な形態素解析と翻訳を提供します。

## 基本情報

| 項目 | 値 |
|------|-----|
| **Base URL** | `https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1` |
| **プロトコル** | HTTPS |
| **データ形式** | JSON |
| **文字エンコーディング** | UTF-8 |
| **レート制限** | なし（現在） |
| **認証** | 不要 |

## 共通仕様

### リクエストヘッダー

```http
Content-Type: application/json
```

### レスポンス形式

#### 成功レスポンス
```json
{
  "success": true,
  "data": {
    // エンドポイント固有のデータ
  }
}
```

#### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### HTTPステータスコード

| コード | 意味 | 説明 |
|--------|------|------|
| 200 | OK | 成功 |
| 400 | Bad Request | 不正なリクエスト |
| 500 | Internal Server Error | サーバー内部エラー |

## エンドポイント一覧

### 1. ヘルスチェック

システムの稼働状況を確認します。

**エンドポイント:** `GET /api/health`

#### リクエスト

```http
GET /api/health
```

#### レスポンス

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "service": "RubyLingo API"
  }
}
```

#### 例

```bash
curl -X GET https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/api/health
```

### 2. テキスト変換

日本語テキストに英訳ルビを挿入します。

**エンドポイント:** `POST /api/convert`

#### リクエスト

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 | 制限 |
|------------|----|----|------|------|
| `text` | string | ✅ | 変換する日本語テキスト | 最大10,000文字 |
| `format` | string | ❌ | 出力形式（デフォルト: "html"） | "html" |

**リクエストボディ:**

```json
{
  "text": "今日は良い天気です。",
  "format": "html"
}
```

#### レスポンス

```json
{
  "success": true,
  "data": {
    "original": "今日は良い天気です。",
    "converted": "<ruby>今日<rt>today</rt></ruby>は<ruby>良い<rt>good</rt></ruby><ruby>天気<rt>weather</rt></ruby>です。",
    "stats": {
      "total_characters": 9,
      "converted_words": 3,
      "conversion_rate": "67%",
      "processing_time": 150
    },
    "performance": {
      "conversion_time": 120,
      "total_request_time": 150,
      "dictionary_loaded": true
    }
  }
}
```

#### 例

```bash
curl -X POST https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "text": "こんにちは世界",
    "format": "html"
  }'
```

#### エラー

**不正な入力:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "テキストが必要です"
  }
}
```

**テキスト長すぎ:**
```json
{
  "success": false,
  "error": {
    "code": "TEXT_TOO_LONG",
    "message": "テキストが長すぎます（最大10,000文字）"
  }
}
```

### 3. 詳細解析

テキストの詳細な形態素解析結果を取得します。

**エンドポイント:** `POST /api/analyze`

#### リクエスト

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 | 制限 |
|------------|----|----|------|------|
| `text` | string | ✅ | 解析する日本語テキスト | 最大10,000文字 |

**リクエストボディ:**

```json
{
  "text": "美しい桜が咲いています。"
}
```

#### レスポンス

```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "word": "美しい",
        "reading": "うつくしい",
        "translation": "beautiful",
        "pos": ["adjective"],
        "start": 0,
        "end": 3
      },
      {
        "word": "桜",
        "reading": "さくら",
        "translation": "cherry blossom",
        "pos": ["noun"],
        "start": 3,
        "end": 4
      }
    ],
    "total_tokens": 2,
    "analysis_time": 45
  }
}
```

#### 例

```bash
curl -X POST https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "美しい桜が咲いています。"
  }'
```

### 4. システム状態

システムの詳細な状態情報を取得します。

**エンドポイント:** `GET /api/status`

#### リクエスト

```http
GET /api/status
```

#### レスポンス

```json
{
  "success": true,
  "data": {
    "analyzer": {
      "type": "EDICT",
      "version": "1.0.0",
      "dictionary_loaded": true,
      "total_words": 360949
    },
    "uptime": 3600.5,
    "nodeVersion": "v18.19.0",
    "memoryUsage": {
      "rss": 157286400,
      "heapTotal": 134217728,
      "heapUsed": 98765432,
      "external": 12345678,
      "arrayBuffers": 1234567
    },
    "attribution": {
      "dictionary": {
        "name": "JMdict/EDICT",
        "copyright": "© Electronic Dictionary Research and Development Group (EDRDG)",
        "license": "Creative Commons Attribution-ShareAlike 4.0 International",
        "source": "http://www.edrdg.org/jmdict/j_jmdict.html"
      },
      "software": {
        "name": "RubyLingo",
        "license": "MIT",
        "repository": "https://github.com/goodsun/rubylingo"
      }
    }
  }
}
```

#### 例

```bash
curl -X GET https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/api/status
```

### 5. 辞書情報

利用可能な辞書の情報を取得します。

**エンドポイント:** `GET /api/dictionaries`

#### リクエスト

```http
GET /api/dictionaries
```

#### レスポンス

```json
{
  "success": true,
  "data": {
    "dictionaries": [
      {
        "value": "unified",
        "label": "EDICT統合辞書",
        "wordCount": "360,000",
        "description": "JMdict/EDICT統合辞書（全語彙）"
      }
    ]
  }
}
```

#### 例

```bash
curl -X GET https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/api/dictionaries
```

## エラーコード一覧

| コード | HTTPステータス | 説明 | 対処法 |
|--------|---------------|------|--------|
| `INVALID_INPUT` | 400 | 必須パラメータが不正または不足 | リクエストパラメータを確認 |
| `TEXT_TOO_LONG` | 400 | テキストが最大文字数を超過 | テキストを10,000文字以下に短縮 |
| `CONVERSION_FAILED` | 500 | テキスト変換処理でエラー | しばらく待ってから再試行 |
| `ANALYSIS_FAILED` | 500 | 形態素解析処理でエラー | しばらく待ってから再試行 |
| `STATUS_FAILED` | 500 | システム状態取得でエラー | システム管理者に連絡 |
| `DICTIONARIES_FAILED` | 500 | 辞書情報取得でエラー | システム管理者に連絡 |

## 使用例

### JavaScript (Fetch API)

```javascript
// テキスト変換
const convertText = async (text) => {
  try {
    const response = await fetch('https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        format: 'html'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('変換結果:', result.data.converted);
      console.log('処理時間:', result.data.performance.total_request_time + 'ms');
    } else {
      console.error('エラー:', result.error);
    }
  } catch (error) {
    console.error('通信エラー:', error);
  }
};

convertText('今日は良い天気です。');
```

### Python (requests)

```python
import requests
import json

def convert_text(text):
    url = 'https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/api/convert'
    headers = {'Content-Type': 'application/json'}
    data = {
        'text': text,
        'format': 'html'
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        result = response.json()
        
        if result['success']:
            print(f"変換結果: {result['data']['converted']}")
            print(f"処理時間: {result['data']['performance']['total_request_time']}ms")
        else:
            print(f"エラー: {result['error']}")
            
    except requests.exceptions.RequestException as e:
        print(f"通信エラー: {e}")

convert_text('今日は良い天気です。')
```

### cURL

```bash
# ヘルスチェック
curl -X GET https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/api/health

# テキスト変換
curl -X POST https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "text": "今日は良い天気です。",
    "format": "html"
  }'

# 詳細解析
curl -X POST https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "美しい桜が咲いています。"
  }'
```

## パフォーマンス

### レスポンス時間

| 処理 | 通常時 | Cold Start時 |
|------|--------|--------------|
| ヘルスチェック | 50-100ms | 3-5秒 |
| テキスト変換 | 200-500ms | 3-8秒 |
| 詳細解析 | 100-300ms | 3-6秒 |
| システム状態 | 50-150ms | 3-5秒 |

### 制限事項

- **テキスト長**: 最大10,000文字
- **同時接続**: 制限なし（現在）
- **レート制限**: なし（現在）
- **ファイルアップロード**: 未対応

## セキュリティ

### CORS設定

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### HTTPS

全ての通信はHTTPS/TLS 1.2以上で暗号化されています。

## ライセンス

### ソフトウェア
- **ライセンス**: MIT License
- **リポジトリ**: https://github.com/goodsun/rubylingo

### 辞書データ
- **名前**: JMdict/EDICT
- **著作権**: © Electronic Dictionary Research and Development Group (EDRDG)
- **ライセンス**: Creative Commons Attribution-ShareAlike 4.0 International
- **出典**: http://www.edrdg.org/jmdict/j_jmdict.html

## サポート

### 技術サポート
- **Issue Tracker**: https://github.com/goodsun/rubylingo/issues
- **ドキュメント**: https://github.com/goodsun/rubylingo/tree/master/docs

### 利用規約
このAPIは研究・教育・個人利用目的で自由にご利用いただけます。商用利用の場合は事前にご相談ください。

---

**最終更新**: 2024年1月15日  
**API バージョン**: v1  
**ドキュメント バージョン**: 1.0.0