# EnergyIntegrationWebApp

EnergyIntegrationWebApp is the frontend UI for the EnergyIntegration workflow. It talks to the Julia backend and provides a browser-based interface to build streams, run the model, and visualize results over `/api`.

Related packages and repos:

- EnergyIntegration.jl: the core Julia library and algorithms.
- EnergyIntegrationWebApp.jl: the Julia backend service that exposes `/api` and
  serves this frontend's built assets via Julia Artifacts.

## Tech stack

- React + TypeScript
- Vite
- Plotly

## Development

```bash
npm install
npm run dev
```

The dev server proxies `/api` to the Julia backend.

## Build

```bash
npm run build
```

This generates `dist/`, which is packaged into `tar.gz` and published to GitHub
Releases for the Julia backend to consume via Artifacts.
