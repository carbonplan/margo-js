const Physics = (opts) => {
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

export default Physics