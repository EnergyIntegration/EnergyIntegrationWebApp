# Frontend / Backend Contract

フロントエンドは `/api` を通じて Julia バックエンドと通信します。

主なエンドポイントは次のとおりです。

- `POST /api/streams`: ストリームと interval のペイロードから HEN を構築する
- `POST /api/solve`: 現在構築済みの HEN を求解する
- `GET /api/results/match`: hot / cold match の detail matrix を取得する
- `GET /api/results/stream`: stream detail view を取得する
- `POST /api/streamsets`: streamset スナップショットを保存する

フロントエンドは `X-API-Key` ヘッダーまたはクエリパラメータによる任意の API キー認証にも対応しています。

UI 側ではアクティブな `hen_id` を状態として保持し、detail view や solve 結果の取得時に利用します。
