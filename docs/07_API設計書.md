# API設計書

## 1. 概要

本ドキュメントでは、AIメールアシスタントで利用する外部APIおよび内部的なデータ受け渡し仕様を定義する。

本システムはn8nを中心に、以下のAPIを連携する。

- Gmail API
- Microsoft Graph API
- OpenAI API
- Google Calendar API
- LINE Messaging API
- Supabase REST API / PostgreSQL

MVPでは独自のWeb APIサーバーは作成しない。  
n8nが各外部APIを呼び出し、必要なデータ整形・分岐・保存処理を実行する。

---

## 2. API連携一覧

| ID | API | 用途 | 認証方式 |
|---|---|---|---|
| API-001 | Gmail API | Gmailメール取得 | OAuth2 |
| API-002 | Microsoft Graph API | Outlookメール取得 | OAuth2 |
| API-003 | OpenAI API | メール要約・分類・予定抽出 | API Key |
| API-004 | Google Calendar API | 予定登録 | OAuth2 |
| API-005 | LINE Messaging API | LINE通知 | Channel Access Token |
| API-006 | Supabase REST API | ログ保存・重複判定 | API Key |
| API-007 | Supabase PostgreSQL | SQL実行・詳細検索 | DB接続 |

---

## 3. 共通設計方針

### 3.1 データ形式

外部APIから取得したデータは、n8n内で共通形式へ正規化する。

正規化後のメールデータは以下とする。

```json
{
  "source": "gmail",
  "messageId": "string",
  "threadId": "string",
  "senderName": "string",
  "senderEmail": "sender@example.com",
  "subject": "string",
  "body": "string",
  "receivedAt": "2026-07-12T08:00:00+09:00",
  "webLink": "string",
  "isRead": false
}
```

---

### 3.2 タイムゾーン

- APIから取得する日時はUTCの場合がある
- n8n内部ではISO 8601形式で扱う
- ユーザー向け表示はAsia/Tokyoを前提とする
- DB保存は `timestamptz` で保存する

---

### 3.3 エラー処理

各API呼び出しでエラーが発生した場合、以下を `error_logs` に保存する。

```json
{
  "workflow_name": "AI Mail Assistant - Daily Summary",
  "node_name": "Get Gmail Messages",
  "source": "gmail",
  "message_id": "message-id",
  "error_type": "gmail_error",
  "error_message": "API request failed",
  "occurred_at": "2026-07-12T08:00:00+09:00"
}
```

---

## 4. Gmail API設計

## 4.1 用途

Gmailから対象メールを取得する。

### 対象メール

- 受信トレイ配下
- 未読
- 直近24時間以内
- 添付ファイル解析はMVP対象外

---

## 4.2 使用API

| 処理 | Method | Endpoint |
|---|---|---|
| メール一覧取得 | GET | `/gmail/v1/users/{userId}/messages` |
| メール詳細取得 | GET | `/gmail/v1/users/{userId}/messages/{id}` |

---

## 4.3 メール一覧取得

### Request

```http
GET https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox is:unread newer_than:1d
Authorization: Bearer {GOOGLE_ACCESS_TOKEN}
```

### Query Parameters

| パラメータ | 値 | 説明 |
|---|---|---|
| userId | me | 認証ユーザー |
| q | in:inbox is:unread newer_than:1d | Gmail検索条件 |
| maxResults | 10〜50 | MVPでは最大50件程度 |

### Response例

```json
{
  "messages": [
    {
      "id": "18a9xxxxx",
      "threadId": "18a9threadxxxxx"
    }
  ],
  "resultSizeEstimate": 1
}
```

---

## 4.4 メール詳細取得

### Request

```http
GET https://gmail.googleapis.com/gmail/v1/users/me/messages/{id}?format=full
Authorization: Bearer {GOOGLE_ACCESS_TOKEN}
```

### Responseから取得する項目

