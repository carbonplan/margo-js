// this is a super minimal test suite
// it creates a model with default parameters
// and checks the first and sixth value of each
// diagnostic against precomputed values
// from an independent implementation

const test = require('tape')
const margo = require('..')

var opts = {
  time: {
    tmin: 2020,
    tmax: 2200,
    dt: 5,
  },
  baseline: {
    form: 'ramp',
    q0: 7.5,
    q0mult: 3,
    t1: 2100,
    t2: 2150,
  },
  physics: {
    r: 0.5,
    c0: 460,
    a: 6.9 / 2 / Math.log(2),
    Finf: 8.5,
    F0: 3,
    B: 1.13,
    Cd: 106,
    x: 0.73,
    T0: 1.1,
    A: 0,
  },
  economics: {},
  controls: null,
}

test('emissions', (t) => {
  const m = margo.Model(opts)
  const emissions = m.emissions()
  t.equal(emissions[0], 7.5)
  t.equal(emissions[5], 12.1875)
  t.end()
})

test('concentration', (t) => {
  const m = margo.Model(opts)
  const concentration = m.concentration()
  t.equal(concentration[0], 478.75)
  t.equal(concentration[5], 607.65625)
  t.end()
})

test('forcing', (t) => {
  const m = margo.Model(opts)
  const forcing = m.forcing()
  t.equal(forcing[0], 0.1988532592444071)
  t.equal(forcing[5], 1.3855943936513244)
  t.end()
})

test('temperature', (t) => {
  const m = margo.Model(opts)
  const temperature = m.temperature()
  t.equal(temperature[0], 1.2083551842122768)
  t.equal(temperature[5], 1.8776281942807453)
  t.end()
})

test('ecs', (t) => {
  const m = margo.Model(opts)
  t.equal(m.ecs(), 3.053097345132744)
  t.end()
})

test('n', (t) => {
  const m = margo.Model(opts)
  t.equal(m.n(), 37)
  t.end()
})

test('update', (t) => {
  const m = margo.Model(opts)
  t.equal(m.ecs(), 3.053097345132744)
  m.physics = { B : 1.2 }
  t.equal(m.ecs(), 2.8750000000000004)
  t.end()
})