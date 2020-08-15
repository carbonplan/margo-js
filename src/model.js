import diagnostics from './diagnostics'

const Model = (opts) => {
  const init = opts ? opts : {}

  var time = Time(init.time)
  var baseline = Baseline(init.baseline, time)
  var controls = Controls(init.controls, time)
  var economics = Economics(init.economics)
  var physics = Physics(init.physics)

  const out = {
    t: () => time.t,
    n: () => time.n,
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
    out[name] = (opts) => method({ time, baseline, physics, controls }, opts)
  }

  return out
}

const Time = (opts) => {
  opts = opts ? opts : {}
  const dt = opts.dt ? opts.dt : 5
  const tmin = opts.tmin ? opts.tmin : 2020
  const tmax = opts.tmax ? opts.tmax : 2200

  const n = (tmax - tmin) / dt + 1
  const t = Array.from(Array(n), (_, i) => tmin + i * dt)
  const i = Array.from(Array(n), (_, i) => i)

  return {
    t,
    dt,
    n,
    i,
    tmin,
    tmax,
  }
}

const Baseline = (opts, time) => {
  opts = opts ? opts : {}
  const { tmin } = time

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
  switch (opts.form) {
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
  opts = opts ? opts : {}
}

const Physics = (opts) => {
  opts = opts ? opts : {}

  const { r, c0, a, Finf, F0, B, Cd, x, T0, A } = opts

  return {
    r,
    c0,
    a,
    Finf,
    F0,
    B,
    Cd,
    x,
    T0,
    A,
  }
}

const Controls = (opts, time) => {
  opts = opts ? opts : {}
  const { t, n } = time

  const remove = opts.remove ? opts.remove : Array(n).fill(0)
  const mitigate = opts.mitigate ? opts.mitigate : Array(n).fill(0)
  const geoeng = opts.geoeng ? opts.geoeng : Array(n).fill(0)
  const adapt = opts.adapt ? opts.adapt : Array(n).fill(0)

  return {
    remove,
    mitigate,
    geoeng,
    adapt,
  }
}

export { Model }
