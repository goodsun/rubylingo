# AWS Lambda デプロイメント ガイド

## 前提条件

1. AWS CLIがインストールされていること
2. AWS認証情報が設定されていること (`aws configure`)
3. Node.js 18.x以上がインストールされていること

## デプロイ手順

### 1. 初回セットアップ

```bash
# Serverless Frameworkのインストール（グローバル）
npm install -g serverless

# 依存関係のインストール
npm install
```

### 2. 辞書の準備

```bash
# シャワー辞書が存在しない場合は生成
npm run build-shower-dictionaries
```

### 3. デプロイ

#### 自動デプロイ（推奨）

```bash
# 本番環境へのデプロイ
./deploy.sh
```

#### 手動デプロイ

```bash
# 開発環境へのデプロイ
npm run deploy:dev

# 本番環境へのデプロイ
npm run deploy:prod
```

### 4. ローカルテスト

```bash
# Serverless Offlineでローカル実行
npm run offline
```

## 設定詳細

### serverless.yml

- **リージョン**: ap-northeast-1 (東京)
- **メモリ**: 1024MB
- **タイムアウト**: 30秒
- **ランタイム**: Node.js 18.x

### パッケージング

以下のファイルは自動的に除外されます：
- 開発用辞書（基礎、ビジネス、学術、総合）
- スクリプトファイル
- ドキュメント
- テストファイル
- 生データ

シャワー辞書（60MB）のみが含まれます。

## エンドポイント

デプロイ後、以下のエンドポイントが利用可能になります：

- `GET /api/health` - ヘルスチェック
- `POST /api/convert` - テキスト変換
- `POST /api/analyze` - 詳細解析
- `GET /api/status` - システムステータス

## トラブルシューティング

### デプロイエラー

1. **認証エラー**: `aws configure` で認証情報を設定
2. **権限エラー**: IAMユーザーに必要な権限を付与
   - Lambda関数の作成/更新
   - API Gatewayの作成/更新
   - CloudFormationスタックの作成/更新
   - S3バケットの作成/アクセス

### パフォーマンス問題

1. **初回起動が遅い**: コールドスタート対策として、定期的なウォームアップを検討
2. **メモリ不足**: serverless.ymlでメモリサイズを増加

## 料金目安

- **Lambda**: 100万リクエスト/月で約$20
- **API Gateway**: 100万リクエスト/月で約$3.50
- **合計**: 月額約$25（100万リクエスト時）

※ 東京リージョンの料金を基準