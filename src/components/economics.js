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

export default Economics
