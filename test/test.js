// this is a super minimal test suite
// it creates a model with default parameters
// and checks the first and sixth value of each
// diagnostic against precomputed values
// from an independent implementation

const test = require('tape')
const margo = require('..')

test('emissions (default opts)', (t) => {
  const m = margo.Model()
  const emissions = m.emissions()
  t.equal(emissions[0], 7.5)
  t.equal(emissions[5], 12.1875)
  t.end()
})

test('concentration (default opts)', (t) => {
  const m = margo.Model()
  const concentration = m.concentration()
  t.equal(concentration[0], 478.75)
  t.equal(concentration[5], 607.65625)
  t.end()
})

test('forcing (default opts)', (t) => {
  const m = margo.Model()
  const forcing = m.forcing()
  t.equal(forcing[0], 0.1988532592444071)
  t.equal(forcing[5], 1.3855943936513244)
  t.end()
})

test('temperature (default opts)', (t) => {
  const m = margo.Model()
  const temperature = m.temperature()
  t.equal(temperature[0], 1.2083551842122768)
  t.equal(temperature[5], 1.8776281942807453)
  t.end()
})

test('ecs (default opts)', (t) => {
  const m = margo.Model()
  t.equal(m.ecs(), 3.053097345132744)
  t.end()
})

test('n (default opts)', (t) => {
  const m = margo.Model()
  t.equal(m.n(), 37)
  t.end()
})

test('t (default opts)', (t) => {
  const m = margo.Model()
  t.equal(m.t()[0], 2020)
  t.equal(m.t()[5], 2045)
  t.end()
})

test('opts (default opts)', (t) => {
  const m = margo.Model()
  t.equal(m.opts().time.dt, 5)
  t.end()
})

test('update', (t) => {
  const m = margo.Model()

  t.equal(m.ecs(), 3.053097345132744)
  m.physics = { B: 1.2 }
  t.equal(m.ecs(), 2.8750000000000004)

  t.equal(m.t()[0], 2020)
  m.time = { tmin: 2030 }
  t.equal(m.t()[0], 2030)

  t.end()
})

test('specify controls as function', (t) => {
  const m = margo.Model({
    controls: {
      remove: (t, i) => i * 0.1,
    },
  })
  t.equal(m.remove()[0], 0)
  t.equal(m.remove()[5], 0.5)
  t.end()
})

test('specify controls as array', (t) => {
  const m = margo.Model()

  t.equal(m.remove()[0], 0)
  t.equal(m.remove()[5], 0)
  m.controls = {
    remove: Array(m.n()).fill(1),
  }
  t.equal(m.remove()[0], 1)
  t.equal(m.remove()[5], 1)

  t.end()
})
