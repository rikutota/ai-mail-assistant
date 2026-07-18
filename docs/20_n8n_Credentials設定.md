# n8n Credentials設定

## 1. 目的

n8n workflowが参照するCredentialの種類、論理名、最小権限、人間が行う接続確認を定義する。APIキー、token、password、credential IDは本ドキュメントやworkflow JSONへ記載しない。

## 2. Credential一覧

テスト環境では次の論理名を使用する。本番用は末尾を`-prod`へ変更し、テスト環境と共有しない。

| 論理名 | n8n Credential種別 | 用途・最小権限 |
| --- | --- | --- |
| `gmail-oauth2-ai-mail-test` | Gmail OAuth2 API | Gmail読取専用 |
| `microsoft-outlook-oauth2-ai-mail-test` | Microsoft Outlook OAuth2 API | Graph `Mail.Read` |
| `openai-api-ai-mail-test` | OpenAI API | 要約・分類 |
| `google-calendar-oauth2-ai-mail-test` | Google Calendar OAuth2 API | 予定作成 |
| `line-header-auth-ai-mail-test` | Header Auth | LINE通知 |
| `supabase-postgres-ai-mail-test` | Postgres | ログ保存・重複判定 |
| `supabase-api-ai-mail-test` | Supabase API / Header Auth | REST API使用時のみ |

workflow import後は人間が各ノードへ対応Credentialを選択する。export JSONには環境固有のcredential IDを残さない。

## 3. サービス別設定

### Gmail

- 専用テストGoogleアカウントと読取専用scopeを使用する。
- メール変更権限を付与せず、取得前後で未読状態が変わらないことを確認する。

### Microsoft Outlook

- 専用テストMicrosoftアカウントを使用する。
- Graphの委任権限は`Mail.Read`を基本とし、`Mail.ReadWrite`を付与しない。
- 接続確認後も対象メールの`isRead`が変わらないことを確認する。

### OpenAI

- APIキーはOpenAI API Credential内だけに登録する。
- model IDはCredentialではなく`OPENAI_MODEL`で管理する。
- 匿名fixtureだけを送信し、Authorization headerやAPIレスポンス全文をログへ残さない。

### Google Calendar

- 専用テストカレンダーと予定作成に必要な権限だけを使用する。
- 接続確認用イベントはテスト名で1件作成し、確認後に人間が削除する。

### LINE

- channel access tokenはHeader Auth Credential内だけで管理する。
- `Authorization: Bearer <token>`の実tokenをworkflowへ直書きしない。
- user IDも環境変数または安全なCredentialで管理する。

### Supabase / PostgreSQL

- IPv4環境で常駐するn8nはSession poolerを使用する。
- portは`5432`、userは`postgres.<project-ref>`形式とする。
- host、database、user、password、SSL設定はPostgres Credential内で管理し、SSLを有効にする。
- REST APIが必要な場合だけ`SUPABASE_SECRET_KEY`をサーバー側Credentialへ登録する。
- DBへ直接保存できる処理ではPostgres Credentialを優先し、高権限キーの利用を減らす。

## 4. 人間が行う設定

1. n8nを専用テスト環境で起動する。
2. 上記の論理名でCredentialを作成する。
3. OAuth同意または秘密情報入力を行う。
4. 最小権限とテスト環境の接続先を再確認する。
5. 各サービスで1回だけ疎通確認する。
6. workflow import後、対応Credentialを各ノードへ割り当てる。

## 5. コミット前チェック

- workflow JSONに環境固有のcredential IDや実値がない
- `.env`が追加・変更されていない
- APIキー、token、password、OAuthレスポンスが差分にない
- n8n実行データ、メール本文、個人情報が差分にない
- テスト用と本番用のCredentialを共有していない
