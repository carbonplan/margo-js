const ndarray = require('ndarray')
const ndopt = require('./ndarray-optimization')

const optimize = (model, opts) => {
  const mOpt = model.copy()

  const defaults = {
    discounting: true,
    tolerance: 1e-5,
    niter: 500,
    objective: 'netBenefit',
    max: {
      mitigate: 1,
      remove: 1,
      geoeng: 1,
      adapt: 0,
    },
    delay: {
      mitigate: 0,
      remove: 10,
      geoeng: 30,
      adapt: 0,
    },
  }

  const { tolerance, niter, objective, max, delay, discounting } = {
    ...defaults,
    ...opts,
  }

  const index = mOpt.t().map((_, i) => i)
  const t = mOpt.t()
  const n = mOpt.n()

  const { mitigate, remove, geoeng, adapt } = max

  const M = max.mitigate > 0
  const R = max.remove > 0
  const G = max.geoeng > 0

  const _ub = (n, m, td) => {
    return Array(n)
      .fill(0)
      .map((_, i) => {
        if (t[i] - t[0] >= td) return m
        else return 0
      })
  }

  const ub = (M ? _ub(n, max.mitigate, delay.mitigate) : [])
    .concat(R ? _ub(n, max.remove, delay.remove) : [])
    .concat(G ? _ub(n, max.geoeng, delay.geoeng) : [])

  const lb = ub.map((_) => 0)

  const init = (M ? Array(n).fill(0) : [])
    .concat(R ? Array(n).fill(0.4) : [])
    .concat(G ? Array(n).fill(0.4) : [])

  const x0 = ndarray(init, [init.length, 1])

  let F = (x) => {
    x.data = x.data.map((x, i) => Math.max(x, lb[i]))
    x.data = x.data.map((x, i) => Math.min(x, ub[i]))

    if (M & !R & !G) {
      mOpt.controls = {
        mitigate: index.map((i) => x.get(i, 0)),
      }
    }

    if (R & !M & !G) {
      mOpt.controls = {
        remove: index.map((i) => x.get(i, 0)),
      }
    }

    if (G & !M & !R) {
      mOpt.controls = {
        geoeng: index.map((i) => x.get(i, 0)),
      }
    }

    if (M & R & !G) {
      mOpt.controls = {
        mitigate: index.map((i) => x.get(i, 0)),
        remove: index.map((i) => x.get(n + i, 0)),
      }
    }

    if (M & G & !R) {
      mOpt.controls = {
        mitigate: index.map((i) => x.get(i, 0)),
        geoeng: index.map((i) => x.get(n + i, 0)),
      }
    }

    if (G & R & !M) {
      mOpt.controls = {
        remove: index.map((i) => x.get(i, 0)),
        geoeng: index.map((i) => x.get(n + i, 0)),
      }
    }

    if (M & R & G) {
      mOpt.controls = {
        mitigate: index.map((i) => x.get(i, 0)),
        remove: index.map((i) => x.get(n + i, 0)),
        geoeng: index.map((i) => x.get(2 * n + i, 0)),
      }
    }

    return -mOpt.netPresentBenefit({ discounting: discounting })
  }

  const options = {
    objective: {
      start: x0,
      func: F,
      gradient: {
        func: 'centralDifference',
        delta: 0.01,
      },
    },
    update: {
      hessianInverse: true,
      type: 'rank1',
    },
    solution: {
      tolerance: tolerance,
      maxIterations: niter,
    },
  }

  let results
  try {
    results = ndopt.unconstrained.quasiNewton(options)
    return mOpt
  } catch (err) {
    console.log('error during optimization')
    return null
  }
}

export { optimize }
