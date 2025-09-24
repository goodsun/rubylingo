# デプロイメントガイド

## 現在の推奨デプロイ方法

### 1. 本番デプロイ
```bash
npm run deploy
```

### 2. デプロイ情報確認
```bash
npm run deploy:info
```

## 新しいURL構成

### 現在のURL
```
https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/
```

**主要エンドポイント:**
- Health Check: `/api/health`
- Convert API: `/api/convert`
- Status: `/api/status`
- Frontend: `/` (root)

## デプロイ前チェックリスト

### 1. 依存関係確認
```bash
npm install
```

### 2. ローカルテスト
```bash
npm run dev
# http://localhost:3000 でテスト
```

### 3. AWS認証確認
```bash
aws sts get-caller-identity
```

## パフォーマンス最適化設定

現在のserverless.yml設定:
- **Memory**: 2048MB (高速化)
- **Timeout**: 30秒
- **Stage**: v1 (短縮URL)
- **Keep Warm**: 4分間隔で自動ping

## デプロイ後確認手順

### 1. ヘルスチェック
```bash
curl https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/api/health
```

### 2. 変換APIテスト
```bash
curl -X POST https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/api/convert \
  -H "Content-Type: application/json" \
  -d '{"text":"こんにちは世界"}'
```

### 3. フロントエンドアクセス
```
https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/
```

## パフォーマンス監視

デプロイ後、レスポンスに含まれる性能指標を確認:
```json
{
  "success": true,
  "data": {
    "converted": "...",
    "performance": {
      "conversion_time": 250,
      "total_request_time": 300,
      "dictionary_loaded": true
    }
  }
}
```

## 廃止されたファイル

### ❌ deploy.sh (削除済み)
**理由:**
- 古い `/production` ステージを使用
- 古いAPI形式（辞書パラメータ）
- `npm run deploy` で十分

## トラブルシューティング

### デプロイエラー
```bash
# 依存関係再インストール
rm -rf node_modules package-lock.json
npm install

# 再デプロイ
npm run deploy
```

### 403エラー (AWS認証)
```bash
aws configure
# または
export AWS_PROFILE=your-profile
```

### Cold Start遅延
- Keep Warm機能により4分間隔で自動改善
- 初回アクセス時のみ3-5秒の遅延

## コスト概算

| 項目 | 月額コスト |
|------|------------|
| Lambda実行 | ~$5-10 |
| API Gateway | ~$2-5 |
| Keep Warm | ~$1-2 |
| **合計** | **~$8-17** |

## 次のステップ

1. **カスタムドメイン検討**
   - `api.rubylingo.com` の設定
   - SSL証明書の取得

2. **Provisioned Concurrency (オプション)**
   - Cold Start完全排除
   - 月額 +$13-15

3. **辞書最適化**
   - 分割読み込み
   - 圧縮・キャッシュ

## まとめ

- ✅ `npm run deploy` を使用
- ✅ `deploy.sh` は削除済み
- ✅ `/v1` ステージで短縮URL
- ✅ パフォーマンス最適化済み
- ✅ Keep Warm機能でCold Start削減