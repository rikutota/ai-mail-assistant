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
| `purge-expired-logs.json` | JST基準で90日を超えたログを外部キー順に削除 | import後に`supabase-postgres-ai-mail-test`を割り当てる |

保守workflowは`LOG_RETENTION_DRY_RUN=true`で件数だけ確認し、対象件数のレビュー後に実行環境で`false`へ変更する。
