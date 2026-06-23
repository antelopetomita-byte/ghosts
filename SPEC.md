# Ghosts 仕様書

**最終更新: 2026-06-23 / バージョン: Phase 2（Firebase 接続・招待制・アカウント完成）**

---

## 1. プロジェクト概要

**Ghosts** は「消えゆく会話」をコンセプトにした、プライバシー重視のメッセージアプリ。

最大の差別化要素は **メッセージ単位で寿命（削除ルール）を設定できる** こと。単純な全体自動削除ではなく、1通ごとに「残す／既読後／秒・分・時間・日」を選べる。

- キャッチコピー: **Messages fade. Privacy stays. / Nothing Stays Forever.**
- ブランド: 黒基調・ミニマル・Appleライク・スペクトラルエメラルドのネオンアクセント
- 接続は **招待制**（招待された相手としか繋がれない）

---

## 2. 公開環境

| 項目 | 値 |
|---|---|
| 公開URL | https://antelopetomita-byte.github.io/ghosts/ |
| GitHub リポジトリ | `antelopetomita-byte/ghosts` |
| ホスティング | GitHub Pages（`main` ブランチの `index.html`） |
| Firebase プロジェクト | `ghosts-ef885` |
| Firestore ロケーション | `asia-northeast1`（東京） |
| 料金プラン | Spark（無料）の範囲内 |

構成は **単一ファイル `index.html`**（HTML / CSS / JS をすべて内包）。画像・アイコンも base64 で埋め込み、外部依存は最小。

---

## 3. 画面構成（画面切替型）

縦スクロール型は不採用。スマホアプリライクな画面遷移式。

```
スプラッシュ（ロゴ＋ENTER）
   ↓
登録（新規作成／ログイン）
   ↓
チャット一覧 ──→ 設定（ニックネーム/ID/招待/ログアウト）
   │
   ├─→ 招待（招待する／QR／承認）
   │
   └─→ チャット（吹き出し・寿命設定・消滅エフェクト）
```

---

## 4. 主要機能

### 4.1 アカウント
- 起動時に **匿名ログイン** で端末に固定のアカウントを取得
- 登録時に **ニックネーム ＋ 自分で決める Ghost ID ＋ パスワード** を設定
  - パスワード設定で匿名アカウントを本アカウントへ昇格（`linkWithCredential`、UID は不変）
  - 内部的にメール `（ghost_xxx）@ghosts.app` ＋パスワードのアカウントを使用
- **別端末ログイン**: 「ログイン」タブに Ghost ID とパスワードを入力 → 同じ UID・同じ会話・同じ連絡先に入れる（新 ID は作られない）
- 相手には **ニックネーム** を表示（Ghost ID は裏側の識別子として固定）
- 設定画面: ニックネーム変更 / ID 確認 / 招待 / ログアウト

### 4.2 招待制（接続）
- 接続は **招待リンク／QR を渡した相手だけ** が可能（ID 検索による無断追加は廃止）
- 招待リンク: `?invite=<トークン>` 形式。QR・リンク・直接貼り付け（承認タブ）に対応
- 受け取った側が承認 → 双方向の `connection` が成立して初めて会話可能
- 招待リンクは **作り直し（再発行）で旧リンクを無効化** 可能
- Firestore セキュリティルールにより、接続していない相手の会話は読み書き不可（後述）

### 4.3 チャット
- Firestore による **リアルタイム送受信**（`onSnapshot`）
- 既読表示（`readBy`）、送信/既読の状態表示
- iMessage 風吹き出し（送信＝エメラルド、受信＝ダークガラス）
- ローカルフォールバック時はデモ用「Ghost」ヘルプbotが応答

### 4.4 メッセージ寿命（中核機能）
1通ごとに以下から選択（チップで切替）:

| 区分 | 動作 |
|---|---|
| 残す | 削除しない |
| 既読後 | 相手が読んだ後に消滅 |
| 10秒 / 30秒 / 1分 / 5分 / 10分 / 30分 | 時間経過で消滅 |
| 1時間 / 6時間 / 12時間 / 24時間 / 7日 | 時間経過で消滅 |

- **消滅 = Firestore ドキュメントを実削除**（サーバー上にも残らない）
- 時間系: 各クライアントが `expireAt` 到達時に `deleteDoc`
- 既読後: 読んだ側が短い猶予の後に `deleteDoc`
- 削除は `onSnapshot` の `removed` を介して **両者の画面でパーティクル崩壊エフェクト** とともに消える
- カウントダウン表示は白で残り時間を表示

### 4.5 ロゴ・アイコン・デザイン
- 起動画面: ゴーストが粒子化するアートワーク＋ワードマーク
- ホーム画面アイコン（apple-touch-icon）: フチなし正方形アートワーク（iOS が自動で角丸化）
- 配色: void black `#07080b` / spectral emerald `#2fe7a8`
- 書体: Space Grotesk（見出し）/ Inter（本文）/ Space Mono（ID・数値）
- 署名的演出: メッセージ消滅時のパーティクル崩壊（reduced-motion 時はフェード）

