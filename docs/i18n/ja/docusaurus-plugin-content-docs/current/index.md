---
slug: /
---

import ThemedImage from "@theme/ThemedImage";
import useBaseUrl from "@docusaurus/useBaseUrl";

# EnergyIntegration

このプラットフォームは、熱交換ネットワーク合成のために設計されており、主に次の 3 つの要素で構成されています。

- [EnergyIntegration.jl](https://github.com/EnergyIntegration/EnergyIntegration.jl): 熱交換ネットワーク合成問題のモデリング、構築、求解を担う Julia コアライブラリ
- [EnergyIntegrationWebApp.jl](https://github.com/EnergyIntegration/EnergyIntegrationWebApp.jl): TypeScript / React 製フロントエンドと `EnergyIntegration.jl` をつなぐ Julia サービス層
- [EnergyIntegrationWebApp](https://github.com/EnergyIntegration/EnergyIntegrationWebApp): 問題の構築と求解を対話的に行うための Web ベース UI

計算の中核に直接アクセスし、ネットワークの求解を自分のワークフローに組み込みたい場合、たとえば異なる条件で繰り返し問題を解きたい場合は、まず Julia パッケージから始めることをおすすめします: [EnergyIntegration / Get Started / Creating Streams](./energyintegration/get-started/creating-streams.md).

対話的な UI を使って、比較的少数の独立した熱交換ネットワーク合成問題を解きたい場合は、Web アプリケーションから始めるのが最も扱いやすい選択です: [WebApp / Get Started / Overview](./webapp/get-started/overview.md).

WebApp の画面プレビューを以下に示します。

<ThemedImage
  className="homepage-preview-image"
  alt="EnergyIntegration homepage preview"
  sources={{
    light: useBaseUrl("/img/homepage-preview-light.png"),
    dark: useBaseUrl("/img/homepage-preview-dark.png"),
  }}
/>
