---
slug: /
---

import ThemedImage from "@theme/ThemedImage";
import useBaseUrl from "@docusaurus/useBaseUrl";

# EnergyIntegration

This platform is designed for heat exchanger network synthesis and is composed of three main parts:

- [EnergyIntegration.jl](https://github.com/EnergyIntegration/EnergyIntegration.jl): the Julia core library for modeling, building, and solving heat exchanger network synthesis problems
- [EnergyIntegrationWebApp.jl](https://github.com/EnergyIntegration/EnergyIntegrationWebApp.jl): the Julia service layer that connects the TypeScript/React frontend to `EnergyIntegration.jl`
- [EnergyIntegrationWebApp](https://github.com/EnergyIntegration/EnergyIntegrationWebApp): the web-based user interface that provides an interactive workflow for building and solving problems

If you want direct access to the computational core and need to embed repeated network solves into your own workflow, start with the Julia package: [EnergyIntegration / Get Started / Creating Streams](./energyintegration/get-started/creating-streams.md).

If you prefer an interactive UI and are primarily solving a smaller number of standalone heat exchanger network synthesis problems, start with the web application: [WebApp / Get Started / Overview](./webapp/get-started/overview.md).

A preview of the WebApp interface is shown below.
<ThemedImage
  className="homepage-preview-image"
  alt="EnergyIntegration homepage preview"
  sources={{
    light: useBaseUrl("/img/homepage-preview-light.png"),
    dark: useBaseUrl("/img/homepage-preview-dark.png"),
  }}
/>
