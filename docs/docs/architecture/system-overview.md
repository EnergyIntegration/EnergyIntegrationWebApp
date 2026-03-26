# System Overview

The full product is easiest to understand as a three-layer system:

## 1. Core Library

`EnergyIntegration.jl` owns the domain model, problem construction, optimization logic, and result materialization.

## 2. Backend Service

`EnergyIntegrationWebApp.jl` wraps the core library in a Julia web service. It exposes `/api`, keeps built HEN objects in server memory, and serves the prebuilt frontend assets.

## 3. Frontend

`EnergyIntegrationWebApp` is the browser interface. It collects user inputs, calls the backend API, and renders plots, tables, reports, and detail views.

This separation keeps the numerical and modeling logic in Julia while letting the web UI focus on interaction and presentation.