| 項目 | 取得元 |
|---|---|
| messageId | id |
| threadId | threadId |
| subject | payload.headers |
| sender | payload.headers |
| receivedAt | internalDate |
| body | payload.parts / payload.body |
| snippet | snippet |

---

## 4.5 Gmail取得後の変換例

```json
{
  "source": "gmail",
  "messageId": "18a9xxxxx",
  "threadId": "18a9threadxxxxx",
  "senderName": "A社 担当者",
  "senderEmail": "sender@example.com",
  "subject": "打ち合わせ日程について",
  "body": "メール本文",
  "receivedAt": "2026-07-12T08:00:00+09:00",
  "webLink": null,
  "isRead": false
}
```

---

## 4.6 必要スコープ

MVPでは以下を候補とする。

```text
https://www.googleapis.com/auth/gmail.readonly
```

既読化を実装する場合は追加スコープを検討する。

---

## 5. Microsoft Graph API設計

## 5.1 用途

Outlook / Microsoft 365の受信メールを取得する。

---

## 5.2 使用API

| 処理 | Method | Endpoint |
|---|---|---|
| Inboxメール一覧取得 | GET | `/v1.0/me/mailFolders/inbox/messages` |
| メール詳細取得 | GET | `/v1.0/me/messages/{id}` |

---

## 5.3 Inboxメール一覧取得

### Request

```http
GET https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$filter=isRead eq false&$top=50
Authorization: Bearer {MICROSOFT_ACCESS_TOKEN}
Prefer: outlook.body-content-type="text"
```

### Query Parameters

| パラメータ | 値 | 説明 |
|---|---|---|
| $filter | isRead eq false | 未読メール |
| $top | 50 | 取得件数上限 |
| $orderby | receivedDateTime desc | 新しい順 |

直近24時間以内に絞る場合は、n8n側で日時比較するか、Graph APIの `$filter` に `receivedDateTime` 条件を追加する。

---

## 5.4 Response例

```json
{
  "value": [
    {
      "id": "AAMkAGxxxxx",
      "subject": "打ち合わせ日程について",
      "from": {
        "emailAddress": {
          "name": "A社 担当者",
          "address": "sender@example.com"
        }
      },
      "receivedDateTime": "2026-07-11T23:00:00Z",
      "body": {
        "contentType": "text",
        "content": "メール本文"
      },
      "webLink": "https://outlook.office.com/...",
      "isRead": false
    }
  ]
}
```

---

## 5.5 Outlook取得後の変換例

```json
{
  "source": "outlook",
  "messageId": "AAMkAGxxxxx",
  "threadId": null,
  "senderName": "A社 担当者",
  "senderEmail": "sender@example.com",
  "subject": "打ち合わせ日程について",
  "body": "メール本文",
  "receivedAt": "2026-07-12T08:00:00+09:00",
  "webLink": "https://outlook.office.com/...",
  "isRead": false
}
```

---

## 5.6 必要権限

MVPでは以下を候補とする。

```text
Mail.Read
```

既読化やメール更新を行う場合は `Mail.ReadWrite` を検討する。

---

## 6. OpenAI API設計

## 6.1 用途

メール本文を解析し、以下をJSONで返す。

- 要約
- 重要度
- カテゴリ
- 対応要否
- 予定判定
- カレンダー登録用イベント情報

---

## 6.2 Request概要

### Method

```http
POST
```

### Endpoint

```text
https://api.openai.com/v1/responses
```

### Headers

```http
Authorization: Bearer {OPENAI_API_KEY}
Content-Type: application/json
```

---

## 6.3 Request Body例

