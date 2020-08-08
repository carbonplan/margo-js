const Model = (opts) => {

  opts = opts ? opts : {}

  const time = Time(opts.time)
  const baseline = Baseline(opts.baseline, time)
  const controls = Controls(opts.controls, time)
  const economics = Economics(opts.economics)
  const physics = Physics(opts.physics)

  const emissions = () => {
    return time.i.map((i) => {
      return baseline.q[i] * (1 - controls.mitigate[i])
    })
  }

  const effectiveEmissions = () => {
    const { r } = physics
    const { q } = baseline
    return time.i.map((i) => {
      return r * (q[i] * (1 - controls.mitigate[i]) - q[0] * controls.remove[i])
    })
  }

  const concentration = () => {
    const cumsum = (sum => value => sum += value)
    const { c0 } = physics
    return effectiveEmissions()
      .map((e) => e * time.dt)
      .map(cumsum(0))
      .map((c) => c0 + c)
  }

  const forcing = () => {
    const c = concentration()
    const { a, Finf, c0 } = physics
    return time.i.map((i) => {
      return a * Math.log(c[i] / c0) - controls.geoeng[i] * Finf
    })
  }

  const ecs = () => {
    const { a, B } = physics
    return a * Math.log(2) / B
  }

  const temperature = () => {
    const cumsum = (sum => value => sum += value)
    const { td, Cd, x, B, A, T0 } = physics
    const { t, dt } = time
    const f = forcing()
    const slow = time.i
      .map((i) => (Math.exp( (t[i] - (t[0] - dt)) / td) / td) * f[i] * dt)
      .map(cumsum(0))
      .map((v, i) => {
        return Math.sqrt(1 - A) * (
          v *
          (x / B) / (x + B) * 
          Math.exp( -(t[i] - (t[0] - dt)) / td)
        )
      })
    const fast = time.i
      .map((i) => Math.sqrt(1 - A) * f[i]/(x + B))
    const temp = time.i
      .map((i) => Math.sqrt(1 - A) * (T0 + slow[i] + fast[i]))
    return temp
  }

  const t = () => {
    return time.t
  }

  return { 
    t,
    emissions,
    effectiveEmissions,
    concentration,
    forcing,
    temperature,
    ecs
  }
}

const Time = (opts) => {
  opts = opts ? opts : {}
  const dt = opts.dt ? opts.dt : 5
  const tmin = opts.tmin ? opts.tmin : 2020
  const tmax = opts.tmax ? opts.tmax : 2200

  const n = (tmax - tmin)/dt + 1
  const t = Array.from(Array(n), (_, i) => (tmin + i * dt))
  const i = Array.from(Array(n), (_, i) => i)

  return {
    t,
    dt,
    n,
    i
  }
}


const Baseline = (opts, time) => {
  opts = opts ? opts : {}

  const { t } = time

  var q

  switch (opts.form) {
    case 'ramp':
      const { q0, q0mult, t1, t2 } = opts
      const tmin = t[0]
      const Δt0 = t1 - tmin
      const Δt1 = t2 - t1
      q = t.map(t => {
        if (t < t1) {
          return q0 * (1. + (q0mult-1) *(t - tmin)/Δt0)
        }
        if (t >= t1 && t < t2) {
          return q0mult * q0 * (t2 - t)/Δt1
        }
        if (t >= t2) {
          return 0
        }
      })
      break
  }

  return {
    q
  }

}

const Economics = (opts) => {
  opts = opts ? opts : {}

}

const Physics = (opts) => {
  opts = opts ? opts : {}

  const { r, c0, a, Finf, F0, B, Cd, x, T0 } = opts
  const td = (Cd / B) * (B + x) / x
  const A = 0

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
    td,
    A
  }
}

const Controls = (opts, time) => {
  const { t, n } = time

  const remove = Array(n).fill(0)
  const mitigate = Array(n).fill(0)
  const geoeng = Array(n).fill(0)
  const adapt = Array(n).fill(0)

  return {
    remove,
    mitigate,
    geoeng,
    adapt
  }
}

export { Model }