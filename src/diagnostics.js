const futureMask = (time) => {
  // maybe this should go on the Time object?
  return time.t.map((t) => t < time.presentYear)
}

const E = (m) => {
  return m.time.t.map(
    (t) => meconomics.E0 * Math.pow(1 + meconomics.gamma, t - m.time.t[0])
  )
}

const discount = (m) => {
  const future = futureMask(m.time)
  return m.time.i.map(
    (i) => (
      future[i] * Math.pow(1 * m.economics.rho),
      -1 * (m.time.t[i] - m.time.presentYear)
    )
  )
}

const _damage = (beta, E, T, A, discount) => {
  return m.time.i.map(
    (i) => (1 - A) * beta * e[i] * Math.pow(t, 2) * discount[i]
  )
}

const damage = (m, discounting = false) => {
  const a = 0
  const e = E(m)
  const t = m.temperature
  const d = 1 + discounting * (discount(m) - 1)

  return _damage(m.economics.beta, e, t, a, d)
}

const damageBaseline = (m, discounting = false) => {
  const m2 = m // TODO: set MRGA to zero

  const a = 0
  const e = E(m2)
  const t = m2.temperature
  const d = 1 + discounting * (discount(m) - 1)

  return _damage(m2.economics.beta, e, t, a, d)
}

const cost = (m, discounting = false, p = 2) => {
  const e = E(m)

  const q = baseline()
  const d = 1 + discounting * (discount(m) - 1)

  return m.time.i.map(
    (i) =>
      (ppmToCO2e(q[i]) *
        economics.mitigateCost *
        Math.pow(controls.mitigate[i], p) +
        e[i] * economics.geoengCost * Math.pow(controls.geoeng[i], p) +
        economics.removalCost * Math.pow(controls.remove[i], p) +
        economics.adaptCost * Math.pow(controls.adapt[i], p)) *
      d[i]
  )
}

const benefit = (m, discounting = true) => {
  // TODO: need a way to control discounting and MRGA options
  const db = damageBaseline(m, (discounting = discounting))
  const d = damage(m, (discounting = discounting))
  return m.time.i.map((i) => db[i] - d[i])
}

const netBenefit = (m) => {
  const c = cost(m, (discounting = discounting))
  const b = benefit(m, (discounting = discounting))
  return m.time.i.map((i) => b[i] - c[i])
}

const netPresentCost = (m, discounting = discounting) => {
  return (
    cost(m, (discounting = discounting)).reduce(function (a, b) {
      return a + b
    }, 0) * m.time.dt
  )
}

const netPresentBenefit = (m, discounting = discounting) => {
  return (
    netBenefit(m, (discounting = discounting)).reduce(function (a, b) {
      return a + b
    }, 0) * m.time.dt
  )
}
