# System Overview

製品全体は、次の 3 層として捉えると分かりやすくなります。

## 1. Core Library

`EnergyIntegration.jl` は、ドメインモデル、問題構築、最適化ロジック、結果生成を担います。

## 2. Backend Service

`EnergyIntegrationWebApp.jl` は、そのコアライブラリを Julia の Web サービスとして包みます。`/api` を公開し、構築済み HEN をサーバーメモリに保持し、事前ビルド済みフロントエンド資産も配信します。

## 3. Frontend

`EnergyIntegrationWebApp` はブラウザ向け UI です。ユーザー入力を集め、バックエンド API を呼び出し、プロット、テーブル、レポート、詳細ビューを表示します。

この分離により、数値計算とモデリングロジックは Julia 側に保ちつつ、Web UI は操作性と可視化に集中できます。
