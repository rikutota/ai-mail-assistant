# Sprint計画

## 1. 概要

本ドキュメントでは、AIメールアシスタントMVP開発のSprint計画を定義する。

本プロジェクトでは、設計書に基づいてIssue単位で実装を進める。

---

## 2. 開発方針

### 2.1 基本方針

- `develop` を開発統合ブランチとする
- 作業ごとに `feature/*` ブランチを作成する
- 1PRはなるべく小さく保つ
- 設計変更があればdocsも更新する
- 実装より先に接続確認を行う
- 秘密情報はGitHubにコミットしない
- n8n workflow JSONはエクスポートしてGit管理する

---

## 3. Sprint一覧

| Sprint | 目的 | 成果物 |
|---|---|---|
| Sprint 0 | 実装準備 | Supabase、n8n、環境変数、Credentials準備 |
| Sprint 1 | Gmail取得・LINE通知 | GmailメールをLINEへ通知 |
| Sprint 2 | AI要約・分類 | OpenAIでメール解析 |
| Sprint 3 | Outlook連携 | Gmail/Outlook統合 |
| Sprint 4 | Calendar・DB保存 | 予定登録、ログ保存、重複防止 |
| Sprint 5 | テスト・仕上げ | E2E確認、エラー処理、README更新 |

---

## 4. Sprint 0：実装準備

### 目的

実装開始前に、n8n、Supabase、環境変数、Credentialsの準備を行う。

### 対象Issue

- #1 Supabaseプロジェクトを作成する
- #2 SupabaseにMVP用テーブルを作成する
- #3 n8nのローカル実行環境を準備する
- #4 `.env.example` を最新化する
- #5 n8n Credentials設定項目を整理する
- #6 workflow管理用ディレクトリを追加する

### 完了条件

- Supabaseプロジェクトが作成されている
- MVP用テーブルが作成されている
- n8nがローカルで起動する
- `.env.example` が最新化されている
- Credentials登録項目が整理されている
- workflow JSON管理用ディレクトリがある

### 想定成果物

```text
docker-compose.yml
n8n/workflows/
supabase/migrations/
tests/fixtures/
scripts/
.env.example
Supabase tables
```

---

## 5. Sprint 1：Gmail取得・LINE通知

### 目的

Gmailから未読メールを取得し、要約なしの簡易通知をLINEへ送信する。

### 対象Issue

- #7 Gmail OAuth認証を設定する
- #8 Gmailから未読メールを取得する
- #9 Gmailメールを共通形式へ正規化する
- #10 LINE Messaging APIの通知テストを行う
- #11 Gmail要約なし通知をLINEへ送信する

### 完了条件

- Gmail Credentialが有効
- 未読メールを取得できる
- Gmailメールを共通形式に変換できる
- LINE通知が届く
- Gmailメールの件名・差出人をLINEへ表示できる

### このSprintではやらないこと

- OpenAI要約
- Outlook連携
- Calendar登録
- 重複処理防止の完成版

---

## 6. Sprint 2：OpenAI要約・分類

### 目的

GmailメールをOpenAI APIで要約・分類し、LINE通知に反映する。

### 対象Issue

- #12 OpenAI API接続を設定する
- #13 メール要約プロンプトを実装する
- #14 AI出力JSONをパースする
- #15 AI出力のバリデーションを実装する
- #16 重要度・カテゴリ別にLINE通知を整形する

### 完了条件

- OpenAI APIを呼び出せる
- summary / priority / category / isSchedule を取得できる
- JSONパースに失敗した場合の扱いが決まっている
- High / Medium / LowでLINE表示を分けられる

### このSprintではやらないこと

- Outlook連携
- Calendar登録
- 複雑なエラー通知
- 添付ファイル解析

---

## 7. Sprint 3：Outlook連携

### 目的

Outlookメールを取得し、Gmailと同じ後続処理へ流せるようにする。

### 対象Issue

