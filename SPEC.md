# Ghosts — 仕様書

消えゆく会話のためのプライバシー・メッセージングアプリ。
メッセージごとに「寿命」を設定でき、期限が来ると両者の画面とサーバーから消える。

- 公開URL: https://antelopetomita-byte.github.io/ghosts/
- リポジトリ: antelopetomita-byte/ghosts（GitHub Pages / main / ルート index.html）
- 構成: 単一 index.html（HTML/CSS/JS）＋ Firebase（Authentication / Cloud Firestore）
- ビルド表記: 設定画面下部に `build` を表示

---

## コンセプト
「消えるチャット」を全体一括ではなく、**1通ごとに寿命を選べる**ことを核にしたメッセージアプリ。
ブランド: void black `#07080b` ＋ spectral emerald `#2fe7a8`。粒子化（dissolve）を象徴モチーフに使用。

## メッセージの寿命（TTL）
残す / 既読後 / 10秒 / 1分 / 10分 / 1時間 / 24時間 / 7日。
- 期限が来るとドキュメントごと削除し、全クライアントで粒子化して消滅。
- 「既読後」: DMは相手が読んだら、グループは**全員が読んだら**消滅。

## アカウント / 認証
- 匿名ログインで即利用開始。
- ニックネーム＋自分で決めるGhost ID＋パスワードを設定すると、匿名アカウントを永続化（`linkWithCredential`）。
- 別端末ではログインで同じIDに復帰（メール形式 `ghost_xxx@ghosts.app` を内部利用）。
- プロフィール画像（アイコン）を写真/画像に設定可能（端末側で160px正方形に圧縮し保存。招待・連絡先経由で相手にも反映）。

## つながり（招待制）
- ID検索による無断追加はなし。招待リンク `?invite=token` / QR / 貼り付け承認で接続。
- 承認すると双方向の接続が成立し、会話が可能に。招待リンクは作り直して無効化できる。

## チャット
- Firestoreのリアルタイム同期（`onSnapshot`）。
- テキスト / 画像メッセージ。画像は端末側で最大1280px・JPEGに圧縮し、約600KB以下でFirestoreに格納（Storage不使用）。画像はインライン表示＋タップで全画面。
- 既読: DMは「既読＋時刻」、グループは「既読N（誰が読んだか一覧）」。
- 未読バッジ: 会話ごとの未読件数を一覧に表示。開くと0にリセット。
- メッセージ長押し: 自分の発言は「全員から削除（取り消し送信）」、テキストは「コピー」。
- 入力中インジケータ: 相手が入力中の間「入力中…」を表示。
- リンクの自動リンク化、日付の区切り表示。

## グループチャット
- 接続済みの連絡先から複数人を選んで作成。
- メンバー一覧 / メンバー追加 / 退出。送信者名を表示。寿命・既読・未読・画像・長押し削除すべて対応。
- 一覧は `groups` を `members array-contains uid` で購読して取得。

## データモデル（Firestore）
- `users/{uid}` { ghostId, nickname, avatar, inviteToken, createdAt }
  - `contacts/{peerUid}` { ghostId, nickname, avatar, lastText, lastTs, unread }
- `invites/{token}` { from, ghostId, nickname, avatar, active }
- `connections/{convId}` { members[2], typingAt }   ※convId = 2者のuidをソート連結
- `groups/{gid}` { name, owner, members[], lastText, lastTs, unread{uid:n}, typingAt }
- `chats/{conv}/messages/{id}` { from, fromName, text, type, img, w, h, ttl, ts, createdAt, expireAt, readBy{uid:ts} }

## セキュリティルール（要点）
- `users`: 本人のみ読み書き。`contacts`: 本人、または接続済みの相手が自分の連絡先エントリを書ける。
- `invites`: 作成者が管理、トークン保持者が読める。
- `connections`: 2名のメンバーのみ。`groups`: メンバーが読む/更新、作成者が作成/削除。
- `chats/{conv}/messages`: その会話の接続メンバー、またはグループメンバーのみ読み書き。

## 既知の制限（正直な記載）
- E2EE: **DMのテキストはエンドツーエンド暗号化**（ECDH P-256で端末ごとに鍵生成、共有鍵AES-GCMで暗号化。サーバーは平文を保持せず、一覧プレビューも「🔒 メッセージ」）。相手の公開鍵が未取得の既存接続では自動的に平文へフォールバック。**画像・グループ・は今後**E2EE化予定。秘密鍵は端末のlocalStorageにのみ保存（端末を変えると過去の暗号文は読めない）。
- タイマー削除はクライアント駆動のベストエフォート（確実なサーバー側TTLにはCloud Functions=有料が必要）。
- 通話（音声/ビデオ）は未実装。1:1はWebRTC＋Firestoreシグナリングで将来的に可能だが、iOS Webの制約あり。

## 今後
- エンドツーエンド暗号化の本実装
- 通知（iOS Webは制約あり・要Service Worker）
- 1:1通話、画像の保存、閲覧回数制限 など
