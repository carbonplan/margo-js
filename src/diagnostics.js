const ppmToCO2e = (ppm) => ppm * (2.13 * (44 / 12))

const emissions = (model, opts) => {
  const defaults = { units: 'ppm' }
  const { units } = { ...defaults, ...opts }
  const { time, baseline, controls } = model
  const e = time.i.map((i) => {
    return baseline.q[i] * (1 - controls.mitigate[i])
  })
  if (units === 'CO2e') {
    return e.map(ppmToCO2e)
  } else if (units === 'ppm') {
    return e
  }
}

const effectiveEmissions = (model, opts) => {
  const defaults = { units: 'ppm' }
  const { units } = { ...defaults, ...opts }
  const { time, baseline, physics, controls } = model
  const { r } = physics
  const { q } = baseline
  const e = time.i.map((i) => {
    return r * (q[i] * (1 - controls.mitigate[i]) - q[0] * controls.remove[i])
  })
  if (units === 'CO2e') {
    return e.map(ppmToCO2e)
  } else if (units === 'ppm') {
    return e
  }
}

const concentration = (model) => {
  const { time, physics } = model
  const cumsum = (sum) => (value) => (sum += value)
  const { c0 } = physics
  return effectiveEmissions(model)
    .map((e) => e * time.dt)
    .map(cumsum(0))
    .map((c) => c0 + c)
}

const forcing = (model) => {
  const { time, physics, economics, controls } = model
  const c = concentration(model)
  const { a, c0 } = physics
  const { Finf } = economics
  return time.i.map((i) => {
    return a * Math.log(c[i] / c0) - controls.geoeng[i] * Finf
  })
}

const ecs = (model) => {
  const { physics } = model
  const { a, B } = physics
  return (a * Math.log(2)) / B
}

const temperature = (model, opts) => {
  const defaults = {
    adapt: model.time.i.map((i) => 0),
  }
  const { adapt } = { ...defaults, ...opts }
  const { time, physics } = model
  const cumsum = (sum) => (value) => (sum += value)
  const { Cd, x, B, T0 } = physics
  const td = ((Cd / B) * (B + x)) / x
  const { t, dt } = time
  const f = forcing(model)
  const slow = time.i
    .map((i) => (Math.exp((t[i] - (t[0] - dt)) / td) / td) * f[i] * dt)
    .map(cumsum(0))
    .map((v, i) => {
      return (
        (((v * (x / B)) / (x + B)) * Math.exp(-(t[i] - (t[0] - dt)) / td))
      )
    })
  const fast = time.i.map((i) => (f[i]) / (x + B))
  const temp = time.i.map(
    (i) => Math.sqrt(1 - adapt[i]) * (T0 + slow[i] + fast[i])
  )
  return temp
}

const growth = (model) => {
  const { economics, time } = model
  const { E0, gamma } = economics
  return time.t.map((t) => E0 * Math.pow(1 + gamma, t - time.t[0]))
}

const discount = (model) => {
  const { economics, time } = model
  const { rho } = economics
  const { i, t, tnow, future } = time
  return i.map((i) => (future[i] ? 0 : 1) * Math.pow(1 + rho, -(t[i] - tnow)))
}

const _damage = (model, discounting) => {
  const { economics, time, controls } = model
  const { adapt } = controls
  const { beta } = economics
  const E = growth(model)
  const T = temperature(model, { adapt: adapt })
  const D = discount(model).map((d) => (1 + (discounting ? 1 : 0) * (d - 1)))

  return time.i.map((i) => beta * E[i] * Math.pow(T[i], 2) * D[i])
}

const damage = (model, opts) => {
  const defaults = { discounting: false }
  const { discounting } = { ...defaults, ...opts }
  return _damage(model, discounting)
}

const damageBaseline = (model, opts) => {
  const defaults = { discounting: false }
  const { discounting } = { ...defaults, ...opts }
  const { time } = model
  const initControls = model.controls
  const { remove, mitigate, adapt, geoeng } = initControls

  model.controls.remove = remove.map((r, i) => time.future[i] ? r : 0)
  model.controls.mitigate = mitigate.map((m, i) => time.future[i] ? m : 0)
  model.controls.adapt = adapt.map((a, i) => time.future[i] ? a : 0)
  model.controls.geoeng = geoeng.map((g, i) => time.future[i] ? g : 0)

  const out = _damage(model, discounting)

  model.controls.remove = remove
  model.controls.mitigate = mitigate
  model.controls.adapt = adapt
  model.controls.geoeng = geoeng
  
  return out
}

const cost = (model, opts) => {
  const defaults = { discounting: false, p: 2 }
  const { discounting, p } = { ...defaults, ...opts }

  const { economics, controls, baseline } = model
  const { cost } = economics
  const { mitigate, remove, adapt, geoeng } = controls
  const { q } = baseline

  const E = growth(model)
  const D = discount(model).map((d) => (1 + (discounting ? 1 : 0) * (d - 1)))

  return model.time.i.map(
    (i) =>
      (ppmToCO2e(q[i]) * cost.mitigate * Math.pow(mitigate[i], p) +
        E[i] * cost.geoeng * Math.pow(geoeng[i], p) +
        cost.remove * Math.pow(remove[i], p) +
        cost.adapt * Math.pow(adapt[i], p)) *
      D[i]
  )
}

const benefit = (model, opts) => {
  const defaults = { discounting: false }
  opts = { ...defaults, ...opts }
  const db = damageBaseline(model, opts)
  const d = damage(model, opts)
  return model.time.i.map((i) => db[i] - d[i])
}

const netBenefit = (model, opts) => {
  const defaults = { discounting: false }
  opts = { ...defaults, ...opts }
  const c = cost(model, opts)
  const b = benefit(model, opts)
  return model.time.i.map((i) => b[i] - c[i])
}

const netPresentCost = (model, opts) => {
  const defaults = { discounting: false }
  opts = { ...defaults, ...opts }
  return (
    cost(model, opts).reduce(function (a, b) {
      return a + b
    }, 0) * model.time.dt
  )
}

const netPresentBenefit = (model, opts) => {
  const defaults = { discounting: false }
  opts = { ...defaults, ...opts }
  return (
    netBenefit(model, opts).reduce(function (a, b) {
      return a + b
    }, 0) * model.time.dt
  )
}

export default {
  emissions,
  effectiveEmissions,
  concentration,
  forcing,
  temperature,
  ecs,
  growth,
  discount,
  damage,
  damageBaseline,
  cost,
  benefit,
  netBenefit,
  netPresentCost,
  netPresentBenefit,
}
