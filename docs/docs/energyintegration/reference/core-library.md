# Core Library

The `EnergyIntegration` library is the computational center of the product family.

It is the layer that turns stream data and configuration objects into:

- a buildable HEN representation
- solver-ready optimization problems
- result objects that can be rendered by the backend and frontend

The WebApp does not replace this layer. Instead, it provides a UI for constructing payloads and reading the outputs produced by the Julia side.

As this shared docs site grows, this section should become the home for:

- Julia package installation
- core APIs and types
- modeling configuration details
- solving and reporting behavior
