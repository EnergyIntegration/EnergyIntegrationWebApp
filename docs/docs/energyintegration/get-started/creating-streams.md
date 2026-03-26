# Creating Streams

In this section, we will use the classic 4SP1 example [@papoulias1983] to show you how to work with `EnergyIntegration.jl`.

Consider the four-stream problem 1 (4SP1) shown below. The stream data in <TableRef to="tbl-4sp1" /> are taken from @papoulias1983.

<Figure
  id="tbl-4sp1"
  kind="table"
  caption="Data for problem 4SP1."
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

## Process Streams

For process streams, the framework requires at least the following parameters:
- stream name
- stream flow rate, on either a mass or molar basis, `F`
- inlet temperature, `Tin`
- outlet temperature, `Tout`
- per-side temperature contribution, `Tcont`
- the six coefficients of the enthalpy polynomial, `Hcoeff`
- heat-transfer coefficient, `HTC`

For example:

```julia
using EnergyIntegration
using Unitful: °C
Cold(:C1, F=1u"kmol/s", Tin=60°C, Tout=160°C, Tcont=5°C, Hcoeff=(0, 7.62, 0, 0, 0, 0), HTC=1u"kW/(K*m^2)")
```

Here, the per-side temperature contribution is used to split the minimum approach temperature into two parts, one assigned to the hot side and the other to the cold side. When a hot stream exchanges heat with a cold stream, the minimum temperature difference between them is treated as the sum of their individual `Tcont` values.

`Hcoeff` is a six-element tuple and is used in <EqRef to="eq-hcoeff" />:

<Equation
  id="eq-hcoeff"
  formula="H(T) = a_0 + a_1 T + a_2 T^2 + a_3 T^3 + a_4 T^4 + a_5 T^5"
/>

Its second element is the constant-pressure molar or mass heat capacity. In most cases, the molar or mass heat capacity of a stream can be treated as a constant. When that is the case, you only need to provide the second element of `Hcoeff` and set the remaining elements to zero.

This also means that the stream tables commonly reported in the literature cannot usually be used directly in this framework, so some data conversion is required first. In Table 1, `FCp` is the heat-capacity flowrate, i.e. the product of the molar flowrate and the constant-pressure molar heat capacity, or equivalently the product of the mass flowrate and the specific heat capacity. In this framework, however, the stream flow rate and the constant-pressure molar or mass heat capacity must be specified explicitly. You therefore need to split the published data into those two parts. The split itself is arbitrary. For example, if `FCp = 7.62 kW/°C`, you may set `F = 1 kmol/s` and the molar heat capacity to `7.62 J/(kmol*K)`, or set `F = 7.62 kmol/s` and the molar heat capacity to `1 J/(kmol*K)`. The result will be the same.

Another point worth noting is the notation used in Table 1. Here, *Ts* denotes the *supply temperature* and *Tt* denotes the *target temperature*. In the context of heat exchanger networks, *supply temperature* is equivalent to *inlet temperature*, and *target temperature* is equivalent to *outlet temperature*. Therefore, for stream C1, you should set `Tin = 60°C` and `Tout = 160°C`.

We assume a minimum approach temperature of `10 K` and split it equally between the hot and cold sides, so we set `Tcont = 5°C`. The paper does not provide heat-transfer coefficients for the individual streams because this example is used to solve an energy-targeting problem rather than an economic one. For that reason, in this example we simply assume `HTC = 1u"kW/(K*m^2)"`.

With these assumptions, we can now prepare the four process streams:
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

## Utilities

Table 1 also includes steam, which acts as the hot utility, and cooling water, which acts as the cold utility. However, their heat duties `Q` are unknown, and their `FCp` values are also unknown. In the context of this framework, that means the *flow rates* of steam and cooling water are not fixed in advance, while their molar or specific heat capacities are still treated as constants. At a given temperature and pressure, the heat capacity of steam or water is a physical property and does not vary arbitrarily with the optimization problem.

To model that situation, give the flow rate as a range. The framework will then automatically treat it as a *decision variable*:
```julia
F=(0u"kmol/s", 1000u"kmol/s") # F isa Tuple{Number,Number}
```

Because steam releases heat at essentially constant temperature, we have `Tin = Tout`. In that case, the actual heat released by the stream is determined by its molar or mass enthalpy of vaporization rather than by its heat capacity. Whenever a stream has `Tin = Tout`, you should provide a latent-heat parameter instead of heat-capacity coefficients. A complete steam-stream definition is shown below:
```julia
Hot(:HU1, F=(0u"kmol/s", 1000u"kmol/s"), Tin=270°C, Tout=270°C, Tcont=5°C,
    Hvap=100u"kJ/kmol", HTC=100u"kW/(K*m^2)",
    cost=200u"(kJ*yr)^-1", pricing_basis=:energy
),
```
Here we specify `Hvap` instead of `Hcoeff` because the steam stream has `Tin = Tout`. Even if you do provide `Hcoeff`, it will be ignored automatically.

Utilities are usually not free, so we use the `cost` keyword argument to define the utility price. The `pricing_basis` can be either `:energy` or `:flowrate`. In classical heat exchanger network synthesis problems, pricing based on energy is the more common choice. Here we set `cost = 200u"(kJ*yr)^-1"`, meaning that each `1 kJ` of utility consumption costs 200 units of currency.

Similarly, the cooling-water stream can be defined as follows:
```julia
Cold(:CU1, F=(0u"kmol/s", 1000u"kmol/s"), Tin=38°C, Tout=82°C, Tcont=5°C,
    Hcoeff=(0, 1.0, 0, 0, 0, 0), HTC=100u"kW/(K*m^2)",
    cost=20u"(kJ*yr)^-1", pricing_basis=:energy
),
```

Finally, place all of the streams we have defined into a single vector, `stream_data = [...]`. You will obtain:
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

## Summary
In this section, we discussed how to define streams and used 4SP1 as an example to show how literature data can be converted into the data structures expected by `EnergyIntegration`. In most cases, some conversion is necessary, because `EnergyIntegration` is designed to be more general: it separates stream flow rate from heat capacity so that the same framework can be applied in a wider range of situations.

In the next section, we will discuss how to configure the temperature intervals and then move on to building the heat exchanger network with `build_hen`.

## References
<!-- bibliography injected by rehype-citation -->
