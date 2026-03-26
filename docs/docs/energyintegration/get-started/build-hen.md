import FunctionDoc from "@site/src/components/FunctionDoc";

# Building a Heat Exchanger Network

At this point, you should already have something like the following:

```julia
using EnergyIntegration
using Unitful: °C
stream_data = [...]
config = IntervalsConfig()
```

You can then build a heat exchanger network object with:

```julia
prob = build_hen(stream_data; config)
```

<FunctionDoc
  name="build_hen"
  signature={`build_hen(streams;
      config  = IntervalsConfig(),
      mixture = nothing,
      assign  = nothing
  )`}
  language="julia"
  summary="Pack a set of `EIStream` objects through the temperature-grid, bucketing, cascade, problem-table, and preprocessing pipeline into a stable `HeatExchangerNetwork`."
  arguments={[
    {
      name: "streams",
      type: "Vector{EIStream}",
      description: "List of hot and cold streams defined in SI units.",
    },
  ]}
  keywordArguments={[
    {
      name: "config",
      type: "IntervalsConfig",
      description: "Configuration for temperature intervals and algorithms. If `config.use_clapeyron == true`, a `mixture` must be provided.",
      defaultValue: "IntervalsConfig()",
    },
    {
      name: "mixture",
      description: "Clapeyron EOS model or models used for property evaluation. Use `nothing` to disable Clapeyron.",
      defaultValue: "nothing",
    },
    {
      name: "assign",
      type: "Union{Nothing,Dict{Symbol,Int}}",
      description: "Optional mapping from stream names to indices to override automatic mapping.",
      defaultValue: "nothing",
    },
  ]}
  returns={{
    type: "HeatExchangerNetwork",
    description: "A container holding `streams`, `intervals_cfg`, `T_nodes`, `buckets`, `table`, `composite`, `registry`, and `result`.",
  }}
  example={`prob = build_hen(stream_data; config=IntervalsConfig())`}
/>

Once this step is complete, there are several fields you can inspect directly.

`prob.streams`

```julia
6-element Vector{EIStream}:
 C1      Common   333.15 K          -> 433.15 K            762.0 kW ( 4, 9)
 H2      Common   433.15 K          -> 366.15 K            589.0 kW ( 5, 7)
 C3      Common   389.15 K          -> 533.15 K            876.0 kW ( 2, 6)
 H4      Common   522.15 K          -> 411.15 K           1171.0 kW ( 3, 5)
 HU1     Isoth..  543.15 K                                     ? kW ( 1)
 CU1     Common   311.15 K          -> 355.15 K                ? kW ( 9,10)
```

:::note
Because `HU1` and `CU1` are utility streams whose flow rates are still to be determined, their heat duties are shown as `? kW`. After the optimization step is complete, inspecting `prob.streams` again will show the optimal values.
:::

`prob.table`

```julia
─────────────────────────────────────────────────────────────────────────────
 Row        H2        H4        C1        C3  heat_cascade  T_upper  T_lower 
─────────────────────────────────────────────────────────────────────────────
   1         -         -         -         -             -   538.15   538.15
   2         -         -         -  127750.0      127750.0   538.15   517.15
   3         -  833410.0         -  480580.0     -352830.0   517.15   438.15
   4         -  105500.0   76200.0   60833.0       31538.0   438.15   428.15
   5  193400.0  232090.0  167640.0  133830.0     -124020.0   428.15   406.15
   6  105490.0         -   91440.0   73000.0       58948.0   406.15   394.15
   7  290100.0         -  251460.0         -      -38643.0   394.15   361.15
   8         -         -    7620.0         -        7620.0   361.15   360.15
   9         -         -  167640.0         -      167640.0   360.15   338.15
  10         -         -         -         -             -   338.15   316.15
─────────────────────────────────────────────────────────────────────────────
```

`prob.composite`

```julia
────────────────────────────────────────
 Row      hot    cold  feasible_hc    T 
────────────────────────────────────────
   1        0       0       127749  538
   2        0  127749       127749  538
   3  -833414  480581            0  517
   4  -105495  137033       352833  438
   5  -425492  301473       321295  428
   6  -105492  164440       445315  406
   7  -290103  251460       386367  394
   8        0    7620       425010  361
   9        0  167640       417390  360
  10        0       0       249750  338
  11        0       0       249750  316
────────────────────────────────────────
```

`prob.intervals_cfg.forbidden_match`

```julia
Dict{Tuple{Symbol, Symbol}, Tuple{Float64, Float64}}()
```

Now that we have both the problem table (`prob.table`) and the composite-curve table (`prob.composite`), the natural next step is to visualize them as composite-curve and grand composite-curve plots. See the next section.