---

## 5. 技術スタック / アーキテクチャ

- フロント: 素の HTML / CSS / JavaScript（ES Module、単一 `index.html`）
- Firebase JS SDK v12（modular、gstatic CDN から import）
  - Authentication（匿名 ＋ メール/パスワード）
  - Cloud Firestore（リアルタイム DB）
- QR 生成: qrcodejs（cdnjs）
- ホスティング: GitHub Pages
- PWA 対応: `apple-touch-icon` / `apple-mobile-web-app-capable` / アプリ名 "Ghosts"

---

## 6. データモデル（Firestore）

```
users/{uid}
  ├─ ghostId: "ghost_xxxx"
  ├─ nickname: "表示名"
  ├─ inviteToken: "inv_xxxx"
  ├─ createdAt
  └─ contacts/{peerUid}
       ├─ ghostId, nickname
       ├─ lastText, lastTs, lastFrom   （一覧プレビュー用ミラー。消えるメッセージは内容を保存しない）
       └─ addedAt

invites/{token}
  ├─ from: <作成者 uid>
  ├─ ghostId, nickname
  ├─ active: true/false
  └─ createdAt

connections/{convId}                    convId = sorted(uidA, uidB).join('__')
  ├─ members: [uidA, uidB]
  └─ createdAt

chats/{convId}/messages/{msgId}
  ├─ from: <送信者 uid>
  ├─ text
  ├─ ttl: "keep" | "read" | "10s" … "7d"
  ├─ ts: <クライアント時刻 ms>
  ├─ createdAt: serverTimestamp
  ├─ expireAt: <ms> | null            （時間系の削除予定時刻）
  └─ readBy: { <uid>: <ms>, … }       （既読）
```

---

## 7. セキュリティルール（要約）

公開済み（Firestore → ルール）。`firestore.rules` が原本。

- `users/{uid}`・`contacts`: **本人のみ** 読み書き。ただし接続成立済みの相手は自分の連絡先エントリ（`cid == uid`）を書き込み可
- `invites/{token}`: トークンを知る者のみ参照可、作成者のみ管理
- `connections/{convId}`: **メンバー（2名）のみ** 読み書き・作成
- `chats/{convId}/messages`: 対応する `connection` のメンバーのみアクセス可（`get()` でメンバー判定）

→ UI をすり抜けて直接 Firestore を叩いても、**招待で接続していない相手の会話には触れられない**。

---

## 8. Firebase セットアップ（完了済み）

1. プロジェクト `ghosts-ef885` 作成
2. ウェブアプリ `ghosts-web` 登録（`firebaseConfig` をアプリに埋め込み）
3. Firestore Database 作成（`asia-northeast1`）
4. Authentication: **匿名** ＋ **メール/パスワード** を有効化
5. セキュリティルール公開

> 補足: `firebaseConfig` の `apiKey` はウェブ公開前提の値で秘匿不要。安全性は Auth とルールで担保。

---

## 9. デプロイ運用

- Claude が GitHub Contents API 経由で `index.html` を直接 push
- 手順: 現在の SHA 取得 → base64 エンコード → PUT → GitHub Pages 自動再デプロイ
- 認証: Contents（Read and write）権限の Personal Access Token
- push 前に `</style>` の検証と `node --check`（JS 構文チェック）を実施

---

## 10. ロードマップ / 今後の候補

**Phase 3（予定）**
- 本格 PWA 化（manifest.json、オフライン、インストール）
- iOS / Android 対応の磨き込み

**機能候補**
- 真の E2EE（後述の制約参照）
- スクリーンショット通知（可能な範囲）
- 入力中インジケータ（クラウド経路）
- 画像・添付ファイル、画像1回閲覧削除
- 指定日時削除 / 閲覧回数制限 / 相手が離脱したら削除
- 使い切り（ワンタイム）招待
- Cloud Functions による保証付きサーバー側 TTL 削除（現状はクライアント実削除のベストエフォート）

---

## 11. 既知の制約・メモ

- **E2EE は現状ラベルのみ**: メッセージは Firestore に平文で保存され、セキュリティルールで保護されている状態。文言どおりの「エンドツーエンド暗号化」はまだ未実装で、今後の課題。
- **時間系の削除はクライアント駆動**: オンラインのクライアントが `expireAt` 到達で削除する方式。全員オフラインの場合は次回アクセス時に削除。厳密な保証には Cloud Functions（または Firestore TTL ポリシー）が必要。
- **連絡先プレビュー**: 消えるメッセージの本文はミラーに保存せず、「消えるメッセージ」表記にしてプライバシーを保護。
- **ローカルモード**: Firebase へ接続できない場合、画面上部に「ローカルモード」と理由を表示し、デモ用ヘルプbotで UI を体験可能。

---

*Priority Creative Works — Ghosts*
