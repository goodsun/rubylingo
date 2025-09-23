# RubyLingo プロトタイプ 使用方法

> **注意**: このプロトタイプは旧バージョン（Kuromoji + IPA辞書）用です。
> 現在のAPIサーバーは **EDICT/JMdict + TinySegmenter** ベースに更新されています。
> 最新の技術仕様は `/docs/edict-dictionary-integration.md` を参照してください。

## 🚀 クイックスタート

### 1. アイコンの準備
```bash
# ブラウザでアイコンジェネレーターを開く
open icons/icon-template.html

# 表示された各アイコンを右クリック→「画像として保存」
# 以下のファイル名で icons/ フォルダに保存:
# - icon16.png
# - icon48.png  
# - icon128.png
# - icon16_off.png
# - icon48_off.png
# - icon128_off.png
```

### 2. Chrome拡張機能として読み込み
1. Chromeを開く
2. アドレスバーに `chrome://extensions/` を入力
3. 右上の「デベロッパーモード」をON
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. このプロジェクトのフォルダ（rubylingo）を選択

### 3. 動作確認
1. 日本語のWebサイトにアクセス（例: https://www.yahoo.co.jp/）
2. 自動的に日本語にルビが表示される
3. 拡張機能アイコンをクリックでON/OFF切り替え

## 📁 ファイル構成

```
rubylingo/
├── manifest.json         # 拡張機能の設定
├── content.js           # メイン処理（ルビ挿入）
├── dictionary.js        # 英訳辞書（約300語）
├── background.js        # 状態管理
├── popup.html          # ポップアップUI
├── popup.js            # ポップアップ制御
├── popup.css           # ポップアップスタイル
└── icons/              # アイコンフォルダ
    └── icon-template.html  # アイコン生成ツール
```

## 🔧 プロトタイプの特徴

### 実装済み機能
- ✅ 日本語テキストの自動検出
- ✅ 基本的な単語への英訳ルビ挿入
- ✅ ON/OFF切り替え（アイコンクリック or ポップアップ）
- ✅ 動的コンテンツ対応（Ajax等で追加されたテキストも処理）
- ✅ 主要な日本語単語300語以上の辞書

### 簡略化した部分
- 形態素解析は簡易版（助詞での区切りのみ）
- 辞書は静的（基本語彙のみ）
- カスタマイズ機能なし
- 除外サイト設定なし

## 🧪 テストサイト例

以下のサイトで動作確認できます：
- Yahoo! Japan: https://www.yahoo.co.jp/
- NHK NEWS WEB: https://www3.nhk.or.jp/news/
- 日本経済新聞: https://www.nikkei.com/
- Wikipedia日本語版: https://ja.wikipedia.org/

## 🐛 既知の制限事項

1. **辞書の制限**: 約300語のみ対応
2. **形態素解析**: 助詞での簡易分割のみ
3. **パフォーマンス**: 大量テキストページで遅延の可能性
4. **レイアウト**: 一部サイトでルビ表示が崩れる場合あり

## 📝 デバッグ方法

問題が発生した場合：
1. `chrome://extensions/` で拡張機能の「エラー」を確認
2. 該当ページで右クリック→「検証」→「Console」タブでエラー確認
3. `background.js`のログは拡張機能の「Service Worker」をクリックして確認

## 🚦 次のステップ

プロトタイプから製品版への改善案：
- kuromoji.jsによる本格的な形態素解析
- 辞書の拡充（5000語以上）
- パフォーマンス最適化
- 除外サイト設定機能
- ルビサイズのカスタマイズ

---

**注意**: これはプロトタイプです。実際の使用では辞書の精度やパフォーマンスに制限があります。