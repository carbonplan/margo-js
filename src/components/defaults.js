const defaults = {
  time: {
    dt: 5,
    tmin: 2020,
    tmax: 2200
  },
  baseline: {
    form: 'ramp',
    q0: 7.5,
    q0mult: 3,
    t1: 2100,
    t2: 2150,
  },
  physics: {
    r: 0.5,
    c0: 460,
    a: 6.9 / 2 / Math.log(2),
    Finf: 8.5,
    F0: 3,
    B: 1.13,
    Cd: 106,
    x: 0.73,
    T0: 1.1,
    A: 0,
  },
  economics: {},
  controls: {
    remove: (t) => 0,
    mitigate: (t) => 0,
    geoeng: (t) => 0,
    adapt: (t) => 0,
  }
}

export default defaults