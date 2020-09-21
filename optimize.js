const margo = require('.')
const ndarray = require('ndarray')
const ndopt = require('./lib/ndarray-optimization')

const dt = 20
var tolerance = 1e-10
var maxIterations = 500

const m = margo.Model({
  time: {
    dt: dt,
  }
})

const index = m.t().map((_, i) => i)
const constrain = (v) => Math.min(Math.max(0, v), 1)
const n = m.n()

let F = (x) => {
  m.controls = {
    mitigate: index.map((i) => constrain(x.get(i, 0))),
    remove: index.map((i) => constrain(x.get(n + i, 0))),
    geoeng: index.map((i) => 0),
    adapt: index.map((i) => 0),
  }
  return -m.netPresentBenefit({discounting: true})
}

let x0 = ndarray(Array(2 * n).fill(1).map((_) => Math.random() * 0.01), [2 * n, 1])

var options = {
  objective: {
    start: x0,
    func: F,
    gradient: {
      func: 'centralDifference',
      delta: 0.01
    }
  },
  update: {
    hessianInverse: true,
    type: 'rank1'
  },
  solution: {
    tolerance: tolerance,
    maxIterations: maxIterations
  }
}

var results = ndopt.unconstrained.quasiNewton(options)
console.log(results)

// m.controls = {
//   mitigate: index.map((i) => constrain(results.x0.get(i, 0))),
//   remove: index.map((i) => constrain(results.x0.get(n + i, 0))),
//   geoeng: index.map((i) => 0),
//   adapt: index.map((i) => 0),
// }

// console.log(m.mitigate())
// console.log(m.remove())
// console.log(m.geoeng())
// console.log(m.adapt())
// console.log(m.temperature())