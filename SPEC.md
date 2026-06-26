# Ghosts — 仕様書

消えゆく会話のためのプライバシー・メッセージングアプリ。
メッセージごとに「寿命」を設定でき、期限が来ると両者の画面とサーバーから消える。

- 公開URL: https://antelopetomita-byte.github.io/ghosts/
- 使い方ガイド: https://antelopetomita-byte.github.io/ghosts/guide.html
- リポジトリ: antelopetomita-byte/ghosts（GitHub Pages / main / ルート index.html）
- 構成: 単一 index.html（HTML/CSS/JS）＋ Firebase（Authentication / Cloud Firestore）＋ Vercel（Web Push 用 API）
- ビルド表記: 設定画面下部に `build` を表示（現行 `2026.06.24j`）

---

## コンセプト
「消えるチャット」を全体一括ではなく、**1通ごとに寿命を選べる**ことを核にしたメッセージアプリ。
ブランド: void black `#07080b` ＋ spectral emerald `#2fe7a8`。粒子化（dissolve）を象徴モチーフに使用。
フォント: Space Grotesk（見出し）/ Inter（本文）/ Space Mono（データ）。

## メッセージの寿命（TTL）
残す / **既読後24h（既定）** / 既読後 / 10秒 / 30秒 / 1分 / 5分 / 10分 / 30分 / 1時間 / 6時間 / 12時間 / 24時間 / 7日。

- **既定は「既読後24h」**: 寿命を選ばずに送ると、**相手が既読にした時刻＋24時間**で消滅。既読まではずっと残る。
- 「既読後」: 相手が読んでから約5秒で消滅（DM）。グループは**全員が読んだら**消滅。
- 秒〜日の固定寿命: **送信時刻＋指定時間**で消滅。
- 期限が来るとドキュメントごと削除し、全クライアントで粒子化して消滅。
- 「既読後24h」の期限は、相手が初めて既読にした時に `expireAt` として記録され、以降は両者の画面でカウントダウン表示。

## アカウント / 認証
- 匿名ログインで即利用開始。
- ニックネーム＋自分で決めるGhost ID＋パスワードを設定すると、匿名アカウントを永続化（`linkWithCredential`）。
- 別端末ではログインで同じIDに復帰（メール形式 `ghost_xxx@ghosts.app` を内部利用）。**IDとパスワードは要保管**（紛失すると同じIDに入れない）。
- プロフィール画像（アイコン）を写真/画像に設定可能（端末側で160px正方形に圧縮し保存。招待・連絡先経由で相手にも反映）。
- 登録/ログイン画面に「📖 使い方を見る」リンク（guide.html）を表示。

## つながり（招待制）
- ID検索による無断追加はなし。招待リンク `?invite=token` / QR / 貼り付け承認で接続。
- 承認すると双方向の接続が成立し、会話が可能に。招待リンクは作り直して無効化できる。
- **連絡先の削除 / グループの退出**: 一覧で行を**長押し**→「連絡先を削除」（DM）/「グループを退出」（グループ）。DM削除時は連絡先・接続・メッセージを削除（取り消し不可）。

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

## エンドツーエンド暗号化（E2EE）
- **DMのテキスト・画像をE2EE**。ECDH P-256 で端末ごとに鍵ペアを生成、共有鍵 AES-GCM で暗号化（Web Crypto）。
- 公開鍵は `users` / 招待 / 連絡先に配布。秘密鍵は端末の localStorage（`gh_keys_v1`）にのみ保存。
- サーバーは平文を保持せず、一覧プレビューは「🔒 メッセージ」「🔒 写真」、復号失敗時は「🔒 復号できません」。
- 相手の公開鍵が未取得の既存接続では自動的に平文へフォールバック（opportunistic）。
- グループはプレーンテキスト（グループE2EEは今後）。

