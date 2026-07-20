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
| `supabase-store-mail.json` | AI分析前の処理権確保と分析後の結果確定 | import後に`supabase-postgres-ai-mail-test`を割り当てる |
| `openai-analyze-email.json` | Responses APIのStructured Outputsでメールを分析 | `OPENAI_API_KEY`を実行環境へ設定する |
| `gmail-fetch-unread.json` | Inboxの未読・直近24時間メールを取得し共通形式へ正規化 | import後に`gmail-oauth2-ai-mail-test`を割り当てる |
| `purge-expired-logs.json` | JST基準で90日を超えたログを外部キー順に削除 | import後に`supabase-postgres-ai-mail-test`を割り当てる |
| `google-calendar-register-event.json` | 検証済み予定を冪等登録し結果を保存 | import後にCalendarとPostgresの各Credentialを割り当てる |
| `line-daily-digest.json` | JST日次でメール結果を集約しLINEへ一度だけ通知 | import後にLINE Header AuthとPostgresの各Credentialを割り当てる |

保守workflowは`LOG_RETENTION_DRY_RUN=true`で件数だけ確認し、対象件数のレビュー後に実行環境で`false`へ変更する。