```json
{
  "model": "gpt-4.1-mini",
  "input": [
    {
      "role": "system",
      "content": "あなたはメール内容を要約・分類するAIアシスタントです。必ずJSONのみを出力してください。"
    },
    {
      "role": "user",
      "content": "以下のメールを解析してください。..."
    }
  ],
  "text": {
    "format": {
      "type": "json_schema",
      "name": "mail_analysis",
      "schema": {
        "type": "object",
        "required": [
          "summary",
          "priority",
          "category",
          "requiresAction",
          "isSchedule",
          "event",
          "confidence",
          "reason"
        ],
        "properties": {
          "summary": { "type": "string" },
          "priority": {
            "type": "string",
            "enum": ["High", "Medium", "Low"]
          },
          "category": {
            "type": "string",
            "enum": ["schedule", "task", "notice", "invoice", "promotion", "other"]
          },
          "requiresAction": { "type": "boolean" },
          "isSchedule": { "type": "boolean" },
          "event": {
            "anyOf": [
              {
                "type": "object",
                "required": [
                  "title",
                  "startDateTime",
                  "endDateTime",
                  "location",
                  "description"
                ],
                "properties": {
                  "title": { "type": "string" },
                  "startDateTime": { "type": "string" },
                  "endDateTime": { "type": "string" },
                  "location": { "type": "string" },
                  "description": { "type": "string" }
                }
              },
              { "type": "null" }
            ]
          },
          "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          },
          "reason": { "type": "string" }
        }
      }
    }
  }
}
```

---

## 6.4 Response例

```json
{
  "summary": "7/15 10:00からA社との打ち合わせがあります。",
  "priority": "High",
  "category": "schedule",
  "requiresAction": true,
  "isSchedule": true,
  "event": {
    "title": "A社打ち合わせ",
    "startDateTime": "2026-07-15T10:00:00+09:00",
    "endDateTime": "2026-07-15T11:00:00+09:00",
    "location": "オンライン",
    "description": "A社との打ち合わせ。元メール件名: 打ち合わせ日程について"
  },
  "confidence": 0.95,
  "reason": "日時と打ち合わせ内容が明確に記載されているため"
}
```

---

## 6.5 n8n側の検証

OpenAIの出力後、n8nのCodeノードで以下を検証する。

| 項目 | 不正時の対応 |
|---|---|
| JSONパース失敗 | error_logsへ保存 |
| priority不正 | Mediumに補正 |
| category不正 | otherに補正 |
| confidence範囲外 | 0.5に補正 |
| isSchedule=true かつ event=null | isSchedule=falseに補正 |
| startDateTimeなし | isSchedule=falseに補正 |

---

## 7. Google Calendar API設計

## 7.1 用途

AIが予定メールと判定した場合、Google Calendarへ予定を登録する。

---

## 7.2 使用API

| 処理 | Method | Endpoint |
|---|---|---|
| 予定登録 | POST | `/calendar/v3/calendars/{calendarId}/events` |

---

## 7.3 登録条件

以下をすべて満たす場合のみ登録する。

```text
isSchedule = true
confidence >= 0.7
event.title is not empty
event.startDateTime is not empty
event.endDateTime is not empty
source + messageId が未登録
```

---

## 7.4 Request

```http
POST https://www.googleapis.com/calendar/v3/calendars/primary/events
Authorization: Bearer {GOOGLE_ACCESS_TOKEN}
Content-Type: application/json
```

### Body

```json
{
  "summary": "A社打ち合わせ",
  "location": "オンライン",
  "description": "A社との打ち合わせ。\n\n元メール: 打ち合わせ日程について\n送信者: sender@example.com",
  "start": {
    "dateTime": "2026-07-15T10:00:00+09:00",
    "timeZone": "Asia/Tokyo"
  },
  "end": {
    "dateTime": "2026-07-15T11:00:00+09:00",
    "timeZone": "Asia/Tokyo"
  }
}
```

---

## 7.5 Responseから保存する項目

| 保存先 | 項目 |
|---|---|
| calendar_logs.google_event_id | id |
| calendar_logs.title | summary |
| calendar_logs.start_datetime | start.dateTime |
| calendar_logs.end_datetime | end.dateTime |
| calendar_logs.location | location |
| calendar_logs.status | created |

---

## 7.6 必要スコープ

MVPでは以下を候補とする。

