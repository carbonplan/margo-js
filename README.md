# margo-js

![CI](https://github.com/carbonplan/margo-js/workflows/CI/badge.svg)

margo climate model in pure javascript

## how to use

instantiate a model with default parameters using

```js
import { Model } from 'margo-js'

const m = Model()
```

you can specify lots of parameters, for example here we set a maximum time and a climate feedback parameter

```js
var opts = {
  time: {
    tmax: 2300,
  },
  physics: {
    B: 1.2,
  },
}

const m = Model(opts)
```

once constructed you can generate diagnostic time series from the model

```js
m.emissions()
m.concentration()
m.forcing()
m.temperature()
```

you can update parameters by setting on or more values on the corresponding parameter group

```js
m.physics = { B: 1.2 }
m.time = { tmax: 2300 }
```

and you can optimize controls (NOT YET IMPLEMENTED)

```js
import { optimize } from 'margo-js'

const mOpt = optimize(m)
```

## development

for development, first clone the repository and install the dependencies using

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

to checkout a demo web app, first follow the instructions above to build the package, then navigate to the `demo` folder and run

```
npm i
npm run dev
```

you can also see the demo live [here]()
