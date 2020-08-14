const ppmToCO2e = (ppm) => ppm * (2.13 * (44 / 12))

const emissions = (model, opts) => {
  opts = opts ? opts : {}
  const units = opts.units ? opts.units : 'ppm'
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
  opts = opts ? opts : {}
  const units = opts.units ? opts.units : 'ppm'
  const {time, baseline, physics, controls} = model
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
  const { time, physics, controls } = model
  const c = concentration(model)
  const { a, Finf, c0 } = physics
  return time.i.map((i) => {
    return a * Math.log(c[i] / c0) - controls.geoeng[i] * Finf
  })
}

const ecs = (model) => {
  const { physics } = model
  const { a, B } = physics
  return (a * Math.log(2)) / B
}

const temperature = (model) => {
  const { time, physics } = model
  const cumsum = (sum) => (value) => (sum += value)
  const { Cd, x, B, T0, A } = physics
  const td = ((Cd / B) * (B + x)) / x
  const { t, dt } = time
  const f = forcing(model)
  const slow = time.i
    .map((i) => (Math.exp((t[i] - (t[0] - dt)) / td) / td) * f[i] * dt)
    .map(cumsum(0))
    .map((v, i) => {
      return (
        Math.sqrt(1 - A) *
        (((v * (x / B)) / (x + B)) * Math.exp(-(t[i] - (t[0] - dt)) / td))
      )
    })
  const fast = time.i.map((i) => (Math.sqrt(1 - A) * f[i]) / (x + B))
  const temp = time.i.map((i) => Math.sqrt(1 - A) * (T0 + slow[i] + fast[i]))
  return temp
}

export default {
  emissions,
  effectiveEmissions,
  concentration,
  forcing,
  temperature,
  ecs
}