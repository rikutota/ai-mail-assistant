# AI Mail Assistant

Gmail・Outlookのメールを自動取得し、AIで要約・分類したうえで、LINE通知とGoogle Calendar登録を行うAIメールアシスタントです。

本プロジェクトでは、n8nを中心に複数の外部サービスを連携し、毎朝のメール確認・重要メールの把握・予定登録を自動化します。

---

## 1. 概要

AI Mail Assistant は、GmailおよびOutlookに届いたメールを取得し、OpenAI APIで要約・分類・予定抽出を行います。

処理結果はLINEへ通知し、予定情報が含まれるメールはGoogle Calendarへ自動登録します。  
また、処理履歴・エラー情報・通知結果はSupabaseへ保存します。

---

## 2. 主な機能

| 機能 | 内容 |
|---|---|
| Gmailメール取得 | Gmailの未読メールを取得 |
| Outlookメール取得 | Outlook / Microsoft 365の未読メールを取得 |
| AI要約 | メール本文を短く要約 |
| 重要度判定 | High / Medium / Low に分類 |
| カテゴリ分類 | schedule / task / notice / invoice / promotion / other に分類 |
| 予定抽出 | メール本文から日時・場所・タイトルを抽出 |
| Google Calendar登録 | 予定メールをカレンダーへ自動登録 |
| LINE通知 | 毎朝メール要約をLINEへ送信 |
| Supabase保存 | 処理ログ・エラーログを保存 |
| 重複処理防止 | 同一メールの再処理を防止 |

---

## 3. システム構成

```text
Gmail
Outlook
  │
  ▼
n8n Workflow
  │
  ├── OpenAI API
  ├── LINE Messaging API
  ├── Google Calendar API
  └── Supabase PostgreSQL
```

---

## 4. 処理フロー

```text
毎朝8時にn8nワークフローを起動
↓
Gmail / Outlookから未読メールを取得
↓
メールデータを共通形式へ正規化
↓
Supabaseで処理済みメールか確認
↓
未処理メールをOpenAI APIで要約・分類
↓
予定メールであればGoogle Calendarへ登録
↓
処理結果をSupabaseへ保存
↓
LINEへメール要約を通知
```

---

## 5. 技術スタック

| 領域 | 技術 |
|---|---|
| ワークフロー | n8n |
| AI処理 | OpenAI API |
| メール取得 | Gmail API / Microsoft Graph API |
| 通知 | LINE Messaging API |
| 予定管理 | Google Calendar API |
| DB | Supabase PostgreSQL |
| バージョン管理 | Git / GitHub |
| 実行環境 | Docker / n8n Cloud / VPS |

---

## 7. ドキュメント

| ドキュメント | 内容 |
|---|---|
| [プロジェクト概要](docs/00_プロジェクト概要.md) | システムの目的・概要 |
| [要件定義書](docs/01_要件定義書.md) | MVP範囲・機能要件・非機能要件 |
| [ユースケース一覧](docs/02_ユースケース一覧.md) | 利用シナリオ |
| [システム構成図](docs/04_システム構成図.md) | 全体構成・処理フロー |
| [n8nワークフロー設計](docs/06_n8nワークフロー設計.md) | n8nノード設計 |
| [API設計書](docs/07_API設計書.md) | 外部API連携仕様 |
| [DB設計書](docs/08_DB設計書.md) | Supabaseテーブル設計 |
| [AIプロンプト設計](docs/09_AIプロンプト設計.md) | OpenAIプロンプト・JSON出力仕様 |
| [メール分類仕様](docs/10_メール分類仕様.md) | 重要度・カテゴリ分類ルール |
| [認証設計](docs/11_認証設計.md) | OAuth・APIキー管理 |
| [エラー処理設計](docs/12_エラー処理設計.md) | エラー分類・リトライ・復旧方針 |
| [テスト仕様書](docs/13_テスト仕様書.md) | テスト観点・E2E確認 |
| [デプロイ手順](docs/14_デプロイ手順.md) | n8n・Supabase・外部サービス設定 |
| [Issue一覧](docs/15_Issue一覧.md) | MVP実装に必要なGitHub Issue一覧 |
| [Sprint計画](docs/16_Sprint計画.md) | Sprintごとの実装計画 |
| [Codex運用計画](docs/17_Codex運用計画.md) | Codexを使ったQueue Engineeringの運用方針 |
| [リポジトリ構成](docs/18_リポジトリ構成.md) | workflow、migration、fixture、検証スクリプトの配置方針 |

---

## 8. MVP範囲

MVPでは以下を実装します。

- Gmail未読メール取得
- Outlook未読メール取得
- メール情報の正規化
- OpenAIによる要約・分類
- Google Calendar登録
- LINE通知
- Supabase保存
- 重複処理防止
- エラーログ保存

---

## 9. MVPでは実装しない機能

以下は初期リリースでは対象外です。

- Webダッシュボード
- 複数ユーザー対応
- メール自動返信
- メール返信文生成
- 添付ファイル解析
- 請求書PDF保存
- Slack通知
- Teams通知
- 課金機能
- SaaS化

---

