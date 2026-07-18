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
| `supabase-store-mail.json` | メール処理権を原子的に確保し、分析結果を保存 | import後に`supabase-postgres-ai-mail-test`を割り当てる |
