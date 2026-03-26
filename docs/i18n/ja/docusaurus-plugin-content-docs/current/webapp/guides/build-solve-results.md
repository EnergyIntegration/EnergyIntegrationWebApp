# Build, Solve, And Inspect Results

フロントエンドの主な流れは 4 段階です。

## 1. Streams

Streams ステップでは、hot / cold ストリームを定義し、stream kind を選び、interval の設定を行います。

## 2. Build / Inspect

`Build HEN` をクリックすると、フロントエンドはストリームのペイロードをバックエンドへ送り、次を受け取ります。

- 保持された `hen_id`
- composite curve のプロット
- summary 統計
- problem table と composite データ

## 3. Solve

Solve ステップでは、フロントエンドが現在の `hen_id` を送信し、最適化結果を待ちます。ソルバー実行中は console パネルにバックエンドログが流れます。

## 4. Results

Results ステップでは次を表示します。

- 目的関数値
- solution / economic report
- hot / cold の match matrix
- 各 match の detail matrix
- 各 stream の detail view

これにより、モデルのライフサイクルは Julia バックエンド側で管理しつつ、フロントエンドは操作しやすい UI を保てます。
