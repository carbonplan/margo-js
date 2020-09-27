import ndarray from 'ndarray'
import ndopt from 'ndarray-optimization'

const optimize = (model, opts) => {
  const mOpt = model.copy()

  const defaults = {
    discounting: true,
    tolerance: 1e-5,
    maxIterations: 500,
    objective: 'netBenefit',
    maxDeployment: {
      mitigate: 1,
      remove: 1,
      geoeng: 1,
      adapt: 0,
    },
    delayDeployment: {
      mitigate: 0,
      remove: 10,
      geoeng: 30,
      adapt: 0,
    },
  }

  const {
    tolerance,
    maxIterations,
    objective,
    maxDeployment,
    delayDeployment,
    discounting
  } = { ...defaults, ...opts }

  const index = mOpt.t().map((_, i) => i)
  const n = mOpt.n()

  const { mitigate, remove, geoeng, adapt } = maxDeployment

  const M = maxDeployment.mitigate > 0
  const R = maxDeployment.remove > 0
  const G = maxDeployment.geoeng > 0

  const ub = (M ? Array(n).fill(maxDeployment.mitigate) : [])
    .concat(R ? Array(n).fill(maxDeployment.remove) : [])
    .concat(G ? Array(n).fill(maxDeployment.geoeng) : [])

  const lb = ub.map((_) => 0)

  const x0 = ndarray(lb, [lb.length, 1])

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
      maxIterations: maxIterations,
    },
  }

  const results = ndopt.unconstrained.quasiNewton(options)

  return mOpt
}

export { optimize }