- #17 Microsoft Graph API認証を設定する
- #18 Outlookから未読メールを取得する
- #19 Outlookメールを共通形式へ正規化する
- #20 GmailとOutlookの取得結果を統合する

### 完了条件

- Microsoft OAuth認証が完了している
- Outlook未読メールを取得できる
- Outlookメールを共通形式へ変換できる
- GmailとOutlookのメールを同じOpenAI処理へ流せる

### このSprintではやらないこと

- Outlookメールの既読化
- Outlookメール送信
- 複数Microsoftアカウント対応

---

## 8. Sprint 4：Calendar・DB保存

### 目的

処理結果をSupabaseへ保存し、予定メールをGoogle Calendarへ登録する。

### 対象Issue

- #21 Supabaseへworkflow_runsを保存する
- #22 Supabaseへmail_logsを保存する
- #23 処理済みメールの重複判定を実装する
- #24 Google Calendar OAuth認証を設定する
- #25 予定メールをGoogle Calendarへ登録する
- #26 calendar_logsを保存する

### 完了条件

- workflow_runsに実行ログが保存される
- mail_logsにメール処理結果が保存される
- 同一メールが重複処理されない
- Google Calendarに予定が登録される
- calendar_logsに登録結果が保存される

### このSprintではやらないこと

- Web管理画面
- ユーザーごとのDB分離
- 自動再処理機能

---

## 9. Sprint 5：エラー処理・テスト・仕上げ

### 目的

MVPとして運用できる状態まで、エラー処理・テスト・ドキュメントを整える。

### 対象Issue

- #27 error_logs保存処理を実装する
- #28 notification_logs保存処理を実装する
- #29 API失敗時のリトライを設定する
- #30 E2Eテストを実施する
- #31 workflow JSONをエクスポートしてGit管理する
- #32 READMEに実装後のセットアップ手順を反映する
- #33 MVP完了レビューを行う

### 完了条件

- 主要エラーがerror_logsに保存される
- LINE通知結果がnotification_logsに保存される
- API一時失敗時にリトライされる
- E2Eテストが完了している
- workflow JSONがGit管理されている
- READMEが実装状態に更新されている

---

## 10. ブランチ運用

### 10.1 基本

```text
main
develop
feature/*
```

### 10.2 作業開始

```bash
git checkout develop
git pull origin develop
git checkout -b feature/issue-番号-概要
```

例：

```bash
git checkout -b feature/issue-8-gmail-fetch
```

### 10.3 コミット

```bash
git add .
git commit -m "feat: Gmail未読メール取得を追加"
```

### 10.4 Push

```bash
git push -u origin feature/issue-8-gmail-fetch
```

### 10.5 PR

PRは `feature/*` から `develop` に向けて作成する。

---

## 11. PR運用

PR本文には以下を含める。

```md
## 概要

## 変更内容

## 確認したこと

## 関連Issue

Closes #Issue番号
```

---

## 12. コミットメッセージ

形式：

```text
<type>: <日本語の説明>
```

例：

```text
feat: Gmail未読メール取得を追加
fix: AI出力JSONのパース失敗を修正
docs: READMEにセットアップ手順を追加
chore: Docker Compose設定を追加
```

---

## 13. MVP完了条件

以下を満たしたらMVP完了とする。

- Gmail未読メールを取得できる
- Outlook未読メールを取得できる
- OpenAIで要約・分類できる
- LINE通知が届く
- 予定メールをGoogle Calendarへ登録できる
- Supabaseに処理ログを保存できる
- 同一メールの重複処理を防止できる
- 主要エラーをログ保存できる
- n8n workflow JSONがGit管理されている
- READMEに起動・設定手順がある

---

## 14. MVP後の改善候補

MVP後は以下を検討する。

- LINE Flex Message対応
- Slack通知
- Teams通知
- Webダッシュボード
- 添付ファイル解析
- 請求書PDF保存
- TODO抽出
- メール返信文生成
- 複数ユーザー対応
- Supabase Auth / RLS対応
- n8n workflow自動デプロイ
