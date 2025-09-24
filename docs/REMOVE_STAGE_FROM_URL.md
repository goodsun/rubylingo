# API Gateway URL からステージ削除ガイド

## 現在の状況
- 現在: `https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/production/`
- 希望: `https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/`

## 実現方法

### オプション 1: ステージ名短縮 (推奨・簡単)

**設定変更:**
```yaml
provider:
  stage: ${opt:stage, 'v1'}  # /production → /v1
```

**結果URL:**
```
https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/
```

**メリット:**
- 設定変更のみで実現可能
- デプロイが簡単
- 既存コードへの影響なし

### オプション 2: API Gateway Base Path Mapping (高度)

**制限:**
- カスタムドメインが必要
- より複雑な設定

**設定:**
```yaml
provider:
  apiGateway:
    domainName: your-domain.com
    basePath: ''  # 空のパス
```

### オプション 3: CloudFormation カスタムリソース (上級者向け)

完全にステージを削除するには、API Gateway のベースパスマッピングをカスタムリソースで設定する必要があります。

**例:**
```yaml
resources:
  Resources:
    ApiGatewayBasePathMapping:
      Type: AWS::ApiGateway::BasePathMapping
      Properties:
        DomainName: !Ref CustomDomainName
        RestApiId: !Ref ApiGatewayRestApi
        Stage: !Ref ApiGatewayStage
        BasePath: ''
```

## 現在の実装での変更

### 1. ステージ名を短縮
```yaml
# serverless.yml
provider:
  stage: v1  # production → v1
```

### 2. デプロイ
```bash
npm run deploy
```

### 3. 結果
```
新しいURL: https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/
```

## config.js の更新

フロントエンドのAPI設定も更新が必要：

```javascript
// src/public/config.js
window.API_BASE_URL = 'https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1';
```

## 完全にステージを削除する方法

AWS CLI で手動設定 (上級者向け):

```bash
# 1. カスタムドメイン作成
aws apigateway create-domain-name \
  --domain-name api.example.com \
  --certificate-arn arn:aws:acm:region:account:certificate/cert-id

# 2. ベースパスマッピング作成
aws apigateway create-base-path-mapping \
  --domain-name api.example.com \
  --rest-api-id YOUR_API_ID \
  --stage production \
  --base-path ''
```

## 推奨実装

**段階的アプローチ:**

1. **短期:** ステージ名を短縮 (`/v1`)
2. **中期:** カスタムドメイン導入
3. **長期:** 完全なステージ削除

## 注意事項

- 既存のURLブックマークは無効になる
- API クライアントのURL更新が必要
- DNS 設定変更（カスタムドメイン使用時）

## テスト手順

```bash
# デプロイ
npm run deploy

# 新しいURLでテスト
curl https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/api/health

# フロントエンドテスト
open https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/v1/
```

## まとめ

完全にステージを削除 (`/production` → `/`) するには：
- カスタムドメインが必要
- または複雑なAPI Gateway設定

**推奨:** ステージ名短縮 (`/production` → `/v1`) で十分な改善効果