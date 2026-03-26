# Frontend / Backend Contract

The frontend communicates with the Julia backend over `/api`.

The main endpoints are:

- `POST /api/streams`: build a HEN from stream and interval payloads
- `POST /api/solve`: solve the currently built HEN
- `GET /api/results/match`: fetch the detail matrix for a hot/cold match
- `GET /api/results/stream`: fetch a stream detail view
- `POST /api/streamsets`: save a streamset snapshot

The frontend also supports optional API-key-based access control through the `X-API-Key` header or query parameter.

The frontend stores the active `hen_id` in UI state and uses it when loading detail views and solve results.
