# Issue一覧

## 1. 概要

本ドキュメントでは、AIメールアシスタントMVP開発に必要なGitHub Issueを整理する。

Issueは以下の単位で分解する。

- 環境構築
- Supabase DB構築
- n8nワークフロー作成
- Gmail連携
- Outlook連携
- OpenAI連携
- LINE通知
- Google Calendar登録
- エラー処理
- テスト
- ドキュメント整備

---

## 2. ラベル方針

GitHub Issueでは以下のラベルを使用する。

| ラベル | 用途 |
|---|---|
| type: docs | ドキュメント |
| type: setup | 環境構築 |
| type: feature | 機能追加 |
| type: fix | 修正 |
| type: test | テスト |
| type: refactor | 整理・改善 |
| area: n8n | n8n関連 |
| area: gmail | Gmail関連 |
| area: outlook | Outlook関連 |
| area: openai | OpenAI関連 |
| area: line | LINE関連 |
| area: calendar | Google Calendar関連 |
| area: db | Supabase関連 |
| area: auth | 認証関連 |
| priority: high | 高優先度 |
| priority: medium | 中優先度 |
| priority: low | 低優先度 |

---

## 3. Milestone一覧

| Milestone | 内容 |
|---|---|
| Sprint 0 | 実装準備・環境構築 |
| Sprint 1 | Gmail取得・LINE通知 |
| Sprint 2 | OpenAI要約・分類 |
| Sprint 3 | Outlook連携 |
| Sprint 4 | Google Calendar登録・Supabase保存 |
| Sprint 5 | エラー処理・テスト・仕上げ |

---

## 4. Issue一覧

## Sprint 0：実装準備・環境構築

| Issue | タイトル | 優先度 |
|---|---|---|
| #1 | Supabaseプロジェクトを作成する | High |
| #2 | SupabaseにMVP用テーブルを作成する | High |
| #3 | n8nのローカル実行環境を準備する | High |
| #4 | `.env.example` を最新化する | High |
| #5 | n8n Credentials設定項目を整理する | High |
| #6 | workflow管理用ディレクトリを追加する | Medium |

---

## Sprint 1：Gmail取得・LINE通知

| Issue | タイトル | 優先度 |
|---|---|---|
| #7 | Gmail OAuth認証を設定する | High |
| #8 | Gmailから未読メールを取得する | High |
| #9 | Gmailメールを共通形式へ正規化する | High |
| #10 | LINE Messaging APIの通知テストを行う | High |
| #11 | Gmail要約なし通知をLINEへ送信する | High |

---

## Sprint 2：OpenAI要約・分類

| Issue | タイトル | 優先度 |
|---|---|---|
| #12 | OpenAI API接続を設定する | High |
| #13 | メール要約プロンプトを実装する | High |
| #14 | AI出力JSONをパースする | High |
| #15 | AI出力のバリデーションを実装する | High |
| #16 | 重要度・カテゴリ別にLINE通知を整形する | High |

---

## Sprint 3：Outlook連携

| Issue | タイトル | 優先度 |
|---|---|---|
| #17 | Microsoft Graph API認証を設定する | High |
| #18 | Outlookから未読メールを取得する | High |
| #19 | Outlookメールを共通形式へ正規化する | High |
| #20 | GmailとOutlookの取得結果を統合する | High |

---

## Sprint 4：Google Calendar登録・Supabase保存

| Issue | タイトル | 優先度 |
|---|---|---|
| #21 | Supabaseへworkflow_runsを保存する | High |
| #22 | Supabaseへmail_logsを保存する | High |
| #23 | 処理済みメールの重複判定を実装する | High |
| #24 | Google Calendar OAuth認証を設定する | High |
| #25 | 予定メールをGoogle Calendarへ登録する | High |
| #26 | calendar_logsを保存する | High |

---

## Sprint 5：エラー処理・テスト・仕上げ

| Issue | タイトル | 優先度 |
|---|---|---|
| #27 | error_logs保存処理を実装する | High |
| #28 | notification_logs保存処理を実装する | Medium |
| #29 | API失敗時のリトライを設定する | High |
| #30 | E2Eテストを実施する | High |
| #31 | workflow JSONをエクスポートしてGit管理する | High |
| #32 | READMEに実装後のセットアップ手順を反映する | Medium |
| #33 | MVP完了レビューを行う | High |

