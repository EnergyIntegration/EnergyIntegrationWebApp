# Running The App

To start the frontend locally:

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to the Julia backend at `http://127.0.0.1:8001`.

To build the frontend:

```bash
npm run build
```

This generates `dist/`, which is later packaged for the Julia backend service.

If the backend is protected with an API key, the frontend will prompt for it and store it in local storage.
