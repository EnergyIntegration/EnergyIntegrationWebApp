import StreamEditorMock from "@site/src/components/StreamEditorMock";

# Creating Streams

In this section, we will use the classic 4SP1 example [@papoulias1983] to show you how to work with `EnergyIntegrationWebApp.jl`.

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
- molar heat capacity at constant pressure, `Cp`
- heat-transfer coefficient, `HTC`

The corresponding editing area in the web app looks like this:

<StreamEditorMock />

让我们从流股流率开始. The stream tables commonly reported in the literature cannot usually be used directly in this framework, so some data conversion is required first. In Table 1, `FCp` is the heat-capacity flowrate, i.e. the product of the molar flowrate and the constant-pressure molar heat capacity, or equivalently the product of the mass flowrate and the specific heat capacity. In this framework, however, the stream flow rate and the constant-pressure molar or mass heat capacity must be specified explicitly. You therefore need to split the published data into those two parts. The split itself is arbitrary. For example, if `FCp = 7.62 kW/°C`, you may set `F = 1 kmol/s` and the molar heat capacity to `7.62 J/(kmol*K)`, or set `F = 7.62 kmol/s` and the molar heat capacity to `1 J/(kmol*K)`. The result will be the same.

Another point worth noting is the notation used in Table 1. Here, *Ts* denotes the *supply temperature* and *Tt* denotes the *target temperature*. In the context of heat exchanger networks, *supply temperature* is equivalent to *inlet temperature*, and *target temperature* is equivalent to *outlet temperature*. Therefore, for stream C1, you should set `Tin = 60°C` and `Tout = 160°C`.

[单独放F Tin Tout三项的输入框,大概这样
F                     Tin        Tout
按钮 [value] [kmol/s] 按钮 60 °C 按钮 160 °C]

接下来请点开流股项目左侧第一个小三角按钮(|>),您将看到Stream detail列表.

Where Special-Tcont (ΔT)指的是per-side temperature contribution. It is used to split the minimum approach temperature into two parts, one assigned to the hot side and the other to the cold side. When a hot stream exchanges heat with a cold stream, the minimum temperature difference between them is treated as the sum of their individual `Tcont` values.

We assume a minimum approach temperature of `10 K` and split it equally between the hot and cold sides, so we set Tcont as 5 °C. The paper does not provide heat-transfer coefficients for the individual streams because this example is used to solve an energy-targeting problem rather than an economic one. For that reason, in this example we simply set HTC as 1 kW/(K*m^2).

接下来,再Thermophysical-Cp的框中填入7.62,单位为 J/(kmol*K). 

您会看到一个advanced Hcoeff6的勾选框. 勾选后会出现六个数值输入框. 这六个输入框依次对应下面焓计算方程的6个系数.

<Equation
  id="eq-hcoeff"
  formula="H(T) = a_0 + a_1 T + a_2 T^2 + a_3 T^3 + a_4 T^4 + a_5 T^5"
/>

Its second element is the constant-pressure molar or mass heat capacity. In most cases, the molar or mass heat capacity of a stream can be treated as a constant. When that is the case, 您只要保持不勾选advanced Hcoeff6, 直接填入Cp 项的值即可.

要添加流股, 请点击页面上方的[这里放+Hot和+Cold按钮].

## Utilities

Table 1 also includes steam, which acts as the hot utility, and cooling water, which acts as the cold utility. However, their heat duties `Q` are unknown, and their `FCp` values are also unknown. In the context of this framework, that means the *flow rates* of steam and cooling water are not fixed in advance, while their molar or specific heat capacities are still treated as constants. At a given temperature and pressure, the heat capacity of steam or water is a physical property and does not vary arbitrarily with the optimization problem.

To model that situation, give the flow rate as a range. The framework will then automatically treat it as a *decision variable*. 点击流股流量项中的[三条杠]按钮, 这将将流股从固定流量模式切换到可变流量模式. 此时您将看到两个数值输入框, 分别对应流股流量的*下限*和*上限*. 对于几乎所有例子, 您可以直接将下限设为0. 然而, 您需要对流量上限提供一个初始估计. 对于本例来说, 您需要预估蒸汽和冷却水最多会用多少. 但是别担心, 初始估计可以提供得非常大, 通常来说比最优解大1000倍以内都是可以稳定求解的. 让我们像下面这样填写:

[单独放F的输入框,大概这样F <-> [0] [1000] [kmol/s]]

Because steam releases heat at essentially constant temperature, we have `Tin = Tout`. In that case, the actual heat released by the stream is determined by its molar or mass enthalpy of vaporization rather than by its heat capacity. Whenever a stream has `Tin = Tout`, you should provide a latent-heat parameter, Hvap, instead of heat-capacity coefficients. 请在Thermophysical-Hvap中填入100,单位为kJ/kmol. Because the steam stream has `Tin = Tout`, Even if you do provide *Cp*, it will be ignored automatically.

Utilities are usually not free, so we use the *cost* 选项 to define the utility price. The *pricing_basis* can be either *energy* or *flowrate*. In classical heat exchanger network synthesis problems, pricing based on energy is the more common choice. Here we set cost = 200, meaning that each 1 kJ of utility consumption costs 200 units of currency.

Stream detail 中其余项目不用填写, 留空即可.

Similarly, 你可以继续定义the cooling-water stream.

Finally, 当您定义完了所有流股后, 您的流股列表可能看起来像这样:
[
    这里放填好所有流股的界面
]

## 检查
对于流股列表下方的Interval Configuration列表可以不去改它, 保持默认值即可.

Interval Configuration下方的Validation会提醒您那些必要的数值还没有填写,哪些地方填写的不符合规范. 必要时, 请参考Validation的提示. 您必须使红色框的Validation变为绿色并显示"No issues."后才能继续下一步.

## 构建网络
当您一切准备完成后, 请点击页面右上角的[Build HEN]按钮. 程序会自动构建换热网络.

In the next section, we will discuss 如何解读构建网络后的图表.

## References
<!-- bibliography injected by rehype-citation -->
