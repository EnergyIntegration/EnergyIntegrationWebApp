import FunctionDoc from "@site/src/components/FunctionDoc";

# 温度区間設定

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
  summary="`build_hen` に渡すための温度区間構成オブジェクトを作成します。"
  keywordArguments={[
    {
      name: "forbidden_match",
      type: "Dict{Tuple{Symbol,Symbol},Tuple{Float64,Float64}}",
      description: "特定の流股ペアをマッチ対象から除外し、必要に応じて数値的な制約も併せて与えるためのルールです。",
      defaultValue: "Dict{Tuple{Symbol,Symbol},Tuple{Float64,Float64}}()",
    }, {
      name: "node_rule",
      type: "Symbol",
      description: "温度区間グリッドを構築する際に、どの温度ノードを挿入するかを決めるルールです。",
      defaultValue: ":both",
    }, {
      name: "T_interval_method",
      type: "Symbol",
      description: "温度区間構造を組み立てる方法を指定します。",
      defaultValue: ":default",
    }, {
      name: "T_nodes_specified",
      type: "Vector{Float64}",
      description: "温度区間構築時に明示的に含めたい温度ノードを指定します。",
      defaultValue: "Float64[]",
    },
    {
      name: "maxΔT",
      type: "Number",
      description: "区間の分割や細分化を行う際に許容する最大温度幅です。",
      defaultValue: "0",
    }, {
      name: "maxnumT",
      type: "Integer",
      description: "生成される温度ノード数または区間数の上限です。",
      defaultValue: "0",
    }, {
      name: "mvr_config",
      type: "MVRConfig",
      description: "MVR に関連する温度区間処理のための設定オブジェクトです。",
      defaultValue: "MVRConfig()",
    }, {
      name: "use_clapeyron",
      type: "Bool",
      description: "より単純な既定経路の代わりに、Clapeyron ベースの物性計算を使うかどうかを指定します。",
      defaultValue: "false",
    },
  ]}
  returns={{
    type: "IntervalsConfig",
    description: "`build_hen` に渡せる `IntervalsConfig` インスタンスを返します。",
  }}
  example={`config = IntervalsConfig(
    node_rule=:both,
    T_interval_method=:default,
    maxΔT=10,
    maxnumT=20,
)`}
/>

実際にこの設定を調整する必要があるのは、温度ノードの生成方法を制御したい場合、区間の細分化に制限をかけたい場合、温度ノードを明示的に指定したい場合、あるいはより特殊な熱物性の扱いを有効にしたい場合です。

4SP1 の例では、既定の設定だけで十分です。`stream_data` を定義したあとに、次の 1 行を書けば足ります。

```julia
config = IntervalsConfig()
```

これにより、あとで `build_hen` に渡す温度区間設定オブジェクトが作成されます。
