const test = require('tape')
const margo = require('..')

const modelDefault = margo.Model()

const modelControlled = margo.Model({
  controls: {
    mitigate: () => 0.25,
    remove: () => 0.25,
    adapt: () => 0.25,
    geoeng: () => 0.25,
  },
})

test.Test.prototype.almostEqual = function (a, b, msg, extra) {
  this._assert(a.toFixed(12) == b.toFixed(12), {
    message: msg || 'should be equal up to precision of 12',
    operator: 'equal',
    actual: a,
    expected: b,
    extra: extra,
  })
}

test('emissions (default)', (t) => {
  const emissions = modelDefault.emissions()
  t.almostEqual(emissions[0], 7.5)
  t.almostEqual(emissions[5], 12.1875)
  t.end()
})

test('concentration (default)', (t) => {
  const concentration = modelDefault.concentration()
  t.almostEqual(concentration[0], 478.75)
  t.almostEqual(concentration[5], 607.65625)
  t.end()
})

test('forcing (default)', (t) => {
  const forcing = modelDefault.forcing()
  t.almostEqual(forcing[0], 0.1988532592444071)
  t.almostEqual(forcing[5], 1.3855943936513244)
  t.end()
})

test('temperature (default)', (t) => {
  const temperature = modelDefault.temperature()
  t.almostEqual(temperature[0], 1.2083551842122768)
  t.almostEqual(temperature[5], 1.8776281942807453)
  t.end()
})

test('ecs (default)', (t) => {
  t.almostEqual(modelDefault.ecs(), 3.053097345132744)
  t.end()
})

test('growth (default)', (t) => {
  const growth = modelDefault.growth()
  t.almostEqual(growth[0], 100)
  t.almostEqual(growth[5], 164.06059944647308)
  t.end()
})

test('discount (default)', (t) => {
  const discount = modelDefault.discount()
  t.almostEqual(discount[0], 0)
  t.almostEqual(discount[1], 0.9514656876067488)
  t.almostEqual(discount[5], 0.7797684429937835)
  t.end()
})

// TODO test actual values
test('damage (default)', (t) => {
  const damage = modelDefault.damage()
  t.ok(damage)
  t.end()
})

// TODO test actual values
test('damage baseline (default)', (t) => {
  const damageBaseline = modelDefault.damageBaseline()
  t.ok(damageBaseline)
  t.end()
})

// TODO test actual values
test('cost (controlled)', (t) => {
  const cost = modelControlled.cost()
  t.ok(cost)
  t.end()
})

// TODO test actual values
test('benefit (controlled)', (t) => {
  const benefit = modelControlled.benefit()
  t.ok(benefit)
  t.end()
})

// TODO test actual values
test('net benefit (controlled)', (t) => {
  const netBenefit = modelControlled.netBenefit()
  t.ok(netBenefit)
  t.end()
})

// TODO test actual values
test('net present beneft (controlled)', (t) => {
  const netPresentBenefit = modelControlled.netPresentBenefit()
  t.ok(netPresentBenefit)
  t.end()
})

// TODO test actual values
test('net present cost (controlled)', (t) => {
  const netPresentCost = modelControlled.netPresentCost()
  t.ok(netPresentCost)
  t.end()
})

test('n (default)', (t) => {
  const m = margo.Model()
  t.equal(m.n(), 37)
  t.end()
})

test('t (default)', (t) => {
  const m = margo.Model()
  t.equal(m.t()[0], 2020)
  t.equal(m.t()[5], 2045)
  t.end()
})

test('opts (default)', (t) => {
  const m = margo.Model()
  t.equal(m.opts().time.dt, 5)
  t.end()
})

test('update', (t) => {
  const m = margo.Model()

  t.almostEqual(m.ecs(), 3.053097345132744)
  m.physics = { B: 1.2 }
  t.almostEqual(m.ecs(), 2.8750000000000004)

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
  m.controls = {
    remove: Array(m.n()).fill(1),
  }
  t.equal(m.remove()[0], 1)
  t.equal(m.remove()[5], 1)
  t.end()
})

test('specify baseline as array', (t) => {
  const m = margo.Model()
  m.baseline = {
    form: 'array',
    q: Array(m.n()).fill(1)
  }
  t.equal(m.emissions()[0], 1)
  t.equal(m.emissions()[1], 1)
  t.equal(m.emissions()[m.n()-1], 1)
  t.end()
})
