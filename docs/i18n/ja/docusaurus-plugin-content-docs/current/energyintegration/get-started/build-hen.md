import FunctionDoc from "@site/src/components/FunctionDoc";

# 熱交換ネットワークの構築

この段階では、すでに次のような準備ができているはずです。

```julia
using EnergyIntegration
using Unitful: °C
stream_data = [...]
config = IntervalsConfig()
```

次に、以下のようにして熱交換ネットワークオブジェクトを構築します。

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
  summary="温度グリッド、バケッティング、カスケード、問題表、前処理の各ステップを通して、`EIStream` の集合を安定した `HeatExchangerNetwork` に変換します。"
  arguments={[
    {
      name: "streams",
      type: "Vector{EIStream}",
      description: "SI 単位で定義された高温流体と低温流体の集合です。",
    },
  ]}
  keywordArguments={[
    {
      name: "config",
      type: "IntervalsConfig",
      description: "温度区間の構築方法とアルゴリズムに関する設定です。`config.use_clapeyron == true` の場合は、`mixture` も指定する必要があります。",
      defaultValue: "IntervalsConfig()",
    },
    {
      name: "mixture",
      description: "物性値評価に用いる Clapeyron EOS モデルです。Clapeyron ベースの物性計算を無効にする場合は `nothing` を指定します。",
      defaultValue: "nothing",
    },
    {
      name: "assign",
      type: "Union{Nothing,Dict{Symbol,Int}}",
      description: "ストリーム名からストリーム添字への任意の対応付けです。自動の名前対応を上書きしたい場合に使用します。",
      defaultValue: "nothing",
    },
  ]}
  returns={{
    type: "HeatExchangerNetwork",
    description: "`streams`、`intervals_cfg`、`T_nodes`、`buckets`、`table`、`composite`、`registry`、`result` を保持するコンテナです。",
  }}
  example={`prob = build_hen(stream_data; config=IntervalsConfig())`}
/>

この段階を終えると、いくつかのフィールドを直接確認できるようになります。

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
`HU1` と `CU1` は流量がまだ決まっていないユーティリティ流体であるため、熱負荷は `? kW` と表示されます。最適化の完了後に再度 `prob.streams` を確認すると、最適値が表示されます。
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

問題表 (`prob.table`) と複合曲線表 (`prob.composite`) が得られたので、次の自然なステップは、それらを複合曲線および総合複合曲線として可視化することです。続きは次の節を参照してください。
