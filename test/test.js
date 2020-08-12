const margo = require('..')

var opts = {
  time: {
    tmin: 2020,
    tmax: 2200,
    dt: 5
  },
  baseline: {
    form: 'capped',
    f0: 7.5,
    r: 0.03,
    m: 0.02,
    td: 2050,
  },
  physics: {
    r: 0.5,
    c0: 460,
    a: (6.9/2)/Math.log(2),
    Finf: 8.5,
    F0: 3,
    B: 1.13,
    Cd: 106,
    x: 0.73,
    T0: 1.056,
  },
  economics: {
  },
  controls: null
}

const m = margo.Model(opts)

console.log(m.emissions())
console.log(m.concentration())
console.log(m.forcing())
console.log(m.temperature())
console.log(m.ecs())


// baseline: {
//   form: 'ramp',
//   q0: 7.5,
//   q0mult: 3,
//   t1: 2100,
//   t2: 2150
// },