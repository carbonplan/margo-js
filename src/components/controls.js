const Controls = (opts, time) => {
  const { t } = time

  var { remove, mitigate, geoeng, adapt } = opts

  remove = Array.isArray(remove) ? remove : t.map(remove)
  mitigate = Array.isArray(mitigate) ? mitigate : t.map(mitigate)
  geoeng = Array.isArray(geoeng) ? geoeng : t.map(geoeng)
  adapt = Array.isArray(adapt) ? adapt : t.map(adapt)

  return {
    remove,
    mitigate,
    geoeng,
    adapt,
  }
}

export default Controls
