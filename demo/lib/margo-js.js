'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

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
  const { economics, time } = model
  const { beta } = economics
  const E = growth(model)
  const T = temperature(model)
  const D = discount(model).map((d) => (1 + discounting ? 1 : 0 * (d - 1)))

  return time.i.map((i) => (1 - 0) * beta * E[i] * Math.pow(T[i], 2) * D[i])
}

const damage = (model, opts) => {
  const defaults = { discounting: false }
  const { discounting } = { ...defaults, ...opts }
  return _damage(model, discounting)
}

const damageBaseline = (model, opts) => {
  const defaults = { discounting: false }
  const { discounting } = { ...defaults, ...opts }
  const initControls = model.controls

  model.controls = {
    remove: model.controls.remove.map((i) => 0),
    mitigate: model.controls.mitigate.map((i) => 0),
    adapt: model.controls.adapt.map((i) => 0),
    geoeng: model.controls.geoeng.map((i) => 0),
  }

  const out = _damage(model, discounting)
  model.controls = initControls
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
  const D = discount(model).map((d) => (1 + discounting ? 1 : 0 * (d - 1)))

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

var diagnostics = {
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

const Time = (opts) => {
  const { dt, tmin, tmax, tnow } = opts

  const n = (tmax - tmin) / dt + 1
  const t = Array.from(Array(n), (_, i) => tmin + i * dt)
  const i = Array.from(Array(n), (_, i) => i)
  const future = t.map((t) => t <= tnow)

  return {
    t,
    dt,
    n,
    i,
    tmin,
    tmax,
    tnow,
    future,
  }
}

const Controls = (opts, time) => {
  const { t } = time

  var { remove, mitigate, geoeng, adapt } = opts

  remove = Array.isArray(remove) ? remove : t.map(remove)
  mitigate = Array.isArray(mitigate) ? mitigate : t.map(mitigate)
  geoeng = Array.isArray(geoeng) ? geoeng : t.map(geoeng)
  adapt = Array.isArray(adapt) ? adapt : t.map(adapt)

  return {
    remove,
    mitigate,
    geoeng,
    adapt,
  }
}

const Physics = (opts) => {
  const { r, c0, a, F0, B, Cd, x, T0, A } = opts

  return {
    r,
    c0,
    a,
    F0,
    B,
    Cd,
    x,
    T0,
    A,
  }
}

const Baseline = (opts, time) => {
  const { tmin } = time
  const { form } = opts

  const ramp = () => {
    const { q0, q0mult, t1, t2 } = opts
    const Δt0 = t1 - tmin
    const Δt1 = t2 - t1
    const q = time.t.map((t) => {
      if (t < t1) {
        return q0 * (1 + ((q0mult - 1) * (t - tmin)) / Δt0)
      }
      if (t >= t1 && t < t2) {
        return (q0mult * q0 * (t2 - t)) / Δt1
      }
      if (t >= t2) {
        return 0
      }
    })
    return q
  }

  const capped = () => {
    const { f0, r, m, td } = opts
    const q = time.t.map((t) => {
      if (t <= td) {
        return f0 * Math.exp(r * (t - tmin))
      }
      if (t > td) {
        return (
          f0 *
          Math.exp(r * (td - tmin)) *
          (1 + (r + m) * (t - (td - tmin) - tmin)) *
          Math.exp(-m * (t - (td - tmin) - tmin))
        )
      }
    })
    return q
  }

  var q
  switch (form) {
    case 'ramp':
      q = ramp()
      break
    case 'capped':
      q = capped()
      break
  }

  return {
    q,
  }
}

const Economics = (opts) => {
  const { E0, gamma, beta, rho, Finf, cost } = opts

  return {
    E0,
    gamma,
    beta,
    rho,
    Finf,
    cost,
  }
}

const defaults = {
  time: {
    dt: 5,
    tmin: 2020,
    tmax: 2200,
    tnow: 2020,
  },
  baseline: {
    form: 'ramp',
    q0: 7.5,
    q0mult: 3,
    t1: 2100,
    t2: 2150,
  },
  physics: {
    r: 0.5, // long-term airborne fraction of CO2e
    c0: 460, // initial CO2e concentration
    a: 6.9 / 2 / Math.log(2), // logarithmic CO2 forcing coefficient
    B: 1.13, // feedback parameter
    Cd: 106, // deep ocean heat capacity
    x: 0.73, // deep ocean heat uptake rate
    T0: 1.1,
    F0: 3,
    A: 0,
  },
  economics: {
    E0: 100, // Gross World Product at t0 [10^12$ yr^-1]
    gamma: 0.02, // economic growth rate [fraction]
    beta: 0.0022222222222222222, // climate damage parameter [% GWP / (°C)^2]
    rho: 0.01,
    Finf: 8.5, // maximum SRM forcing
    cost: {
      remove: 13, // [trillion USD / year / GtCO2]
      mitigate: 0.034, // [percent of GDP]
      geoeng: 0.046, // [percent of GDP]
      adapt: 4.5, // [trillion USD / year / GtCO2]
    },
  },
  controls: {
    remove: (t) => 0,
    mitigate: (t) => 0,
    geoeng: (t) => 0,
    adapt: (t) => 0,
  },
}

const Model = (opts) => {
  opts = opts ? opts : {}

  const init = {
    time: { ...defaults.time, ...opts.time },
    baseline: { ...defaults.baseline, ...opts.baseline },
    controls: { ...defaults.controls, ...opts.controls },
    economics: { ...defaults.economics, ...opts.economics },
    physics: { ...defaults.physics, ...opts.physics },
  }

  var time = Time(init.time)
  var baseline = Baseline(init.baseline, time)
  var controls = Controls(init.controls, time)
  var economics = Economics(init.economics)
  var physics = Physics(init.physics)

  const out = {
    opts: () => init,
    n: () => time.n,
    t: () => time.t,
    mitigate: () => controls.mitigate,
    remove: () => controls.remove,
    geoeng: () => controls.geoeng,
    adapt: () => controls.adapt,
    set physics(opts) {
      init.physics = { ...init.physics, ...opts }
      physics = Physics(init.physics)
    },
    set economics(opts) {
      init.economics = { ...init.economics, ...opts }
      economics = Economics(init.economics)
    },
    set baseline(opts) {
      init.baseline = { ...init.baseline, ...opts }
      baseline = Baseline(init.baseline, time)
    },
    set controls(opts) {
      init.controls = { ...init.controls, ...opts }
      controls = Controls(init.controls, time)
    },
    set time(opts) {
      init.time = { ...init.time, ...opts }
      time = Time(init.time)
      baseline = Baseline(init.baseline, time)
      controls = Controls(init.controls, time)
    },
  }

  for (const [name, method] of Object.entries(diagnostics)) {
    out[name] = (opts) =>
      method({ time, baseline, economics, physics, controls }, opts)
  }

  return out
}

exports.Model = Model
