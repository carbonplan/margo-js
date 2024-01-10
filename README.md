# margo-js

[![CI](https://github.com/carbonplan/margo-js/actions/workflows/main.yml/badge.svg)](https://github.com/carbonplan/margo-js/actions/workflows/main.yml)

> MARGO climate model in pure javascript

This is a work-in-progress pure Javascript implementation of the MARGO climate model developed by Henri Drake, Ronald L. Rivest, John Deutch, and Alan Edelman (2020). MARGO is a feed forward causal model relating emissions, greenhouse gas concentrations, radiative forcing, temperatures, and climate damages, all of which can be controlled by varying amounts of mitigation, carbon removal, geoengineering, and adaptation. A preprint is available on [EarthRXiv](https://eartharxiv.org/5bgyc). The source code for the original implementation in Julia is available on [Github](https://github.com/hdrake/ClimateMARGO.jl), and an API that exposes the Julia version is under development.

Potential use cases for a pure JS implementation include light-weight interactive articles and visual storytelling without the need for a server or client-server architectures. Implementations in Julia or similar languages will likely have performance advantages, and we imagine the Julia implementation will remain the standard for research purposes.

## how to use

Instantiate a model with default parameters using

```js
import { Model } from 'margo-js'

const m = Model()
```

You can optionally specify several parameters, for example here we set a maximum time and climate feedback parameter, and a add a carbon removal control that grows with time

```js
var opts = {
  time: {
    tmax: 2300,
  },
  physics: {
    B: 1.2,
  },
  controls: {
    remove: (t, i) => i * 0.1,
  },
}

const m = Model(opts)
```

Once constructed you can access current model settings with functions

```js
m.t() // array of time points
m.n() // number of time points
m.opts() // full set of parameters
```

generate time series of physical and economic variables as arrays from the model

```js
m.emissions()
m.concentration()
m.forcing()
m.temperature()
m.cost()
```

and generate control time series

```js
m.mitigate()
m.remove()
m.geoeng()
m.adapt()
```

Some of these methods have options e.g. for specifying units, such as

```js
m.emissions({ units: 'CO2e' })
```

You can update parameters by setting one or more values on the corresponding parameter group

```js
m.physics = { B: 1.2 }
m.time = { tmax: 2300 }
```

and you can optimize controls subject to constraints

```js
import { optimize } from 'margo-js'

const mOpt = optimize(m, {
  objective: 'netBenefit',
  max: {
    mitigate: 1,
    remove: 1,
    geoeng: 1,
    adapt: 0,
  },
})
```

## development

For developing the library, first clone the repository and install the dependencies using

```
npm i
```

to build the package for distribution run

```
npm run build
```

to run the tests use

```
npm run test
```

## demo

To run the demo web app, which can be useful during development, install the dependencies using

```
npm run install-demo
```

then start the live development server using

```
npm run dev-demo
```

and navigate to `http://localhost:3000` in your browser. This process will create a file called `lib/margo-js.js` While in this mode, any changes either to the top-level `margo-js` module or the demo web app should immediately be reflected in the browser.

You can also see the demo live [here](https://margo-js.demo.carbonplan.org).

## todos

Some immediate things we are working on include

- implementing the optimization of controls
- expanding the test suite to more precisely and reliably match the output of the Julia package
- improving the syntax to "look more like the math"
- prototyping ways to embed the library in other contexts (e.g. a live coding playground)

## license

All the code in this repository is [MIT](https://choosealicense.com/licenses/mit/)-licensed.

## contributions

Credit for the model goes to the authors of the MARGO paper. The [Julia implementation](https://github.com/hdrake/ClimateMARGO.jl) is developed by [@hdrake](https://github.com/hdrake), [@zeptodoctor](https://github.com/zeptodoctor), and [@fonsp](https://github.com/fonsp). We are coordinating and collaborating with them on this implementation.
