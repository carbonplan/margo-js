const margo = require('.')

const dt = 20

const m = margo.Model({
  time: {
    dt: dt,
  }
})

var start = new Date()

const mOpt = margo.optimize(m, {
  max: {
    mitigate: 1,
    remove: 1,
    geoeng: 1,
    adapt: 0
  },
})

var end = new Date() - start

console.log(mOpt.mitigate())
console.log(mOpt.remove())
console.log(mOpt.geoeng())
console.log(mOpt.temperature())
console.log(end)