```text
https://www.googleapis.com/auth/calendar.events
```

---

## 8. LINE Messaging API設計

## 8.1 用途

メール要約結果をユーザーへLINE通知する。

---

## 8.2 使用API

| 処理 | Method | Endpoint |
|---|---|---|
| Push Message | POST | `/v2/bot/message/push` |

---

## 8.3 Request

```http
POST https://api.line.me/v2/bot/message/push
Authorization: Bearer {LINE_CHANNEL_ACCESS_TOKEN}
Content-Type: application/json
```

### Body

```json
{
  "to": "{LINE_USER_ID}",
  "messages": [
    {
      "type": "text",
      "text": "今日のメール要約\n\n【重要】\n1. A社：打ち合わせ日程\n7/15 10:00から打ち合わせがあります。\n\n【処理結果】\n処理件数：8件\n予定登録：1件\nエラー：0件"
    }
  ]
}
```

---

## 8.4 通知本文生成ルール

LINE通知では、以下の順に表示する。

1. 重要メール
2. 通常メール
3. 低重要度メールの件数
4. 予定登録結果
5. エラー概要
6. 処理件数

---

## 8.5 通知失敗時

LINE通知に失敗した場合、以下を `notification_logs` と `error_logs` に保存する。

```json
{
  "channel": "line",
  "status": "failed",
  "error_message": "LINE API request failed"
}
```

---

## 9. Supabase API設計

## 9.1 用途

以下の情報を保存・参照する。

- ワークフロー実行ログ
- メール処理ログ
- カレンダー登録ログ
- エラーログ
- LINE通知ログ
- 重複処理判定

---

## 9.2 使用方式

MVPでは、以下のどちらかを使用する。

| 方式 | 用途 |
|---|---|
| Supabase REST API | n8n HTTP Requestノードから利用 |
| PostgreSQL接続 | n8n PostgreSQLノードから利用 |

初期実装では、SQLの自由度が高いPostgreSQL接続を優先する。

---

## 9.3 重複判定API

### SQL

```sql
select id
from mail_logs
where source = $1
  and message_id = $2
limit 1;
```

### 入力

```json
{
  "source": "gmail",
  "messageId": "18a9xxxxx"
}
```

### 出力

```json
{
  "exists": true,
  "mailLogId": "uuid"
}
```

---

## 9.4 mail_logs保存

### Insert例

```json
{
  "workflow_run_id": "uuid",
  "source": "gmail",
  "message_id": "18a9xxxxx",
  "thread_id": "18a9threadxxxxx",
  "sender_name": "A社 担当者",
  "sender_email": "sender@example.com",
  "subject": "打ち合わせ日程について",
  "body_preview": "来週の打ち合わせについて...",
  "summary": "7/15 10:00からA社との打ち合わせがあります。",
  "priority": "High",
  "category": "schedule",
  "requires_action": true,
  "is_schedule": true,
  "processed_status": "processed",
  "received_at": "2026-07-12T08:00:00+09:00",
  "processed_at": "2026-07-12T08:01:00+09:00"
}
```

---

## 9.5 calendar_logs保存

```json
{
  "mail_log_id": "uuid",
  "google_event_id": "google-event-id",
  "title": "A社打ち合わせ",
  "start_datetime": "2026-07-15T10:00:00+09:00",
  "end_datetime": "2026-07-15T11:00:00+09:00",
  "location": "オンライン",
  "status": "created"
}
```

---

## 9.6 error_logs保存

```json
{
  "workflow_run_id": "uuid",
  "mail_log_id": "uuid",
  "workflow_name": "AI Mail Assistant - Daily Summary",
  "node_name": "Generate AI Summary",
  "source": "gmail",
  "message_id": "18a9xxxxx",
  "error_type": "openai_error",
  "error_message": "OpenAI API request failed",
  "occurred_at": "2026-07-12T08:01:00+09:00"
}
```

---

## 10. APIエラー設計

## 10.1 共通エラー分類

