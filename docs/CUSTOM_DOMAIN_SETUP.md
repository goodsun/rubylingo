# カスタムドメイン設定ガイド

## 現在の状況
- デフォルト URL: https://wkl64b9as3.execute-api.ap-northeast-1.amazonaws.com/production/
- 希望 URL: rubylingo.execute-api.ap-northeast-1.amazonaws.com （不可能）

## なぜ execute-api ドメインをカスタマイズできないか

AWS API Gateway の `execute-api.amazonaws.com` ドメインは、AWS が自動生成するシステムドメインです。ユーザーがこのドメイン名をカスタマイズすることはできません。

## 解決案

### オプション 1: 独自ドメイン使用 (推奨)

**必要なもの:**
- 独自ドメイン (例: rubylingo.com)
- SSL証明書 (AWS Certificate Manager)

**設定手順:**

1. **ドメイン購入・設定**
   ```bash
   # Route 53 でドメインを購入するか、既存ドメインをRoute 53に移管
   ```

2. **SSL証明書作成**
   ```bash
   # AWS Certificate Manager でSSL証明書を作成
   # ap-northeast-1 リージョンで作成すること
   ```

3. **serverless.yml 設定**
   ```yaml
   provider:
     apiGateway:
       domainName: api.rubylingo.com
       certificateArn: arn:aws:acm:ap-northeast-1:ACCOUNT_ID:certificate/CERT_ID
   ```

4. **デプロイ**
   ```bash
   npm run deploy
   ```

**結果URL:** `https://api.rubylingo.com`

### オプション 2: serverless-domain-manager プラグイン

**インストール:**
```bash
npm install --save-dev serverless-domain-manager
```

**設定:**
```yaml
plugins:
  - serverless-domain-manager

custom:
  customDomain:
    domainName: api.rubylingo.com
    stage: production
    certificateName: '*.rubylingo.com'
    createRoute53Record: true
    endpointType: 'regional'
```

**セットアップ:**
```bash
# ドメイン作成
npx serverless create_domain

# デプロイ
npm run deploy
```

### オプション 3: CloudFront + カスタムドメイン

**概要:**
- CloudFront ディストリビューションを作成
- カスタムドメインを CloudFront に設定
- Origin を API Gateway に設定

**メリット:**
- キャッシュによる高速化
- 世界中での低レイテンシ
- DDoS 保護

## 現在の設定での改善案

現在のデフォルトドメインを使い続ける場合:

### API エイリアス設定
```yaml
provider:
  apiGateway:
    restApiId: !Ref ApiGatewayRestApi
    restApiRootResourceId: !GetAtt ApiGatewayRestApi.RootResourceId
```

### ステージ名変更
```yaml
# 現在: /production/
# 変更後: /
provider:
  stage: ${opt:stage, 'production'}
  apiGateway:
    shouldStartNameWithService: true
```

## 推奨実装手順

1. **短期対応:** 現在の URL をそのまま使用
2. **中期対応:** 独自ドメイン購入 + 設定
3. **長期対応:** CloudFront + CDN 最適化

## セキュリティ考慮事項

- SSL/TLS 証明書の適切な設定
- API キーまたは認証の実装検討
- CORS 設定の最適化
- レート制限の実装

## コスト考慮事項

- **独自ドメイン:** 年間 $12-50 (ドメイン代)
- **SSL証明書:** 無料 (AWS Certificate Manager)
- **Route 53:** 月額 $0.50/hosted zone + クエリ料金
- **CloudFront:** 使用量に応じて

## まとめ

`rubylingo.execute-api.ap-northeast-1.amazonaws.com` は技術的に不可能です。
代わりに `api.rubylingo.com` のような独自ドメインの使用を強く推奨します。