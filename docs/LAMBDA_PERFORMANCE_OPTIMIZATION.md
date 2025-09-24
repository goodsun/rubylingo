# Lambda パフォーマンス最適化ガイド

## 現在の問題点

Lambda での API 応答が遅い主な原因：

1. **Cold Start による初期化遅延**
   - Lambda 関数の初回起動時に時間がかかる
   - 83.4MB の大きな辞書ファイル読み込み

2. **メモリ不足**
   - 1024MB では辞書読み込みが遅い

3. **毎回の辞書読み込み**
   - リクエストごとに辞書を読み込んでいた

## 実装した最適化

### 1. メモリ増強
```yaml
# serverless.yml
provider:
  memorySize: 2048  # 1024MB → 2048MB
```

**効果:**
- CPU 性能も向上（メモリに比例）
- 辞書読み込み速度 2-3倍高速化
- Cold Start 時間短縮

### 2. 遅延初期化 (Lazy Loading)
```javascript
// src/index.js
// Lambda では辞書を初回リクエスト時のみ読み込み
async function ensureDictionaryLoaded() {
  if (process.env.NODE_ENV === "production" && !dictionaryManager.isLoaded) {
    dictionaryManager.preloadDictionaries();
  }
}
```

**効果:**
- Cold Start 時間短縮
- 必要時のみ辞書読み込み
- ヘルスチェック等は高速応答

### 3. Keep Warm 機能
```yaml
# serverless.yml
events:
  - schedule:
      rate: rate(4 minutes)  # 4分ごとに ping
      enabled: true
      input:
        warmer: true
```

**効果:**
- Cold Start の発生頻度減少
- 常にウォームアップ状態を維持
- 実ユーザーの待機時間短縮

### 4. パフォーマンス監視
```javascript
// レスポンスに性能指標を追加
result.performance = {
  conversion_time: convertDuration,
  total_request_time: totalDuration,
  dictionary_loaded: dictionaryManager.isLoaded
};
```

## 期待される改善効果

### Cold Start 時
- **変更前:** 10-15秒（辞書読み込み含む）
- **変更後:** 3-5秒（初期化のみ、辞書は後で読み込み）

### Warm Start 時
- **変更前:** 2-3秒
- **変更後:** 200-500ms

### 辞書読み込み時間
- **1024MB:** 5-8秒
- **2048MB:** 2-3秒

## 追加の最適化案

### 1. Lambda Provisioned Concurrency
```yaml
# serverless.yml
functions:
  app:
    provisionedConcurrency: 1  # 常に1インスタンスを温めておく
```

**コスト:** 月額 $13-15
**効果:** Cold Start 完全排除

### 2. 辞書のS3移行 + キャッシュ
```javascript
// 辞書をS3に配置し、Lambda内でキャッシュ
// /tmp ディレクトリ活用（512MB利用可能）
```

### 3. 辞書の分割・圧縮
- 頻出語彙のみ先行読み込み
- gzip圧縮でサイズ削減
- 段階的読み込み

### 4. Edge 最適化
```yaml
# CloudFront + Lambda@Edge
# ユーザーに近いエッジで処理
```

## モニタリングコマンド

```bash
# CloudWatch ログ確認
aws logs filter-log-events \
  --log-group-name '/aws/lambda/rubylingo-api-v1-app' \
  --filter-pattern 'Duration'

# パフォーマンス測定
curl -X POST https://your-api-gateway-url/v1/api/convert \
  -H "Content-Type: application/json" \
  -d '{"text":"こんにちは世界"}' \
  -w "Total time: %{time_total}s\n"
```

## 費用対効果

| 最適化 | 月額コスト | 速度改善 | 実装難易度 |
|--------|------------|----------|------------|
| メモリ増強 | +$5-10 | 2-3倍 | 簡単 |
| Keep Warm | +$1-2 | Cold Start 削減 | 簡単 |
| Provisioned Concurrency | +$13-15 | Cold Start 完全排除 | 中程度 |
| 辞書最適化 | $0 | 2-5倍 | 高 |

## 実装状況

- ✅ メモリ増強 (1024MB → 2048MB)
- ✅ 遅延初期化実装
- ✅ Keep Warm 機能追加
- ✅ パフォーマンス監視追加
- ⏳ Provisioned Concurrency（オプション）
- ⏳ 辞書最適化（将来検討）

## デプロイ後の確認

```bash
# デプロイ
npm run deploy

# 性能測定
time curl -X POST https://your-api/v1/api/convert \
  -H "Content-Type: application/json" \
  -d '{"text":"テスト文章"}'
```