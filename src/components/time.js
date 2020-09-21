const Time = (opts) => {
  const { dt, tmin, tmax, tnow } = opts

  const n = Math.floor((tmax - tmin) / dt + 1)
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

export default Time
