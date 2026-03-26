# Build, Solve, And Inspect Results

The main frontend workflow has four stages:

## 1. Streams

In the Streams step, you define hot and cold streams, choose the stream kind, and configure interval options.

## 2. Build / Inspect

After clicking `Build HEN`, the frontend sends the stream payload to the backend and receives:

- a stored `hen_id`
- a composite curve plot
- summary statistics
- a problem table and composite data for inspection

## 3. Solve

In the Solve step, the frontend submits the active `hen_id` and waits for optimization results. The console panel streams backend logs while the solver runs.

## 4. Results

The Results step shows:

- the objective value
- solution and economic reports
- the hot/cold match matrix
- per-match detail matrices
- per-stream detail views

This allows the frontend to stay responsive while the Julia backend owns the model lifecycle.
