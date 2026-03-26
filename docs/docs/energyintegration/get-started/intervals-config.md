import FunctionDoc from "@site/src/components/FunctionDoc";

# Intervals Configuration

<FunctionDoc
  name="IntervalsConfig"
  signature={`IntervalsConfig(;
      forbidden_match   = Dict{Tuple{Symbol,Symbol}, Tuple{Float64,Float64}}(),
      node_rule         = :both,
      T_interval_method = :default,
      T_nodes_specified = Float64[],
      maxΔT             = 0,
      maxnumT           = 0,
      mvr_config        = MVRConfig(),
      use_clapeyron     = false
  )`}
  language="julia"
  summary="Create an interval-construction configuration object for `build_hen`."
  keywordArguments={[
    {
      name: "forbidden_match",
      type: "Dict{Tuple{Symbol,Symbol},Tuple{Float64,Float64}}",
      description: "Rules that prevent specific stream pairs from being matched, optionally with associated numeric bounds.",
      defaultValue: "Dict{Tuple{Symbol,Symbol},Tuple{Float64,Float64}}()",
    }, {
      name: "node_rule",
      type: "Symbol",
      description: "Rule used to decide which temperature nodes are inserted when constructing the interval grid.",
      defaultValue: ":both",
    }, {
      name: "T_interval_method",
      type: "Symbol",
      description: "Method used to build the temperature-interval structure.",
      defaultValue: ":default",
    }, {
      name: "T_nodes_specified",
      type: "Vector{Float64}",
      description: "User-specified temperature nodes to include explicitly in the interval construction.",
      defaultValue: "Float64[]",
    },
    {
      name: "maxΔT",
      type: "Number",
      description: "Maximum temperature span allowed when subdividing or refining intervals.",
      defaultValue: "0",
    }, {
      name: "maxnumT",
      type: "Integer",
      description: "Upper bound on the number of generated temperature nodes or intervals.",
      defaultValue: "0",
    }, {
      name: "mvr_config",
      type: "MVRConfig",
      description: "Configuration object for MVR-related interval handling.",
      defaultValue: "MVRConfig()",
    }, {
      name: "use_clapeyron",
      type: "Bool",
      description: "Whether to use Clapeyron-based property calculations instead of the simpler default path.",
      defaultValue: "false",
    },
  ]}
  returns={{
    type: "IntervalsConfig",
    description: "An `IntervalsConfig` instance that can be passed into `build_hen`.",
  }}
  example={`config = IntervalsConfig(
    node_rule=:both,
    T_interval_method=:default,
    maxΔT=10,
    maxnumT=20)`}
/>

In practice, you only need to adjust this configuration when you want to control how temperature nodes are generated, limit interval refinement, explicitly specify temperature nodes, or enable more specialized thermodynamic handling.

For the 4SP1 example, the default settings are sufficient. After defining `stream_data`, you only need to write:
```julia
config = IntervalsConfig()
```

This creates the interval-configuration object that will later be passed into `build_hen`.
