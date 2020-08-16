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

export default defaults
