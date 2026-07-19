# n8n workflows

n8nからエクスポートしたworkflow JSONを配置します。

- 1ファイルにつき1workflowとする
- ファイル名は小文字のkebab-caseとする
- credential ID、接続情報、実行データ、メール本文を含めない
- JSONの追加・変更は、対象Issueで明示された場合だけ行う

このディレクトリを追加するIssueではworkflow JSONを作成しません。

## Workflow一覧

| ファイル | 用途 | Credential |
| --- | --- | --- |
| `gmail-fetch-unread.json` | Inboxの未読・直近24時間メールを取得し共通形式へ正規化 | import後に`gmail-oauth2-ai-mail-test`を割り当てる |
| `outlook-fetch-unread.json` | Inboxの未読・直近24時間Outlookメールを既読化せず取得 | import後に`microsoft-outlook-oauth2-ai-mail-test`を割り当てる |
| `outlook-normalize-message.json` | Outlook応答を共通メール形式へ正規化 | 不要 |
