# Supabase migrations

Supabaseへ順番に適用するSQL migrationを配置します。

- 適用済みmigrationは書き換えず、変更は新しいファイルとして追加する
- ファイル名は `<UTC timestamp>_<description>.sql` とする
- migrationごとに影響範囲とロールバック方法を確認する
- 秘密情報や本番データを含めない

このディレクトリを追加するIssueではSQL migrationを作成しません。