---

## 5. Issueテンプレート

GitHub Issue作成時は以下の形式を使用する。

```md
## 概要

## 作業内容

- [ ] 
- [ ] 
- [ ] 

## 完了条件

- [ ] 
- [ ] 

## 参考資料

## 補足
```

---

## 6. 主要Issue詳細

## Issue #1 Supabaseプロジェクトを作成する

### 概要

AIメールアシスタントの処理ログ保存先としてSupabaseプロジェクトを作成する。

### 作業内容

- Supabaseで新規プロジェクトを作成
- Project URLを確認
- API Keyを確認
- DB接続情報を確認
- `.env` に必要情報を設定

### 完了条件

- Supabaseプロジェクトが作成されている
- SQL Editorを利用できる
- DB接続情報を確認できている
- 秘密情報をGitHubにコミットしていない

---

## Issue #2 SupabaseにMVP用テーブルを作成する

### 概要

DB設計書に基づき、MVP用テーブルを作成する。

### 作業内容

- `workflow_runs` を作成
- `mail_logs` を作成
- `calendar_logs` を作成
- `error_logs` を作成
- `notification_logs` を作成
- 制約とインデックスを作成

### 完了条件

- 5テーブルが作成されている
- 一意制約が設定されている
- テストinsertが成功する

---

## Issue #3 n8nのローカル実行環境を準備する

### 概要

Docker Composeでn8nをローカル起動できるようにする。

### 作業内容

- `docker-compose.yml` を作成
- n8n用dataディレクトリを準備
- `.env` を作成
- n8nを起動
- ブラウザからアクセス確認

### 完了条件

- `docker compose up -d` でn8nが起動する
- `http://localhost:5678` にアクセスできる
- n8n管理ユーザーを作成できる

---

## Issue #8 Gmailから未読メールを取得する

### 概要

Gmailから未読かつ直近24時間以内のメールを取得する。

### 作業内容

- Gmailノードを追加
- 検索条件を設定
- メール一覧取得を確認
- メール詳細取得を確認
- 件名・差出人・本文を取得

### 完了条件

- Gmailの未読メールを取得できる
- 対象メールがない場合も正常終了する
- Gmail認証エラー時にエラーを確認できる

---

## Issue #13 メール要約プロンプトを実装する

### 概要

AIプロンプト設計書に基づき、OpenAI APIでメール要約・分類を行う。

### 作業内容

- System Promptを設定
- User Promptを設定
- JSON Schemaを設定
- テストメールで実行
- 出力JSONを確認

### 完了条件

- summaryが生成される
- priorityが生成される
- categoryが生成される
- isScheduleが生成される
- JSONとしてパース可能

---

## Issue #25 予定メールをGoogle Calendarへ登録する

### 概要

AIが予定メールと判定したメールをGoogle Calendarへ登録する。

### 作業内容

- Google Calendar Credentialを設定
- Calendar登録ノードを追加
- event.titleをsummaryに設定
- start/endを設定
- descriptionに元メール情報を含める

### 完了条件

- Google Calendarに予定が登録される
- イベントIDを取得できる
- confidenceが低い予定は登録されない
- 同一メールから重複登録されない

---

## Issue #30 E2Eテストを実施する

### 概要

メール取得からLINE通知、Calendar登録、Supabase保存までの一連の流れを確認する。

### 作業内容

- Gmailテストメールを用意
- Outlookテストメールを用意
- Manual Triggerで実行
- LINE通知確認
- Calendar登録確認
- Supabase保存確認
- error_logs確認

### 完了条件

- Gmailメールが処理される
- Outlookメールが処理される
- LINE通知が届く
- Calendar登録が成功する
- Supabaseにログが保存される
- workflow_runsがsuccessまたはpartial_successになる

---

## 7. 実装時のIssue運用ルール

- 1PRにつき原則1Issue
- 作業開始時にIssueをAssignee設定する
- PR本文に `Closes #Issue番号` を記載する
- 実装前に関連ドキュメントを確認する
- 仕様変更が発生した場合はdocsも更新する
- 秘密情報を含むスクリーンショットは添付しない

---

## 8. PRとIssueの対応例

```md
Closes #8
```

または

```md
Refs #8
```

完全に完了する場合は `Closes` を使う。  
関連するだけの場合は `Refs` を使う。