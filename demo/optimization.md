import { Divider } from 'theme-ui'
import Layout from './components/layout'
import Optimization from './components/tutorials/optimization'

export const meta = {}

# margo-js optimization

<Divider sx={{ mt: [4], mb: [4] }} />

This notebook demonstrates optimization within the work-in-progress pure Javascript implementation of the MARGO climate model. For more on the basics of the model see [here](/).

Here's how to create a model and then optimize the controls.

```js
import { Model, optimize } from 'margo-js'

const m = Model()
const mOpt = optmize(m, {objective: 'netBenefit'})
```

Below you can see the results of the optimization under several different settings. Try it out!

<Optimization/>

export default ({ children }) => <Layout meta={meta}>{children}</Layout>