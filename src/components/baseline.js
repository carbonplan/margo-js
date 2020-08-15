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

export default Baseline