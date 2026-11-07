# Claude Code サブエージェント (Ghosts)

このリポジトリ専用の役割別エージェントです。メインのClaudeが必要に応じて委任します。

| 名前 | モデル | 役割 |
|---|---|---|
| pwa-implementer | sonnet | index.html / sw.js / api の実装・修正 |
| privacy-security-auditor | sonnet | XSS・Firestoreルール・E2EE・秘密情報・消滅の実効性を読み取り監査 |
| ui-checker | haiku | iPhone表示・PWA要件・リンク切れの静的点検 |
| deploy-checker | haiku | push前後の構文/秘密情報/バージョン/影響範囲チェック |

## 並列で頼む例

> privacy-security-auditor と ui-checker と deploy-checker を並列で動かして、結果を重要度順にまとめて。

> privacy-security-auditor の指摘のうち [高] を pwa-implementer に直させて、終わったら deploy-checker で確認して。

注意: 監査・点検系は読み取り専用です。秘密の値は報告やコミットに含めません。
