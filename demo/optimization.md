import { Divider } from 'theme-ui'
import Layout from './components/layout'
import Optimization from './components/tutorials/optimization'

export const meta = {}

# margo-js optimization

<Divider sx={{ mt: [4], mb: [4] }} />

This notebook demonstrates optimization within the work-in-progress pure Javascript implementation of the MARGO climate model. For more on the basics of the model see [here](/).

As usual, to set up the model we instatiate it.

```js
import { Model } from 'margo-js'

const m = Model()
```

We can then optimize the controls subject to constraints, for example:

```js
import { optimize } from 'margo-js'

const mOpt = optmize(m, {
  objective: 'netBenefit',
  max: {
    mitigate: 1
    remove: 1,
    geoeng: 0,
    adapt: 0
  }
})
```

Below you can see the results of the optimization under several different settings. Try it out!

<Optimization/>

export default ({ children }) => <Layout meta={meta}>{children}</Layout>