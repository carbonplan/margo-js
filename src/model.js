import diagnostics from './diagnostics'
import {
  Time,
  Baseline,
  Physics,
  Economics,
  Controls,
} from './components/index'
import defaults from './components/defaults'

const Model = (opts) => {
  opts = opts ? opts : {}

  const init = {
    time: { ...defaults.time, ...opts.time },
    baseline: { ...defaults.baseline, ...opts.baseline },
    controls: { ...defaults.controls, ...opts.controls },
    economics: { ...defaults.economics, ...opts.economics },
    physics: { ...defaults.physics, ...opts.physics },
  }

  var time = Time(init.time)
  var baseline = Baseline(init.baseline, time)
  var controls = Controls(init.controls, time)
  var economics = Economics(init.economics)
  var physics = Physics(init.physics)

  const out = {
    opts: () => init,
    n: () => time.n,
    t: () => time.t,
    mitigate: () => controls.mitigate,
    remove: () => controls.remove,
    geoeng: () => controls.geoeng,
    adapt: () => controls.adapt,
    set physics(opts) {
      init.physics = { ...init.physics, ...opts }
      physics = Physics(init.physics)
    },
    set economics(opts) {
      init.economics = { ...init.economics, ...opts }
      economics = Economics(init.economics)
    },
    set baseline(opts) {
      init.baseline = { ...init.baseline, ...opts }
      baseline = Baseline(init.baseline, time)
    },
    set controls(opts) {
      init.controls = { ...init.controls, ...opts }
      controls = Controls(init.controls, time)
    },
    set time(opts) {
      init.time = { ...init.time, ...opts }
      time = Time(init.time)
      baseline = Baseline(init.baseline, time)
      controls = Controls(init.controls, time)
    },
  }

  for (const [name, method] of Object.entries(diagnostics)) {
    out[name] = (opts) => method({ time, baseline, physics, controls }, opts)
  }

  return out
}

export { Model }
