# 流股の作成

この節では、古典的な 4SP1 の例 [@papoulias1983] を用いて、`EnergyIntegration.jl` の基本的な使い方を説明します。

以下に示す四流問題 1（4SP1）を考えます。<TableRef to="tbl-4sp1" label="表" /> の流股データは @papoulias1983 に基づいています。

<Figure
  id="tbl-4sp1"
  kind="table"
  label="表"
  caption="4SP1 問題のデータ。"
>
  <table style={{ display: "table", width: "100%", tableLayout: "fixed" }}>
    <thead>
      <tr>
        <th style={{ width: "30%" }}>Streams</th>
        <th>FCp (kW/°C)</th>
        <th>Ts (°C)</th>
        <th>Tt (°C)</th>
        <th>Q (kW)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style={{ width: "30%" }}>C1 (Cold)</td>
        <td>7.62</td>
        <td>60</td>
        <td>160</td>
        <td>+762</td>
      </tr>
      <tr>
        <td style={{ width: "30%" }}>H2 (Hot)</td>
        <td>8.79</td>
        <td>160</td>
        <td>93</td>
        <td>-589</td>
      </tr>
      <tr>
        <td style={{ width: "30%" }}>C3 (Cold)</td>
        <td>6.08</td>
        <td>116</td>
        <td>260</td>
        <td>+876</td>
      </tr>
      <tr>
        <td style={{ width: "30%" }}>H4 (Hot)</td>
        <td>10.55</td>
        <td>249</td>
        <td>138</td>
        <td>-1171</td>
      </tr>
      <tr>
        <td style={{ width: "30%" }}>S (Steam)</td>
        <td></td>
        <td>270</td>
        <td>270</td>
        <td></td>
      </tr>
      <tr>
        <td style={{ width: "30%" }}>CW (Cooling water)</td>
        <td></td>
        <td>38</td>
        <td>82</td>
        <td></td>
      </tr>
    </tbody>
  </table>
</Figure>

## プロセス流股

プロセス流股について、このフレームワークでは少なくとも次のパラメータが必要です。
- 流股名
- 流量（質量基準またはモル基準）, `F`
- 入口温度, `Tin`
- 出口温度, `Tout`
- 片側温度寄与, `Tcont`
- エンタルピー多項式の 6 係数, `Hcoeff`
- 総括伝熱係数, `HTC`

たとえば次のように定義します。

```julia
using EnergyIntegration
using Unitful: °C
Cold(:C1, F=1u"kmol/s", Tin=60°C, Tout=160°C, Tcont=5°C, Hcoeff=(0, 7.62, 0, 0, 0, 0), HTC=1u"kW/(K*m^2)")
```

ここでいう片側温度寄与とは、最小接近温度差を 2 つに分け、熱側と冷側にそれぞれ割り当てるための値です。熱流股と冷流股が熱交換するとき、その間の最小温度差は、それぞれの `Tcont` の和として扱われます。

`Hcoeff` は 6 要素のタプルであり、<EqRef to="eq-hcoeff" label="式" /> で与えられるエンタルピー多項式に用いられます。

<Equation
  id="eq-hcoeff"
  formula="H(T) = a_0 + a_1 T + a_2 T^2 + a_3 T^3 + a_4 T^4 + a_5 T^5"
/>

第 2 要素は、定圧モル熱容量または定圧比熱容量に対応します。多くの場合、流股のモル熱容量や比熱容量は定数とみなせるため、その場合は `Hcoeff` の第 2 要素だけを与え、残りは 0 にしておけば十分です。

このことから分かるように、文献に掲載されている流股データ表の多くは、そのままではこのフレームワークに直接対応しません。したがって、まずデータの変換が必要になります。<TableRef to="tbl-4sp1" label="表" /> における `FCp` は熱容量流量を表し、モル流量と定圧モル熱容量の積、あるいは質量流量と比熱容量の積に相当します。一方、このフレームワークでは流量と定圧モル熱容量（または比熱容量）を明示的に指定する必要があります。そのため、文献データは 2 つの量に分解しなければなりません。この分け方自体は任意です。たとえば `FCp = 7.62 kW/°C` であれば、`F = 1 kmol/s`、モル熱容量を `7.62 J/K` としてもよいですし、`F = 7.62 kmol/s`、モル熱容量を `1 J/K` としても構いません。結果は変わりません。

もう 1 つ注意したいのは、<TableRef to="tbl-4sp1" label="表" /> における記号の意味です。ここで *Ts* は供給温度、*Tt* は目標温度を表します。熱交換ネットワークの文脈では、供給温度は入口温度、目標温度は出口温度と同義です。したがって、C1 流股については `Tin = 60°C`、`Tout = 160°C` と設定します。

最小接近温度差は `10 K` と仮定し、それを熱側と冷側に等分するので、`Tcont = 5°C` とします。元論文には各流股の総括伝熱係数は与えられていません。これは、この例が経済最適化ではなくエネルギー目標の計算を目的としているためです。そのため、本例では単純に `HTC = 1u"kW/(K*m^2)"` と仮定します。

以上の仮定のもとで、4 本のプロセス流股は次のように定義できます。

