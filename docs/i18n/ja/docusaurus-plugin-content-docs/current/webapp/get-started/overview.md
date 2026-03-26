# Overview

EnergyIntegrationWebApp は、EnergyIntegration スタックのフロントエンド層です。

大まかな流れは次のとおりです。

1. React アプリがストリーム定義と最適化設定を受け取る
2. フロントエンドが入力を JSON ペイロードへ変換し、`/api` 経由で Julia バックエンドへ送る
3. バックエンドが HEN モデルを構築・求解し、プロット、レポート、結果行列を返す

プロジェクトの分担は次のようになっています。

- `EnergyIntegrationWebApp`: React + TypeScript のフロントエンド
- `EnergyIntegrationWebApp.jl`: `/api` を公開する Julia サービス
- `EnergyIntegration.jl`: コアとなる Julia アルゴリズムとデータ構造

このセクションでは、ブラウザアプリ自身の UI フロー、フロントエンド開発、バックエンド接続点を扱います。