| error_type | 内容 |
|---|---|
| gmail_error | Gmail APIエラー |
| outlook_error | Microsoft Graph APIエラー |
| openai_error | OpenAI APIエラー |
| calendar_error | Google Calendar APIエラー |
| line_error | LINE Messaging APIエラー |
| supabase_error | Supabase保存エラー |
| validation_error | データ検証エラー |
| unknown_error | その他 |

---

## 10.2 HTTPステータス別対応

| ステータス | 意味 | 対応 |
|---|---|---|
| 400 | リクエスト不正 | ログ保存、対象データ確認 |
| 401 | 認証エラー | Credentials確認 |
| 403 | 権限不足 | OAuthスコープ確認 |
| 404 | 対象なし | スキップまたはログ保存 |
| 429 | レート制限 | リトライ |
| 500 | サーバーエラー | リトライ |
| 503 | 一時利用不可 | リトライ |

---

## 10.3 リトライ方針

| API | リトライ回数 | 方針 |
|---|---:|---|
| Gmail API | 3 | 一時障害を想定 |
| Microsoft Graph API | 3 | 一時障害を想定 |
| OpenAI API | 2 | レート制限・一時障害を想定 |
| Google Calendar API | 2 | 重複登録に注意 |
| LINE Messaging API | 2 | 失敗時はnotification_logsへ保存 |
| Supabase | 3 | DB接続失敗を想定 |

---

## 11. 認証情報管理

## 11.1 `.env.example`

```env
OPENAI_API_KEY=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_USER_ID=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=

MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=
MICROSOFT_REFRESH_TOKEN=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

N8N_BASIC_AUTH_USER=
N8N_BASIC_AUTH_PASSWORD=
N8N_ENCRYPTION_KEY=
```

---

## 11.2 管理方針

- 実際のAPIキーはGitHubへコミットしない
- n8n Credentialsを優先して使用する
- `.env.example` にはキー名のみ記載する
- Service Role Keyは外部公開しない
- OAuthトークンはn8n Credentialsで管理する

---

## 12. MVPで利用するAPI

MVPでは以下を使用する。

| 優先度 | API | 用途 |
|---|---|---|
| 1 | Gmail API | Gmail取得 |
| 2 | OpenAI API | 要約・分類 |
| 3 | LINE Messaging API | 通知 |
| 4 | Microsoft Graph API | Outlook取得 |
| 5 | Google Calendar API | 予定登録 |
| 6 | Supabase | ログ保存・重複判定 |

---

## 13. MVPでは利用しないAPI

以下はMVPでは対象外とする。

- Gmail送信API
- Outlook送信API
- Google Drive API
- Slack API
- Teams API
- 独自Web API
- 添付ファイル解析API
- 決済API

---

## 14. テスト観点

| テストID | 対象 | 内容 | 期待結果 |
|---|---|---|---|
| T-API-001 | Gmail API | 未読メール一覧取得 | メールID一覧を取得できる |
| T-API-002 | Gmail API | メール詳細取得 | 件名・本文・差出人を取得できる |
| T-API-003 | Graph API | Outlookメール取得 | Inboxメールを取得できる |
| T-API-004 | OpenAI API | 要約・分類 | JSON形式で返却される |
| T-API-005 | Calendar API | 予定登録 | Google Calendarに予定が作成される |
| T-API-006 | LINE API | Push Message | LINEに通知が届く |
| T-API-007 | Supabase | 重複判定 | 処理済みメールを検出できる |
| T-API-008 | Supabase | ログ保存 | mail_logsに保存できる |
| T-API-009 | 共通 | 認証エラー | error_logsに保存される |
| T-API-010 | 共通 | レート制限 | リトライされる |

---

## 15. 今後の拡張候補

- Slack API連携
- Microsoft Teams API連携
- Google Drive API連携
- Gmail既読化API
- Outlook既読化API
- メール返信文生成API
- Webダッシュボード用API
- 複数ユーザー用OAuth認証API