import { Divider } from 'theme-ui'
import Layout from './components/layout'
import Core from './components/tutorials/core'
import Controls from './components/tutorials/controls'
import Economics from './components/tutorials/economics'

export const meta = {}

# margo-js

<Divider sx={{ mt: [4], mb: [4] }} />

This notebook demonstrates a work-in-progress pure Javascript implementation of the MARGO climate model.

The MARGO model, developed by Drake, Rivest, Deutch, and Edelman (2020), proposes a feed forward causal model relating emissions, greenhouse gas concentrations, radiative forcing, temperatures, and climate damages, all of which can be controlled by varying amounts of mitigation, carbon removal, geoengineering, and adaptation. A preprint is available on [EarthRXiv](https://eartharxiv.org/5bgyc) and the source code for a Julia implementation is available on [Github](https://github.com/hdrake/ClimateMARGO.jl).

Here, we demo a pure Javascript (JS) implementation of the model. We see several use cases for a pure JS implementation, including use in interactive articles and visual storytelling, and the ability to create interactive exploration tools without relying on complex client-server architectures. That said, implementations in Julia or similar languages will likely have performance advantages and be more appealing for research use cases.

We'll walk through a series of interactive plots similar to the [notebook example](https://github.com/hdrake/ClimateMARGO.jl/blob/master/examples/tutorial.ipynb) included with the Julia version.

To set up a model we instantiate it

```js
import { Model } from 'margo-js'

const m = Model()
```

You can optionally pass an `opts` object with parameters e.g.

```js
const opts = {
  time: {
    tmin: 2020,
    tmax: 2200,
    dt: 1,
  },
  baseline: {
    form: 'ramp',
    q0: 5,
    ...
  },
  physics: {
    B: 1.13,
    x: 0.73,
    ...
  },
  economics: {
    ...
  },
  controls: {
    ...
  },
}
```

Any parameters not specified will be provided with defaults. We can access diagnostic time series from the model using methods:

```js
m.emissions({units: 'CO2e'})
>> [ 7.5, ... ]
m.concentration()
>> [ 478.75, ... ]
```

We can update model parameters by setting them directly:

```js
m.physics = { B: 1.3 }
```

Note that when setting parameters related to `time`, `baseline`, or `controls`, the model will automatically trigger recomputations to validate subsequent calculations. For example, updating parameters of `time` via

```js
m.time = { tmax: 2300 }
```

will recompute the baseline and controls using a combination of new and previously provided parameters, and raise an error if any inconsistencies are detected.

Here we use interactive charts to explain components of the model.

## Core climate model

The core of MARGO's climate model is a feed forward description of the causal relationship between emissions, concentrations, forcing, and temperature, all of which can be modified by controls. First, we show these four components, using a generic ramp function for emissions.

All of these charts are drawn by extracting the corresponding time series:

```js
m.t() // x-axis
m.emissions() // y-axis
```

<Core />

## Controls

MARGO allows a user to specify controls for mitigation, carbon removal, geoengineering, and adaptation. Each is captured as a time series describing the fraction of that control deployed over time. Here, we use a simple parametric family of logistic functions that rise exponentially from `0` and then saturate at `1.0`. The parameter we vary is the point at time at which scale up begins. This may not be a realistic scenario, but it's a nice family for giving us intuition about the model.

In general we can specify controls as arrays (here just setting to a constant):

```js
m.controls = {
  mitigation: Array(m.n()).fill(0.25),
}
```

Or as functions of time

```js
m.controls = {
  mitigtation: (t) => 0.25,
}
```

We can see the effect changing the controls on the resulting temperature trajectory.

<Controls />

## Economics

Here we show some economic components of the model as we vary the different controls, including three time series

```js
m.damage()
m.cost()
m.netBenefit()
```

and two single values

```js
m.netPresentCost()
m.netPresentBenefit()
```

<Economics />

There's a lot more to do!

First, we need to double check all of the calculations and expand the [unit tests](https://github.com/carbonplan/margo-js/blob/master/test/test.js) to ensure we're correctly reproducing the behavior of the Julia verision with respect to the core calculations.

Second, we need to implement the optimization of controls to target scenarios. We are looking at [this library](https://github.com/tab58/ndarray-optimization), but are also considering a simple gradient descent approach.

We're eager to discuss potential use cases for a purely web-based version of the model, and future directions we could take this work.

<Divider sx={{ mt: [4], mb: [6] }} />

export default ({ children }) => <Layout meta={meta}>{children}</Layout>