## 通知 / バッジ（Web Push）
- **アプリアイコンの未読バッジ**: `navigator.setAppBadge()`（iOS 16.4+、ホーム画面追加アプリで有効。開いた時に更新）。
- **プッシュ通知（クローズ時）**: Service Worker（`sw.js`）＋ VAPID。購読情報を `pushSubs/{uid}` に保存し、DM送信時に Vercel の `/api/notify` 経由で web-push 送信。
- 通知本文は内容を出さず「新しいメッセージ」のみ（E2EE保護）。現状はDMのみ。
- バックエンド: Vercel プロジェクト（`ghosts-neon.vercel.app`）、`api/notify.js`（web-push 依存）。環境変数 `VAPID_PUBLIC` / `VAPID_PRIVATE` / `VAPID_SUBJECT`。
- iOS要件: Safariの「ホーム画面に追加」＋通知許可が必須。

## 音声通話（1:1）
- WebRTC による1対1の音声通話。番号不要・無料。
- シグナリングは Firestore の接続ドキュメント（`connections/{convId}`）経由で offer/answer/ICE 候補を交換（`call`, `callCandA`, `callCandB`）。STUN（Google）使用。
- DMヘッダーの電話アイコンから発信、相手に着信画面（応答/拒否）。通話中はミュート・終了・通話時間表示。
- 着信監視: 自分の全接続を購読（`members array-contains uid`）し、アプリを開いていれば任意の画面で着信。

## データモデル（Firestore）
- `users/{uid}` { ghostId, nickname, avatar, pubKey, inviteToken, createdAt }
  - `contacts/{peerUid}` { ghostId, nickname, avatar, pubKey, lastText, lastTs, unread }
- `invites/{token}` { from, ghostId, nickname, avatar, pubKey, active }
- `connections/{convId}` { members[2], typingAt, call, callCandA[], callCandB[] }   ※convId = 2者のuidをソート連結
- `groups/{gid}` { name, owner, members[], lastText, lastTs, unread{uid:n}, typingAt }
- `pushSubs/{uid}` { sub(JSON), updatedAt }
- `chats/{conv}/messages/{id}` { from, fromName, text, type, img, w, h, enc, imgEnc, iv, ct, ttl, ts, createdAt, expireAt, readBy{uid:ts} }

## セキュリティルール（要点）
- `users`: 本人のみ読み書き。`contacts`: 本人、または接続済みの相手が自分の連絡先エントリを書ける。
- `invites`: 作成者が管理、トークン保持者が読める。
- `connections`: 2名のメンバーのみ読む/更新/削除（通話・入力中のシグナリングもこの権限で動作）。
- `groups`: メンバーが読む/更新、作成者が作成/削除。
- `pushSubs/{u}`: 本人が書き込み、接続済みの相手が読める。
- `chats/{conv}/messages`: その会話の接続メンバー、またはグループメンバーのみ読み書き。

## 既知の制限（正直な記載）
- タイマー削除は**クライアント駆動のベストエフォート**（確実なサーバー側TTLには Cloud Functions＝有料が必要）。「既読後24h」も、期限時に誰かがオンラインなら削除、いなければ次に会話を開いた時に期限切れとして即削除。
- E2EE秘密鍵は端末内のみ。**端末を変えると過去の暗号メッセージは読めない**（鍵バックアップは今後）。
- 通知/バッジ: iOSは「ホーム画面追加アプリ＋通知許可」が必須。バッジはアプリを開いた時に更新。
- 音声通話: STUNのみ（TURN無し）のため、厳しいNAT環境では繋がらない場合あり。着信はアプリを開いている間のみ（クローズ時の着信呼び出しは今後）。
- グループはE2EE非対応。

## 今後（ロードマップ）
- グループのE2EE / 画像E2EEのグループ対応
- 鍵バックアップ（端末移行）
- クローズ時の着信呼び出し（プッシュ連携）
- グループ音声 / ビデオ通話
- プッシュのセキュリティ強化（トークン検証）
