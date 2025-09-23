# RubyLingo アーカイブ

## chrome-extension-prototype/
Chrome拡張機能のプロトタイプ実装。

### 含まれるファイル
- manifest.json - Chrome拡張機能設定
- content.js - ページ内ルビ表示処理
- background.js - バックグラウンド処理
- popup.html/js/css - 拡張機能UI
- dictionary.js - 基本辞書（300語）
- dictionaries/ - レベル別辞書（TOEIC 500/700/900）
- icons/ - アイコン生成ツール
- PROTOTYPE_USAGE.md - 使用方法

### 開発状況
基本的なルビ表示機能は動作するが、以下の理由で開発を一時停止：

1. **MVP戦略変更**: Chrome拡張機能 → API優先開発
2. **シンプル化**: 複雑な辞書切り替え機能よりもAPI完成を優先
3. **応用拡張性**: API完成後に拡張機能含む様々な実装が可能

### 今後の計画
API完成後に、このプロトタイプをベースとした本格的なChrome拡張機能を開発予定。