## 10. 環境変数

`.env.example` には以下のキー名のみを定義します。  
実際の値は `.env` またはn8n Credentialsで管理します。

```env
# OpenAI
OPENAI_API_KEY=

# LINE
LINE_CHANNEL_ACCESS_TOKEN=
LINE_USER_ID=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=

# Microsoft OAuth
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=
MICROSOFT_REFRESH_TOKEN=

# Supabase API
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Supabase DB
SUPABASE_DB_HOST=
SUPABASE_DB_PORT=
SUPABASE_DB_NAME=
SUPABASE_DB_USER=
SUPABASE_DB_PASSWORD=

# n8n
N8N_BASIC_AUTH_USER=
N8N_BASIC_AUTH_PASSWORD=
N8N_ENCRYPTION_KEY=
```

---

## 11. セットアップ方針

詳細なセットアップ手順は [デプロイ手順書](docs/14_デプロイ手順.md) を参照します。

大まかな流れは以下です。

```text
1. Supabaseプロジェクトを作成
2. DBテーブルを作成
3. n8nを起動
4. Gmail OAuthを設定
5. Outlook / Microsoft Graph OAuthを設定
6. OpenAI API Keyを設定
7. LINE Messaging APIを設定
8. Google Calendar OAuthを設定
9. n8nワークフローを作成
10. Manual TriggerでE2E確認
11. Schedule Triggerを有効化
```

---

## 12. 開発フロー

本プロジェクトでは、`develop` を開発統合ブランチとして使用します。

```text
main
develop
feature/*
```

### 基本手順

```bash
git checkout develop
git pull origin develop
git checkout -b feature/作業名
```

作業後：

```bash
git add .
git commit -m "docs: 変更内容を日本語で記述"
git push -u origin feature/作業名
```

GitHub上でPull Requestを作成し、`develop` へマージします。

---

## 13. コミットメッセージ規約

形式：

```text
<type>: <日本語の説明>
```

例：

```text
docs: 要件定義書を詳細化
feat: Gmail取得ワークフローを追加
fix: Outlook認証エラーを修正
chore: Docker Compose設定を追加
```

### type一覧

| type | 用途 |
|---|---|
| feat | 新機能 |
| fix | バグ修正 |
| docs | ドキュメント |
| style | 整形 |
| refactor | リファクタリング |
| test | テスト |
| chore | 設定・雑務 |
| ci | CI関連 |
| build | ビルド・依存関係 |
| revert | 取り消し |

---

## 14. セキュリティ方針

以下の情報はGitHubへコミットしません。

- `.env`
- APIキー
- OAuth Client Secret
- Access Token
- Refresh Token
- LINE Channel Access Token
- LINE User ID
- Supabase Service Role Key
- DB Password
- n8n Credentialsの秘密情報

`.env.example` にはキー名のみを記載します。

---

## 15. テスト方針

MVPでは以下を確認します。

- Gmailメールを取得できる
- Outlookメールを取得できる
- OpenAIがJSON形式で要約・分類できる
- 予定メールをGoogle Calendarへ登録できる
- LINE通知が届く
- Supabaseへ処理ログを保存できる
- 同じメールを重複処理しない
- エラー時にログが保存される
- 秘密情報がGitに含まれていない

詳細は [テスト仕様書](docs/13_テスト仕様書.md) を参照します。

---

## 16. ロードマップ

## Phase 0：リポジトリ初期化

- GitHub Repository作成
- `develop` ブランチ作成
- `docs/` 管理開始
- 初期README作成

## Phase 1：設計

- 要件定義
- ユースケース整理
- システム構成整理
- n8nワークフロー設計
- DB設計
- API設計
- AIプロンプト設計
- 認証設計
- エラー処理設計
- テスト仕様
- デプロイ手順

## Phase 2：実装準備

- Supabaseプロジェクト作成
- DBテーブル作成
- n8nローカル起動
- Credentials設定
- 外部API接続確認

## Phase 3：MVP実装

- Gmail取得
- Outlook取得
- OpenAI要約・分類
- LINE通知
- Google Calendar登録
- Supabase保存
- 重複処理防止

## Phase 4：テスト・改善

- E2Eテスト
- 異常系テスト
- エラー処理改善
- README更新
- デモ用資料作成

---

## 17. 現在のステータス

現在は **Phase 1：設計フェーズ** です。

実装開始前に、以下を完了させます。

- 設計書一式の整備
- README整備
- Issue分解
- Sprint計画作成

---

## 18. 今後の改善候補

MVP後は以下を検討します。

- LINE Flex Message対応
- Slack通知
- Teams通知
- Webダッシュボード
- 添付ファイル解析
- 請求書PDF保存
- 返信文生成
- TODO抽出
- 複数ユーザー対応
- Supabase Auth / RLS対応
- n8n workflow自動デプロイ
- GitHub Actionsによるsecret scan

---

## 19. License

設計資料は `docs/` 配下で管理します。

| ドキュメント | 内容 |
| --- | --- |
| [Codex運用計画](docs/17_Codex運用計画.md) | Codexを使ったQueue Engineeringの運用方針 |
