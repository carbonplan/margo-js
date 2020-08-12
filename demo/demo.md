import Layout from './components/layout'
import Tutorial from './components/tutorial'

export const meta = {}

# margo-js

This notebook demonstrates a pure Javascript implementation of the MARGO climate model.

The MARGO model, developed by Drake, Rivest, Deutch, and Edelman (2020), proposes a feed forward causal model relating emissions, greenhouse gas concentrations, radiative forcing, temperatures, and climate damages, all of which can be controlled by varying amounts of mitigation, carbon removal, geoengineering, and adaptation. A preprint is available on [EarthRXiv](https://eartharxiv.org/5bgyc) and the source code for a Julia implementation is available on [Github](https://github.com/hdrake/ClimateMARGO.jl).

Here, we demo a pure Javascript (JS) implementation of the model. We see several use cases for a pure JS implementation, including use in interactive articles and visual storytelling, and the ability to create interactive exploration tools without relying on complex client-server architectures. That said, implementations in Julia or similar languages will likely have performance advantages and be more appealing for research use cases.

We'll walk through a series of interactive plots similar to the [notebook example](https://github.com/hdrake/ClimateMARGO.jl/blob/master/examples/tutorial.ipynb) included with the Julia version.

To set up the model, we set some parameters and instantiate an model

```js
import { Model } from 'margo-js'

const m = Model(opts)
```

Where `opts` is an object with parameters for all model components, e.g.

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

Any parameters not specified will be provided with defaults. We can access diagnostic properties of the model using methods that return time series

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

Here we walk through some example parameter configurations and charts.

<Tutorial />

export default ({ children }) => <Layout meta={meta}>{children}</Layout>