```julia
Cold(:C1, F=1u"kmol/s", Tin=60°C, Tout=160°C, Tcont=5°C,
    Hcoeff=(0, 7.62, 0, 0, 0, 0), HTC=1u"kW/(K*m^2)"
),
Hot(:H2, F=1u"kmol/s", Tin=160°C, Tout=93°C, Tcont=5°C,
    Hcoeff=(0, 8.791, 0, 0, 0, 0), HTC=1u"kW/(K*m^2)"
),
Cold(:C3, F=1u"kmol/s", Tin=116°C, Tout=260°C, Tcont=5°C,
    Hcoeff=(0, 6.0833, 0, 0, 0, 0), HTC=1u"kW/(K*m^2)"
),
Hot(:H4, F=1u"kmol/s", Tin=249°C, Tout=138°C, Tcont=5°C,
    Hcoeff=(0, 10.54954, 0, 0, 0, 0), HTC=1u"kW/(K*m^2)"
),
```

## ユーティリティ

<TableRef to="tbl-4sp1" label="表" /> には、熱ユーティリティとしての蒸気と、冷ユーティリティとしての冷却水も含まれています。ただし、これらの熱負荷 `Q` は未知であり、`FCp` も与えられていません。このフレームワークの文脈では、これは蒸気と冷却水の*流量が固定されていない*ことを意味します。一方で、それらのモル熱容量や比熱容量は定数として扱われます。所定の温度・圧力条件のもとでは、蒸気や水の熱容量は物性値であり、最適化の都合で自由に変わるものではないからです。

この状況を表現するには、流量を範囲として与えます。するとフレームワークは、その流量を自動的に*決定変数*として扱います。

```julia
F=(0u"kmol/s", 1000u"kmol/s") # F isa Tuple{Number,Number}
```

蒸気はほぼ一定温度のまま放熱するため、`Tin = Tout` になります。この場合、流股が放出する熱量は熱容量ではなく、モル基準または質量基準の蒸発潜熱によって決まります。したがって、`Tin = Tout` となる流股では、熱容量係数ではなく潜熱パラメータを与えるべきです。蒸気流股の完全な定義は次のとおりです。

```julia
Hot(:HU1, F=(0u"kmol/s", 1000u"kmol/s"), Tin=270°C, Tout=270°C, Tcont=5°C,
    Hvap=100u"kJ/kmol", HTC=100u"kW/(K*m^2)",
    cost=200u"(kJ*yr)^-1", pricing_basis=:energy
),
```

ここでは蒸気流股が `Tin = Tout` であるため、`Hcoeff` ではなく `Hvap` を指定しています。`Hcoeff` を与えたとしても、自動的に無視されます。

ユーティリティは通常無料ではないため、`cost` キーワード引数で価格を設定します。`pricing_basis` には `:energy` と `:flowrate` の 2 種類があります。古典的な熱交換ネットワーク合成問題では、エネルギー基準の課金が一般的です。ここでは `cost = 200u"(kJ*yr)^-1"` としており、ユーティリティを `1 kJ` 使用するごとに 200 単位の通貨が必要であることを意味します。

同様に、冷却水流股は次のように設定できます。

```julia
Cold(:CU1, F=(0u"kmol/s", 1000u"kmol/s"), Tin=38°C, Tout=82°C, Tcont=5°C,
    Hcoeff=(0, 1.0, 0, 0, 0, 0), HTC=100u"kW/(K*m^2)",
    cost=20u"(kJ*yr)^-1", pricing_basis=:energy
),
```

最後に、これまでに定義したすべての流股を 1 つのベクトル `stream_data = [...]` にまとめます。すると次のようになります。

```julia
stream_data = [
    Cold(:C1, F=1u"kmol/s", Tin=60°C, Tout=160°C, Tcont=5°C,
        Hcoeff=(0, 7.62, 0, 0, 0, 0), HTC=100u"kW/(K*m^2)"
    ),
    Hot(:H2, F=1u"kmol/s", Tin=160°C, Tout=93°C, Tcont=5°C,
        Hcoeff=(0, 8.791, 0, 0, 0, 0), HTC=100u"kW/(K*m^2)"
    ),
    Cold(:C3, F=1u"kmol/s", Tin=116°C, Tout=260°C, Tcont=5°C,
        Hcoeff=(0, 6.0833, 0, 0, 0, 0), HTC=100u"kW/(K*m^2)"
    ),
    Hot(:H4, F=1u"kmol/s", Tin=249°C, Tout=138°C, Tcont=5°C,
        Hcoeff=(0, 10.54954, 0, 0, 0, 0), HTC=100u"kW/(K*m^2)"
    ),
    Hot(:HU1, F=(0u"kmol/s", 1000u"kmol/s"), Tin=270°C, Tout=270°C, Tcont=5°C,
        Hvap=100u"kJ/kmol", HTC=100u"kW/(K*m^2)",
        cost=200u"(kJ*yr)^-1", pricing_basis=:energy
    ),
    Cold(:CU1, F=(0u"kmol/s", 1000u"kmol/s"), Tin=38°C, Tout=82°C, Tcont=5°C,
        Hcoeff=(0, 1.0, 0, 0, 0, 0), HTC=100u"kW/(K*m^2)",
        cost=20u"(kJ*yr)^-1", pricing_basis=:energy
    )
]
```

## まとめ

この節では、流股の定義方法を説明し、4SP1 を例として、文献中のデータを `EnergyIntegration` が受け付けるデータ構造へどのように変換するかを示しました。多くの場合、文献データには何らかの変換が必要です。これは、`EnergyIntegration` がより汎用的に設計されており、流量と熱容量を分離して扱うことで、より広い場面に適用できるようにしているためです。

次節では温度区間パラメータの設定方法を扱い、その後 `build_hen` による熱交換ネットワークの構築へ進みます。

## References
<!-- bibliography injected by rehype-citation -->
