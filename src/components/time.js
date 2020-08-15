const Time = (opts) => {
  const { dt, tmin, tmax } = opts

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

export default Time