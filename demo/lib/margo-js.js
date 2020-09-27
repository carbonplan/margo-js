'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const ppmToCO2e = (ppm) => ppm * (2.13 * (44 / 12));

const emissions = (model, opts) => {
  const defaults = { units: 'ppm' };
  const { units } = { ...defaults, ...opts };
  const { time, baseline, controls } = model;
  const e = time.i.map((i) => {
    return baseline.q[i] * (1 - controls.mitigate[i])
  });
  if (units === 'CO2e') {
    return e.map(ppmToCO2e)
  } else if (units === 'ppm') {
    return e
  }
};

const effectiveEmissions = (model, opts) => {
  const defaults = { units: 'ppm' };
  const { units } = { ...defaults, ...opts };
  const { time, baseline, physics, controls } = model;
  const { r } = physics;
  const { q } = baseline;
  const e = time.i.map((i) => {
    return r * (q[i] * (1 - controls.mitigate[i]) - q[0] * controls.remove[i])
  });
  if (units === 'CO2e') {
    return e.map(ppmToCO2e)
  } else if (units === 'ppm') {
    return e
  }
};

const concentration = (model) => {
  const { time, physics } = model;
  const cumsum = (sum) => (value) => (sum += value);
  const { c0 } = physics;
  return effectiveEmissions(model)
    .map((e) => e * time.dt)
    .map(cumsum(0))
    .map((c) => c0 + c)
};

const forcing = (model) => {
  const { time, physics, economics, controls } = model;
  const c = concentration(model);
  const { a, c0 } = physics;
  const { Finf } = economics;
  return time.i.map((i) => {
    return a * Math.log(c[i] / c0) - controls.geoeng[i] * Finf
  })
};

const ecs = (model) => {
  const { physics } = model;
  const { a, B } = physics;
  return (a * Math.log(2)) / B
};

const temperature = (model, opts) => {
  const defaults = {
    adapt: model.time.i.map((i) => 0),
  };
  const { adapt } = { ...defaults, ...opts };
  const { time, physics } = model;
  const cumsum = (sum) => (value) => (sum += value);
  const { Cd, x, B, T0 } = physics;
  const td = ((Cd / B) * (B + x)) / x;
  const { t, dt } = time;
  const f = forcing(model);
  const slow = time.i
    .map((i) => (Math.exp((t[i] - (t[0] - dt)) / td) / td) * f[i] * dt)
    .map(cumsum(0))
    .map((v, i) => {
      return ((v * (x / B)) / (x + B)) * Math.exp(-(t[i] - (t[0] - dt)) / td)
    });
  const fast = time.i.map((i) => f[i] / (x + B));
  const temp = time.i.map(
    (i) => Math.sqrt(1 - adapt[i]) * (T0 + slow[i] + fast[i])
  );
  return temp
};

const growth = (model) => {
  const { economics, time } = model;
  const { E0, gamma } = economics;
  return time.t.map((t) => E0 * Math.pow(1 + gamma, t - time.t[0]))
};

const discount = (model) => {
  const { economics, time } = model;
  const { rho } = economics;
  const { i, t, tnow, future } = time;
  return i.map((i) => (future[i] ? 0 : 1) * Math.pow(1 + rho, -(t[i] - tnow)))
};

const _damage = (model, discounting) => {
  const { economics, time, controls } = model;
  const { adapt } = controls;
  const { beta } = economics;
  const E = growth(model);
  const T = temperature(model, { adapt: adapt });
  const D = discount(model).map((d) => 1 + (discounting ? 1 : 0) * (d - 1));

  return time.i.map((i) => beta * E[i] * Math.pow(T[i], 2) * D[i])
};

const damage = (model, opts) => {
  const defaults = { discounting: false };
  const { discounting } = { ...defaults, ...opts };
  return _damage(model, discounting)
};

const damageBaseline = (model, opts) => {
  const defaults = { discounting: false };
  const { discounting } = { ...defaults, ...opts };
  const { time } = model;
  const initControls = model.controls;
  const { remove, mitigate, adapt, geoeng } = initControls;

  model.controls.remove = remove.map((r, i) => (time.future[i] ? r : 0));
  model.controls.mitigate = mitigate.map((m, i) => (time.future[i] ? m : 0));
  model.controls.adapt = adapt.map((a, i) => (time.future[i] ? a : 0));
  model.controls.geoeng = geoeng.map((g, i) => (time.future[i] ? g : 0));

  const out = _damage(model, discounting);

  model.controls.remove = remove;
  model.controls.mitigate = mitigate;
  model.controls.adapt = adapt;
  model.controls.geoeng = geoeng;

  return out
};

const cost = (model, opts) => {
  const defaults = { discounting: false, p: 2 };
  const { discounting, p } = { ...defaults, ...opts };

  const { economics, controls, baseline } = model;
  const { cost } = economics;
  const { mitigate, remove, adapt, geoeng } = controls;
  const { q } = baseline;

  const E = growth(model);
  const D = discount(model).map((d) => 1 + (discounting ? 1 : 0) * (d - 1));

  return model.time.i.map(
    (i) =>
      (ppmToCO2e(q[i]) * cost.mitigate * Math.pow(mitigate[i], p) +
        E[i] * cost.geoeng * Math.pow(geoeng[i], p) +
        cost.remove * Math.pow(remove[i], p) +
        cost.adapt * Math.pow(adapt[i], p)) *
      D[i]
  )
};

const benefit = (model, opts) => {
  const defaults = { discounting: false };
  opts = { ...defaults, ...opts };
  const db = damageBaseline(model, opts);
  const d = damage(model, opts);
  return model.time.i.map((i) => db[i] - d[i])
};

const netBenefit = (model, opts) => {
  const defaults = { discounting: false };
  opts = { ...defaults, ...opts };
  const c = cost(model, opts);
  const b = benefit(model, opts);
  return model.time.i.map((i) => b[i] - c[i])
};

const netPresentCost = (model, opts) => {
  const defaults = { discounting: false };
  opts = { ...defaults, ...opts };
  return (
    cost(model, opts).reduce(function (a, b) {
      return a + b
    }, 0) * model.time.dt
  )
};

const netPresentBenefit = (model, opts) => {
  const defaults = { discounting: false };
  opts = { ...defaults, ...opts };
  return (
    netBenefit(model, opts).reduce(function (a, b) {
      return a + b
    }, 0) * model.time.dt
  )
};

var diagnostics = {
  emissions,
  effectiveEmissions,
  concentration,
  forcing,
  temperature,
  ecs,
  growth,
  discount,
  damage,
  damageBaseline,
  cost,
  benefit,
  netBenefit,
  netPresentCost,
  netPresentBenefit,
};

const Time = (opts) => {
  const { dt, tmin, tmax, tnow } = opts;

  const n = Math.floor((tmax - tmin) / dt + 1);
  const t = Array.from(Array(n), (_, i) => tmin + i * dt);
  const i = Array.from(Array(n), (_, i) => i);
  const future = t.map((t) => t <= tnow);

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
};

const Controls = (opts, time) => {
  const { t } = time;

  var { remove, mitigate, geoeng, adapt } = opts;

  remove = Array.isArray(remove) ? remove : t.map(remove);
  mitigate = Array.isArray(mitigate) ? mitigate : t.map(mitigate);
  geoeng = Array.isArray(geoeng) ? geoeng : t.map(geoeng);
  adapt = Array.isArray(adapt) ? adapt : t.map(adapt);

  return {
    remove,
    mitigate,
    geoeng,
    adapt,
  }
};

const Physics = (opts) => {
  const { r, c0, a, F0, B, Cd, x, T0, A } = opts;

  return {
    r,
    c0,
    a,
    F0,
    B,
    Cd,
    x,
    T0,
    A,
  }
};

const Baseline = (opts, time) => {
  const { tmin } = time;
  const { form } = opts;

  const ramp = () => {
    const { q0, q0mult, t1, t2 } = opts;
    const Δt0 = t1 - tmin;
    const Δt1 = t2 - t1;
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
    });
    return q
  };

  const capped = () => {
    const { f0, r, m, td } = opts;
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
    });
    return q
  };

  var q;
  switch (form) {
    case 'ramp':
      q = ramp();
      break
    case 'capped':
      q = capped();
      break
    case 'array':
      q = opts.q;
      break
  }

  return {
    q,
  }
};

const Economics = (opts) => {
  const { E0, gamma, beta, rho, Finf, cost } = opts;

  return {
    E0,
    gamma,
    beta,
    rho,
    Finf,
    cost,
  }
};

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
};

const Model = (opts) => {
  opts = opts ? opts : {};

  const init = {
    time: { ...defaults.time, ...opts.time },
    baseline: { ...defaults.baseline, ...opts.baseline },
    controls: { ...defaults.controls, ...opts.controls },
    economics: { ...defaults.economics, ...opts.economics },
    physics: { ...defaults.physics, ...opts.physics },
  };

  var time = Time(init.time);
  var baseline = Baseline(init.baseline, time);
  var controls = Controls(init.controls, time);
  var economics = Economics(init.economics);
  var physics = Physics(init.physics);

  const out = {
    opts: () => init,
    n: () => time.n,
    t: () => time.t,
    mitigate: () => controls.mitigate,
    remove: () => controls.remove,
    geoeng: () => controls.geoeng,
    adapt: () => controls.adapt,
    set physics(opts) {
      init.physics = { ...init.physics, ...opts };
      physics = Physics(init.physics);
    },
    set economics(opts) {
      init.economics = { ...init.economics, ...opts };
      economics = Economics(init.economics);
    },
    set baseline(opts) {
      init.baseline = { ...init.baseline, ...opts };
      baseline = Baseline(init.baseline, time);
    },
    set controls(opts) {
      init.controls = { ...init.controls, ...opts };
      controls = Controls(init.controls, time);
    },
    set time(opts) {
      init.time = { ...init.time, ...opts };
      time = Time(init.time);
      baseline = Baseline(init.baseline, time);
      controls = Controls(init.controls, time);
    },
    copy: () => {
      return Model({
        time: time,
        baseline: baseline,
        controls: controls,
        economics: economics,
        physics: physics,
      })
    },
  };

  for (const [name, method] of Object.entries(diagnostics)) {
    out[name] = (opts) =>
      method({ time, baseline, economics, physics, controls }, opts);
  }

  return out
};

function iota(n) {
  var result = new Array(n);
  for(var i=0; i<n; ++i) {
    result[i] = i;
  }
  return result
}

var iota_1 = iota;

/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
var isBuffer_1 = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
};

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

var hasTypedArrays  = ((typeof Float64Array) !== "undefined");

function compare1st(a, b) {
  return a[0] - b[0]
}

function order() {
  var stride = this.stride;
  var terms = new Array(stride.length);
  var i;
  for(i=0; i<terms.length; ++i) {
    terms[i] = [Math.abs(stride[i]), i];
  }
  terms.sort(compare1st);
  var result = new Array(terms.length);
  for(i=0; i<result.length; ++i) {
    result[i] = terms[i][1];
  }
  return result
}

function compileConstructor(dtype, dimension) {
  var className = ["View", dimension, "d", dtype].join("");
  if(dimension < 0) {
    className = "View_Nil" + dtype;
  }
  var useGetters = (dtype === "generic");

  if(dimension === -1) {
    //Special case for trivial arrays
    var code =
      "function "+className+"(a){this.data=a;};\
var proto="+className+".prototype;\
proto.dtype='"+dtype+"';\
proto.index=function(){return -1};\
proto.size=0;\
proto.dimension=-1;\
proto.shape=proto.stride=proto.order=[];\
proto.lo=proto.hi=proto.transpose=proto.step=\
function(){return new "+className+"(this.data);};\
proto.get=proto.set=function(){};\
proto.pick=function(){return null};\
return function construct_"+className+"(a){return new "+className+"(a);}";
    var procedure = new Function(code);
    return procedure()
  } else if(dimension === 0) {
    //Special case for 0d arrays
    var code =
      "function "+className+"(a,d) {\
this.data = a;\
this.offset = d\
};\
var proto="+className+".prototype;\
proto.dtype='"+dtype+"';\
proto.index=function(){return this.offset};\
proto.dimension=0;\
proto.size=1;\
proto.shape=\
proto.stride=\
proto.order=[];\
proto.lo=\
proto.hi=\
proto.transpose=\
proto.step=function "+className+"_copy() {\
return new "+className+"(this.data,this.offset)\
};\
proto.pick=function "+className+"_pick(){\
return TrivialArray(this.data);\
};\
proto.valueOf=proto.get=function "+className+"_get(){\
return "+(useGetters ? "this.data.get(this.offset)" : "this.data[this.offset]")+
"};\
proto.set=function "+className+"_set(v){\
return "+(useGetters ? "this.data.set(this.offset,v)" : "this.data[this.offset]=v")+"\
};\
return function construct_"+className+"(a,b,c,d){return new "+className+"(a,d)}";
    var procedure = new Function("TrivialArray", code);
    return procedure(CACHED_CONSTRUCTORS[dtype][0])
  }

  var code = ["'use strict'"];

  //Create constructor for view
  var indices = iota_1(dimension);
  var args = indices.map(function(i) { return "i"+i });
  var index_str = "this.offset+" + indices.map(function(i) {
        return "this.stride[" + i + "]*i" + i
      }).join("+");
  var shapeArg = indices.map(function(i) {
      return "b"+i
    }).join(",");
  var strideArg = indices.map(function(i) {
      return "c"+i
    }).join(",");
  code.push(
    "function "+className+"(a," + shapeArg + "," + strideArg + ",d){this.data=a",
      "this.shape=[" + shapeArg + "]",
      "this.stride=[" + strideArg + "]",
      "this.offset=d|0}",
    "var proto="+className+".prototype",
    "proto.dtype='"+dtype+"'",
    "proto.dimension="+dimension);

  //view.size:
  code.push("Object.defineProperty(proto,'size',{get:function "+className+"_size(){\
return "+indices.map(function(i) { return "this.shape["+i+"]" }).join("*"),
"}})");

  //view.order:
  if(dimension === 1) {
    code.push("proto.order=[0]");
  } else {
    code.push("Object.defineProperty(proto,'order',{get:");
    if(dimension < 4) {
      code.push("function "+className+"_order(){");
      if(dimension === 2) {
        code.push("return (Math.abs(this.stride[0])>Math.abs(this.stride[1]))?[1,0]:[0,1]}})");
      } else if(dimension === 3) {
        code.push(
"var s0=Math.abs(this.stride[0]),s1=Math.abs(this.stride[1]),s2=Math.abs(this.stride[2]);\
if(s0>s1){\
if(s1>s2){\
return [2,1,0];\
}else if(s0>s2){\
return [1,2,0];\
}else{\
return [1,0,2];\
}\
}else if(s0>s2){\
return [2,0,1];\
}else if(s2>s1){\
return [0,1,2];\
}else{\
return [0,2,1];\
}}})");
      }
    } else {
      code.push("ORDER})");
    }
  }

  //view.set(i0, ..., v):
  code.push(
"proto.set=function "+className+"_set("+args.join(",")+",v){");
  if(useGetters) {
    code.push("return this.data.set("+index_str+",v)}");
  } else {
    code.push("return this.data["+index_str+"]=v}");
  }

  //view.get(i0, ...):
  code.push("proto.get=function "+className+"_get("+args.join(",")+"){");
  if(useGetters) {
    code.push("return this.data.get("+index_str+")}");
  } else {
    code.push("return this.data["+index_str+"]}");
  }

  //view.index:
  code.push(
    "proto.index=function "+className+"_index(", args.join(), "){return "+index_str+"}");

  //view.hi():
  code.push("proto.hi=function "+className+"_hi("+args.join(",")+"){return new "+className+"(this.data,"+
    indices.map(function(i) {
      return ["(typeof i",i,"!=='number'||i",i,"<0)?this.shape[", i, "]:i", i,"|0"].join("")
    }).join(",")+","+
    indices.map(function(i) {
      return "this.stride["+i + "]"
    }).join(",")+",this.offset)}");

  //view.lo():
  var a_vars = indices.map(function(i) { return "a"+i+"=this.shape["+i+"]" });
  var c_vars = indices.map(function(i) { return "c"+i+"=this.stride["+i+"]" });
  code.push("proto.lo=function "+className+"_lo("+args.join(",")+"){var b=this.offset,d=0,"+a_vars.join(",")+","+c_vars.join(","));
  for(var i=0; i<dimension; ++i) {
    code.push(
"if(typeof i"+i+"==='number'&&i"+i+">=0){\
d=i"+i+"|0;\
b+=c"+i+"*d;\
a"+i+"-=d}");
  }
  code.push("return new "+className+"(this.data,"+
    indices.map(function(i) {
      return "a"+i
    }).join(",")+","+
    indices.map(function(i) {
      return "c"+i
    }).join(",")+",b)}");

  //view.step():
  code.push("proto.step=function "+className+"_step("+args.join(",")+"){var "+
    indices.map(function(i) {
      return "a"+i+"=this.shape["+i+"]"
    }).join(",")+","+
    indices.map(function(i) {
      return "b"+i+"=this.stride["+i+"]"
    }).join(",")+",c=this.offset,d=0,ceil=Math.ceil");
  for(var i=0; i<dimension; ++i) {
    code.push(
"if(typeof i"+i+"==='number'){\
d=i"+i+"|0;\
if(d<0){\
c+=b"+i+"*(a"+i+"-1);\
a"+i+"=ceil(-a"+i+"/d)\
}else{\
a"+i+"=ceil(a"+i+"/d)\
}\
b"+i+"*=d\
}");
  }
  code.push("return new "+className+"(this.data,"+
    indices.map(function(i) {
      return "a" + i
    }).join(",")+","+
    indices.map(function(i) {
      return "b" + i
    }).join(",")+",c)}");

  //view.transpose():
  var tShape = new Array(dimension);
  var tStride = new Array(dimension);
  for(var i=0; i<dimension; ++i) {
    tShape[i] = "a[i"+i+"]";
    tStride[i] = "b[i"+i+"]";
  }
  code.push("proto.transpose=function "+className+"_transpose("+args+"){"+
    args.map(function(n,idx) { return n + "=(" + n + "===undefined?" + idx + ":" + n + "|0)"}).join(";"),
    "var a=this.shape,b=this.stride;return new "+className+"(this.data,"+tShape.join(",")+","+tStride.join(",")+",this.offset)}");

  //view.pick():
  code.push("proto.pick=function "+className+"_pick("+args+"){var a=[],b=[],c=this.offset");
  for(var i=0; i<dimension; ++i) {
    code.push("if(typeof i"+i+"==='number'&&i"+i+">=0){c=(c+this.stride["+i+"]*i"+i+")|0}else{a.push(this.shape["+i+"]);b.push(this.stride["+i+"])}");
  }
  code.push("var ctor=CTOR_LIST[a.length+1];return ctor(this.data,a,b,c)}");

  //Add return statement
  code.push("return function construct_"+className+"(data,shape,stride,offset){return new "+className+"(data,"+
    indices.map(function(i) {
      return "shape["+i+"]"
    }).join(",")+","+
    indices.map(function(i) {
      return "stride["+i+"]"
    }).join(",")+",offset)}");

  //Compile procedure
  var procedure = new Function("CTOR_LIST", "ORDER", code.join("\n"));
  return procedure(CACHED_CONSTRUCTORS[dtype], order)
}

function arrayDType(data) {
  if(isBuffer_1(data)) {
    return "buffer"
  }
  if(hasTypedArrays) {
    switch(Object.prototype.toString.call(data)) {
      case "[object Float64Array]":
        return "float64"
      case "[object Float32Array]":
        return "float32"
      case "[object Int8Array]":
        return "int8"
      case "[object Int16Array]":
        return "int16"
      case "[object Int32Array]":
        return "int32"
      case "[object Uint8Array]":
        return "uint8"
      case "[object Uint16Array]":
        return "uint16"
      case "[object Uint32Array]":
        return "uint32"
      case "[object Uint8ClampedArray]":
        return "uint8_clamped"
      case "[object BigInt64Array]":
        return "bigint64"
      case "[object BigUint64Array]":
        return "biguint64"
    }
  }
  if(Array.isArray(data)) {
    return "array"
  }
  return "generic"
}

var CACHED_CONSTRUCTORS = {
  "float32":[],
  "float64":[],
  "int8":[],
  "int16":[],
  "int32":[],
  "uint8":[],
  "uint16":[],
  "uint32":[],
  "array":[],
  "uint8_clamped":[],
  "bigint64": [],
  "biguint64": [],
  "buffer":[],
  "generic":[]
}

;
function wrappedNDArrayCtor(data, shape, stride, offset) {
  if(data === undefined) {
    var ctor = CACHED_CONSTRUCTORS.array[0];
    return ctor([])
  } else if(typeof data === "number") {
    data = [data];
  }
  if(shape === undefined) {
    shape = [ data.length ];
  }
  var d = shape.length;
  if(stride === undefined) {
    stride = new Array(d);
    for(var i=d-1, sz=1; i>=0; --i) {
      stride[i] = sz;
      sz *= shape[i];
    }
  }
  if(offset === undefined) {
    offset = 0;
    for(var i=0; i<d; ++i) {
      if(stride[i] < 0) {
        offset -= (shape[i]-1)*stride[i];
      }
    }
  }
  var dtype = arrayDType(data);
  var ctor_list = CACHED_CONSTRUCTORS[dtype];
  while(ctor_list.length <= d+1) {
    ctor_list.push(compileConstructor(dtype, ctor_list.length-1));
  }
  var ctor = ctor_list[d+1];
  return ctor(data, shape, stride, offset)
}

var ndarray = wrappedNDArrayCtor;

var swap = function swap (x, y) {
  var i, tmp;
  var dx = x.data;
  var dy = y.data;

  var ox = x.stride[0];
  var oy = y.stride[0];
  var px = x.offset;
  var py = y.offset;

  for (i = x.shape[0] - 1; i >= 0; i--, px += ox, py += oy) {
    tmp = dx[px];
    dx[px] = dy[py];
    dy[py] = tmp;
  }
};

var scal = function scal (alpha, x) {
  var i;
  var dx = x.data;
  var ox = x.stride[0];
  var px = x.offset;
  for (i = x.shape[0] - 1; i >= 0; i--, px += ox) {
    dx[px] *= alpha;
  }
};

var copy = function copy (x, y) {
  var i;
  var dx = x.data;
  var dy = y.data;
  var ox = x.stride[0];
  var oy = y.stride[0];
  var px = x.offset;
  var py = y.offset;
  for (i = x.shape[0] - 1; i >= 0; i--, px += ox, py += oy) {
    dy[py] = dx[px];
  }
};

var axpy = function axpy (alpha, x, y) {
  var i;
  var dx = x.data;
  var dy = y.data;
  var ox = x.stride[0];
  var oy = y.stride[0];
  var px = x.offset;
  var py = y.offset;
  for (i = x.shape[0] - 1; i >= 0; i--, px += ox, py += oy) {
    dy[py] += alpha * dx[px];
  }
};

var dot = function dot (x, y) {
  var i, tmp;
  var dx = x.data;
  var ox = x.stride[0];
  var px = x.offset;

  var sum = 0;
  if (x === y) {
    for (i = x.shape[0] - 1; i >= 0; i--, px += ox) {
      tmp = dx[px];
      sum += tmp * tmp;
    }
  } else {
    var dy = y.data;
    var oy = y.stride[0];
    var py = y.offset;
    for (i = x.shape[0] - 1; i >= 0; i--, px += ox, py += oy) {
      sum += dy[py] * dx[px];
    }
  }
  return sum;
};

var cpsc = function cpsc (alpha, x, y) {
  var i;
  var dx = x.data;
  var dy = y.data;
  var ox = x.stride[0];
  var oy = y.stride[0];
  var px = x.offset;
  var py = y.offset;
  for (i = x.shape[0] - 1; i >= 0; i--, px += ox, py += oy) {
    dy[py] = alpha * dx[px];
  }
};

var hypot = function hypot (a, b) {
  if (a === 0 && b === 0) {
    return 0;
  }
  var x = Math.abs(a);
  var y = Math.abs(b);
  var t = Math.min(x, y);
  var u = Math.max(x, y);
  t = t / u;
  return u * Math.sqrt(1 + t * t);
};

var nrm2 = function nrm2 (x) {
  var i, tmp;
  var dx = x.data;
  var ox = x.stride[0];
  var px = x.offset;
  var sum = 0;
  for (i = x.shape[0] - 1; i >= 0; i--, px += ox) {
    tmp = dx[px];
    sum = hypot(sum, tmp);
  }
  return sum;
};

var asum = function asum (x) {
  var i;
  var dx = x.data;
  var ox = x.stride[0];
  var px = x.offset;
  var sum = 0;
  for (i = x.shape[0] - 1; i >= 0; i--, px += ox) {
    sum += Math.abs(dx[px]);
  }
  return sum;
};

var iamax = function iamax (x) {
  var i, tmp, imax;
  var xmax = -Infinity;
  var dx = x.data;
  var ox = x.stride[0];
  var px = x.offset;
  var l = x.shape[0];
  for (i = 0; i < l; i++, px += ox) {
    tmp = Math.abs(dx[px]);
    if (tmp > xmax) {
      xmax = tmp;
      imax = i;
    }
  }
  return imax;
};

Math.sign = Math.sign || function (x) {
  x = +x; // convert to a number
  if (x === 0 || isNaN(x)) {
    return x;
  }
  return x > 0 ? 1 : -1;
};

var rotg = function rotg (a, b, csr) {
  // Based on Algorithm 4 from "Discontinuous Plane
  // Rotations and the Symmetric Eigenvalue Problem"
  // by Anderson, 2000.
  var c = 0;
  var s = 0;
  var r = 0;
  var t = 0;
  var u = 0;

  if (b === 0) {
    c = Math.sign(a);
    s = 0;
    r = Math.abs(a);
  } else if (a === 0) {
    c = 0;
    s = Math.sign(b);
    r = Math.abs(b);
  } else if (Math.abs(a) > Math.abs(b)) {
    t = b / a;
    u = Math.sign(a) * Math.sqrt(1 + t * t);
    c = 1 / u;
    s = t * c;
    r = a * u;
  } else {
    t = a / b;
    u = Math.sign(a) * Math.sqrt(1 + t * t);
    s = 1 / u;
    c = t * s;
    r = b * u;
  }
  // try to save some unnecessary object creation
  if (csr !== undefined && csr.length > 2) {
    csr[0] = c;
    csr[1] = s;
    csr[2] = r;
  } else {
    return [c, s, r];
  }
};

var swap$1 = swap;
var scal$1 = scal;
var copy$1 = copy;
var axpy$1 = axpy;
var dot$1 = dot;
var cpsc$1 = cpsc;
var nrm2$1 = nrm2;
var asum$1 = asum;
var iamax$1 = iamax;
var rotg$1 = rotg;

var ndarrayBlasLevel1 = {
	swap: swap$1,
	scal: scal$1,
	copy: copy$1,
	axpy: axpy$1,
	dot: dot$1,
	cpsc: cpsc$1,
	nrm2: nrm2$1,
	asum: asum$1,
	iamax: iamax$1,
	rotg: rotg$1
};

var gemv = function gemv(alpha, A, x, beta, y) {
  var val;
  var adata = A.data;
  var ao = A.offset;
  var as0 = A.stride[0];
  var as1 = A.stride[1];
  var xdata = x.data;
  var xo = x.offset;
  var xs = x.stride[0];
  var ydata = y.data;
  var yo = x.offset;
  var ys = y.stride[0];
  for (var i = A.shape[0] - 1; i >= 0; --i) {
    val = 0;
    for (var j = A.shape[1] - 1; j >= 0; --j) {
      val += adata[ao + as0 * i + as1 * j] * xdata[xo + xs * j];
    }
    ydata[yo + ys * i] = ydata[yo + ys * i] * beta + alpha * val;
  }
  return true
};

var parabolicApprox = function parabolicLineSearch(X0, s, F, X) {
  var n = X0.shape[0];
  var x = ndarray(new Float64Array(n), [n, 1]);
  ndarrayBlasLevel1.copy(X0, x);
  var alphas = new Float64Array([0, 0, 0]);
  var fs = new Float64Array([0, 0, 0]);

  fs[0] = F(x);
  alphas[0] = 0;
  var alpha = 0.01;
  ndarrayBlasLevel1.copy(X0, x);
  ndarrayBlasLevel1.axpy(alpha, s, x);
  fs[1] = F(x);
  alphas[1] = alpha;
  alpha *= 2;
  ndarrayBlasLevel1.copy(X0, x);
  ndarrayBlasLevel1.axpy(alpha, s, x);
  fs[2] = F(x);
  alphas[2] = alpha;

  var j = 2;
  while (fs[(j - 1) % 3] - fs[j % 3] > 0) {
    j++;
    alpha *= 2;
    ndarrayBlasLevel1.copy(X0, x);
    ndarrayBlasLevel1.axpy(alpha, s, x);
    fs[j % 3] = F(x);
    alphas[j % 3] = alpha;
  }
  var da = (alphas[j % 3] - alphas[(j - 1) % 3]) / 2;
  var aLast = alpha - da;
  ndarrayBlasLevel1.copy(X0, x);
  ndarrayBlasLevel1.axpy(aLast, s, x);
  var fLast = F(x);

  var a2;
  var f1;
  var f2;
  var f3;
  if (fs[(j - 1) % 3] < fLast) {
    // a1 = alphas[(j - 2) % 3];
    a2 = alphas[(j - 1) % 3];
    // a3 = aLast;
    f1 = fs[(j - 2) % 3];
    f2 = fs[(j - 1) % 3];
    f3 = fLast;
  } else {
    // a1 = alphas[(j - 1) % 3];
    a2 = aLast;
    // a3 = alphas[j % 3];
    f1 = fs[(j - 1) % 3];
    f2 = fLast;
    f3 = fs[j % 3];
  }

  // points now bracket the minimum
  // approximate with parabola and find the minimum
  var aMin = a2 + (da * (f1 - f3)) / (2 * (f1 - 2 * f2 + f3));
  ndarrayBlasLevel1.copy(X0, X);
  ndarrayBlasLevel1.axpy(aMin, s, X);
  return true
};

// module.exports.cubicApprox = function cubicLineSearch (X0, s, F, X) {
// };

var lineSearch = {
	parabolicApprox: parabolicApprox
};

var forwardDifference = function forwardDifference(x0, dx, f, grad) {
  var fx0 = f(x0);
  var fxh = 0;
  var h = 0;
  var xi = 0;
  var i = 0;
  var len = x0.shape[0];
  var nrm2 = 0;
  var gradVal = 0;

  if (x0.length !== grad.length) {
    throw new Error('Gradient and point arrays not same length.')
  }

  if (Array.isArray(dx)) {
    for (i = 0; i < len; i++) {
      xi = x0.get(i, 0);
      h = dx.get(i, 0);
      x0.set(i, 0, xi + h);
      fxh = f(x0);
      gradVal = (fxh - fx0) / h;
      grad.set(i, 0, gradVal);
      nrm2 += gradVal * gradVal;
      x0.set(i, 0, xi);
    }
  } else if (typeof dx === 'number') {
    for (i = 0; i < len; i++) {
      xi = x0.get(i, 0);
      x0.set(i, 0, xi + dx);
      fxh = f(x0);
      gradVal = (fxh - fx0) / dx;
      grad.set(i, 0, gradVal);
      nrm2 += gradVal * gradVal;
      x0.set(i, 0, xi);
    }
  } else {
    throw new Error('Invalid dx.')
  }

  if (isNaN(nrm2)) {
    throw new Error('2-norm of gradient is NaN.')
  }
  return Math.sqrt(nrm2)
};

var backwardDifference = function backwardDifference(
  x0,
  dx,
  f,
  grad
) {
  var fx0 = f(x0);
  var fxh = 0;
  var h = 0;
  var xi = 0;
  var i = 0;
  var len = x0.shape[0];
  var nrm2 = 0;
  var gradVal = 0;

  if (x0.shape[0] !== grad.shape[0]) {
    throw new Error('Gradient and point arrays not same length.')
  }

  if (Array.isArray(dx)) {
    for (i = 0; i < len; i++) {
      xi = x0.get(i, 0);
      h = dx.get(i, 0);
      x0.set(i, 0, xi - h);
      fxh = f(x0);
      gradVal = (fxh - fx0) / h;
      grad.set(i, 0, gradVal);
      nrm2 += gradVal * gradVal;
      x0.set(i, 0, xi);
    }
  } else if (typeof dx === 'number') {
    for (i = 0; i < len; i++) {
      xi = x0.get(i, 0);
      x0.set(i, 0, xi - dx);
      fxh = f(x0);
      gradVal = (fxh - fx0) / dx;
      grad.set(i, 0, gradVal);
      nrm2 += gradVal * gradVal;
      x0.set(i, 0, xi);
    }
  } else {
    throw new Error('Invalid dx.')
  }

  if (isNaN(nrm2)) {
    throw new Error('2-norm of gradient is NaN.')
  }
  return Math.sqrt(nrm2)
};

var centralDifference = function centralDifference(x0, dx, f, grad) {
  var fx0 = 0;
  var fxh = 0;
  var h = 0;
  var xi = 0;
  var i = 0;
  var len = x0.shape[0];
  var nrm2 = 0;
  var gradVal = 0;

  if (x0.shape[0] !== grad.shape[0]) {
    throw new Error('Gradient and point arrays not same length.')
  }

  if (Array.isArray(dx)) {
    for (i = 0; i < len; i++) {
      xi = x0.get(i, 0);

      h = dx.get(i, 0);
      x0.set(i, 0, xi - h);
      fx0 = f(x0);
      x0.set(i, 0, xi);
      fxh = f(x0);
      gradVal = (fxh - fx0) / (2 * h);
      grad.set(i, 0, gradVal);
      nrm2 += gradVal * gradVal;
      x0[i] = xi;
    }
  } else if (typeof dx === 'number') {
    for (i = 0; i < len; i++) {
      xi = x0.get(i, 0);

      h = dx;
      x0.set(i, 0, xi - h);
      fx0 = f(x0);
      x0.set(i, 0, xi + h);
      fxh = f(x0);
      gradVal = (fxh - fx0) / (2 * h);
      grad.set(i, 0, gradVal);
      nrm2 += gradVal * gradVal;
      x0.set(i, 0, xi);
    }
  } else {
    throw new Error('Invalid dx.')
  }

  if (isNaN(nrm2)) {
    throw new Error('2-norm of gradient is NaN.')
  }
  return Math.sqrt(nrm2)
};

var derivatives = {
	forwardDifference: forwardDifference,
	backwardDifference: backwardDifference,
	centralDifference: centralDifference
};

var gradientSelect = function getGradient(options) {
  var derivFn;
  var delta = 0.01;

  if (options.gradient.func) {
    if (typeof options.gradient.func === 'string') {
      switch (options.gradient.func) {
        case 'forwardDifference':
          delta = 0.0001;
          if (options.gradient.delta) {
            delta = Math.abs(options.gradient.delta);
          }
          derivFn = function (X, grad) {
            return derivatives.forwardDifference(X, delta, options.func, grad)
          };
          break
        case 'backwardDifference':
          delta = 0.0001;
          if (options.gradient.delta) {
            delta = Math.abs(options.gradient.delta);
          }
          derivFn = function (X, grad) {
            return derivatives.backwardDifference(X, delta, options.func, grad)
          };
          break
        case 'centralDifference':
        default:
          if (options.gradient.delta) {
            delta = Math.abs(options.gradient.delta);
          }
          derivFn = function (X, grad) {
            return derivatives.centralDifference(X, delta, options.func, grad)
          };
          break
      }
    } else {
      // TODO: don't just accept this blindly
      derivFn = options.gradient.func;
    }
  } else {
    if (options.gradient.delta) {
      delta = Math.abs(options.gradient.delta);
    }
    derivFn = function (X, grad) {
      return derivatives.centralDifference(X, delta, options.func, grad)
    };
  }

  return derivFn
};

var replaceExisting = function outerProduct(a, b, alpha, N) {
  var m = a.shape[0];
  var n = b.shape[0];
  var A = N || ndarray(new Float64Array(m * n), [m, n]);
  var i = 0;
  var j = 0;
  for (i = 0; i < m; ++i) {
    for (j = 0; j < n; ++j) {
      A.set(i, j, alpha * a.get(i, 0) * b.get(j, 0));
    }
  }
  return A
};

var addToExisting = function outerProduct(a, b, alpha, N) {
  var m = a.shape[0];
  var n = b.shape[0];
  var A = N || ndarray(new Float64Array(m * n), [m, n]);
  var i = 0;
  var j = 0;
  for (i = 0; i < m; ++i) {
    for (j = 0; j < n; ++j) {
      A.set(i, j, alpha * a.get(i, 0) * b.get(j, 0) + N.get(i, j));
    }
  }
  return A
};

var outerProduct = {
	replaceExisting: replaceExisting,
	addToExisting: addToExisting
};

var hessian = {
  rank1: function (H, y, dx) {
    var n = y.shape[0];

    // TODO: should we clobber the y array instead of copy?
    var t1 = ndarray(new Float64Array(n), [n, 1]);
    ndarrayBlasLevel1.copy(y, t1);

    gemv(-1.0, H, dx, 1.0, t1);
    var alpha = 1.0 / ndarrayBlasLevel1.dot(t1, dx);
    outerProduct.addToExisting(alpha, t1, t1, H);
    return true
  },
  rank2DFP: function (H, y, dx) {
    // warning: Tim's own implementation!!!
    var n = y.shape[0];
    var t1 = ndarray(new Float64Array(n), [n, 1]);
    gemv(-1.0, H, dx, 0.0, t1);
    var a = -1.0 / ndarrayBlasLevel1.dot(t1, dx);
    outerProduct.addToExisting(t1, t1, a, H);
    var b = 1.0 / ndarrayBlasLevel1.dot(y, dx);
    outerProduct.addToExisting(y, y, b, H);
  },
  rank2BFGS: function (H, y, dx) {
    var n = y.shape[0];
    var t1 = ndarray(new Float64Array(n), [n, 1]);
    gemv(1.0, H, dx, 0.0, t1); // t1 = H * x
    var a = 1.0 / ndarrayBlasLevel1.dot(y, dx);
    var b = -1.0 / ndarrayBlasLevel1.dot(dx, t1);
    outerProduct.addToExisting(y, y, a, H);
    outerProduct.addToExisting(t1, t1, b, H);
  },
};

var hessianInverse = {
  rank1: function (N, y, dx) {
    var n = dx.shape[0];

    // TODO: should we clobber the dx array instead of copy?
    var t1 = ndarray(new Float64Array(n), [n, 1]);
    ndarrayBlasLevel1.copy(dx, t1);

    gemv(-1.0, N, y, 1.0, t1);
    var alpha = 1.0 / ndarrayBlasLevel1.dot(t1, y);
    outerProduct.addToExisting(t1, t1, alpha, N);
    return true
  },
  rank2DFP: function (N, y, dx) {
    var n = y.shape[0];
    var t1 = ndarray(new Float64Array(n), [n, 1]);
    gemv(1.0, N, y, 0.0, t1);
    var b = -1.0 / ndarrayBlasLevel1.dot(t1, y);
    outerProduct.addToExisting(t1, t1, b, N);
    var a = 1.0 / ndarrayBlasLevel1.dot(dx, y);
    outerProduct.addToExisting(dx, dx, a, N);
  },
  rank2BFGS: function (N, y, dx) {
    var n = y.shape[0];
    var t1 = ndarray(new Float64Array(n), [n, 1]);
    gemv(1.0, N, y, 0.0, t1); // t1 = Nk * yk
    var a = ndarrayBlasLevel1.dot(dx, y);
    var b = ndarrayBlasLevel1.dot(y, t1);
    var c = 1.0 / a;
    var d = (1 + b / a) * c;
    outerProduct.addToExisting(dx, dx, d, N);
    outerProduct.addToExisting(dx, t1, -c, N);
    outerProduct.addToExisting(t1, dx, -c, N);
  },
};

var rankUpdates = {
	hessian: hessian,
	hessianInverse: hessianInverse
};

var updateSelect = function getUpdate(options) {
  var updateFn;
  if (!options.update) {
    throw new Error('No update variables defined.')
  }
  if (!options.update.hasOwnProperty('hessianInverse')) {
    throw new Error('No option specified for Hessian or Hessian Inverse.')
  }
  var hessianInverse = options.update.hessianInverse;
  if (!options.update.type) {
    throw new Error('No update type specified.')
  }
  var updateType = options.update.type;

  if (hessianInverse) {
    if (typeof updateType === 'string') {
      switch (updateType) {
        case 'rank1':
          updateFn = rankUpdates.hessianInverse.rank1;
          break
        case 'rank2-dfp':
          updateFn = rankUpdates.hessianInverse.rank2DFP;
          break
        case 'rank2-bfgs':
        default:
          updateFn = rankUpdates.hessianInverse.rank2BFGS;
          break
      }
    } else if (typeof updateType === 'function') {
      // TODO: don't accept just anything blindly
      updateFn = updateType;
    } else {
      throw new Error('Update type is invalid.')
    }
  } else {
    if (typeof updateType === 'string') {
      switch (updateType) {
        case 'rank1':
          updateFn = rankUpdates.hessian.rank1;
          break
        case 'rank2-dfp':
          updateFn = rankUpdates.hessian.rank2DFP;
          break
        case 'rank2-bfgs':
        default:
          updateFn = rankUpdates.hessian.rank2BFGS;
          break
      }
    } else if (typeof updateType === 'function') {
      // TODO: don't accept just anything blindly
      updateFn = updateType;
    } else {
      throw new Error('Update type is invalid.')
    }
  }

  return updateFn
};

var MAX_ITERATIONS = 200;
var TOLERANCE = 1e-12;

var globalDefaults = {
	MAX_ITERATIONS: MAX_ITERATIONS,
	TOLERANCE: TOLERANCE
};

var quasiNewton = function quasiNewton(options) {
  if (!options.objective) {
    throw new Error('Undefined optimization objective.')
  }
  if (!options.objective.start) {
    throw new Error('Undefined start position.')
  }
  if (!options.objective.func) {
    throw new Error('Undefined objective function.')
  }

  var maxIterations = globalDefaults.MAX_ITERATIONS;
  var tolerance = globalDefaults.tolerance;
  if (options.solution) {
    if (
      options.solution.maxIterations &&
      !isNaN(options.solution.maxIterations)
    ) {
      maxIterations = options.solution.maxIterations;
    } else {
      console.warn(
        'Maximum iterations capped at default of ' + maxIterations + '.'
      );
    }
    if (options.solution.tolerance && !isNaN(options.solution.tolerance)) {
      tolerance = options.solution.tolerance;
    } else {
      console.warn('Numerical tolerance is default of ' + tolerance + '.');
    }
  }

  var evaluateDerivative = gradientSelect(options.objective);
  var F = options.objective.func;
  var updateInverse = updateSelect(options);

  var x0 = options.objective.start;
  var n = x0.shape[0];
  var x1 = ndarray(new Float64Array(n), [n, 1]);
  var dx = ndarray(new Float64Array(n), [n, 1]);
  var grad0 = ndarray(new Float64Array(n), [n, 1]);
  var grad1 = ndarray(new Float64Array(n), [n, 1]);
  var y = ndarray(new Float64Array(n), [n, 1]);
  var N = ndarray(new Float64Array(n * n), [n, n]);
  var f0 = Number.POSITIVE_INFINITY;
  var f1 = F(x0);
  for (var i = 0; i < n; ++i) {
    for (var j = 0; j < n; ++j) {
      N.set(i, j, i === j ? 1 : 0);
    }
  }
  var gradNorm = evaluateDerivative(x0, grad0);
  ndarrayBlasLevel1.cpsc(-1.0 / gradNorm, grad0, y);

  var iter = 0;
  var temp1;
  var temp2;
  while (
    Math.abs(f1 - f0) > tolerance &&
    Math.abs(gradNorm) > tolerance &&
    iter++ <= maxIterations
  ) {
    lineSearch.parabolicApprox(x0, y, F, x1);
    gradNorm = evaluateDerivative(x1, grad1);
    f0 = f1;
    f1 = F(x1);
    ndarrayBlasLevel1.copy(x1, dx);
    ndarrayBlasLevel1.axpy(-1.0, x0, dx);
    ndarrayBlasLevel1.copy(grad1, y);
    ndarrayBlasLevel1.axpy(-1.0, grad0, y);
    updateInverse(N, y, dx);
    gemv(-1.0 / gradNorm, N, grad1, 0.0, y);
    temp1 = grad0;
    grad0 = grad1;
    grad1 = temp1;
    temp2 = x0;
    x0 = x1;
    x1 = temp2;
  }

  var solutionValid =
    Math.abs(f1 - f0) > tolerance || Math.abs(gradNorm) > tolerance;
  var results = {
    solutionValid: solutionValid,
    iterations: iter,
    objective: f1,
    gradNorm: gradNorm,
    x0: x0,
  };
  return results
};

var unconstrained = {
  quasiNewton: quasiNewton,
};

var ndarrayOptimization = {
	unconstrained: unconstrained
};

const optimize = (model, opts) => {
  const mOpt = model.copy();

  const defaults = {
    discounting: true,
    tolerance: 1e-5,
    niter: 500,
    objective: 'netBenefit',
    max: {
      mitigate: 1,
      remove: 1,
      geoeng: 1,
      adapt: 0,
    },
    delay: {
      mitigate: 0,
      remove: 10,
      geoeng: 30,
      adapt: 0,
    },
  };

  const { tolerance, niter, objective, max, delay, discounting } = {
    ...defaults,
    ...opts,
  };

  const index = mOpt.t().map((_, i) => i);
  const t = mOpt.t();
  const n = mOpt.n();

  const M = max.mitigate > 0;
  const R = max.remove > 0;
  const G = max.geoeng > 0;

  const _ub = (n, m, td) => {
    return Array(n)
      .fill(0)
      .map((_, i) => {
        if (t[i] - t[0] >= td) return m
        else return 0
      })
  };

  const ub = (M ? _ub(n, max.mitigate, delay.mitigate) : [])
    .concat(R ? _ub(n, max.remove, delay.remove) : [])
    .concat(G ? _ub(n, max.geoeng, delay.geoeng) : []);

  const lb = ub.map((_) => 0);

  const init = (M ? Array(n).fill(0) : [])
    .concat(R ? Array(n).fill(0.4) : [])
    .concat(G ? Array(n).fill(0.4) : []);

  const x0 = ndarray(init, [init.length, 1]);

  let F = (x) => {
    x.data = x.data.map((x, i) => Math.max(x, lb[i]));
    x.data = x.data.map((x, i) => Math.min(x, ub[i]));

    if (M & !R & !G) {
      mOpt.controls = {
        mitigate: index.map((i) => x.get(i, 0)),
      };
    }

    if (R & !M & !G) {
      mOpt.controls = {
        remove: index.map((i) => x.get(i, 0)),
      };
    }

    if (G & !M & !R) {
      mOpt.controls = {
        geoeng: index.map((i) => x.get(i, 0)),
      };
    }

    if (M & R & !G) {
      mOpt.controls = {
        mitigate: index.map((i) => x.get(i, 0)),
        remove: index.map((i) => x.get(n + i, 0)),
      };
    }

    if (M & G & !R) {
      mOpt.controls = {
        mitigate: index.map((i) => x.get(i, 0)),
        geoeng: index.map((i) => x.get(n + i, 0)),
      };
    }

    if (G & R & !M) {
      mOpt.controls = {
        remove: index.map((i) => x.get(i, 0)),
        geoeng: index.map((i) => x.get(n + i, 0)),
      };
    }

    if (M & R & G) {
      mOpt.controls = {
        mitigate: index.map((i) => x.get(i, 0)),
        remove: index.map((i) => x.get(n + i, 0)),
        geoeng: index.map((i) => x.get(2 * n + i, 0)),
      };
    }

    return -mOpt.netPresentBenefit({ discounting: discounting })
  };

  const options = {
    objective: {
      start: x0,
      func: F,
      gradient: {
        func: 'centralDifference',
        delta: 0.01,
      },
    },
    update: {
      hessianInverse: true,
      type: 'rank1',
    },
    solution: {
      tolerance: tolerance,
      maxIterations: niter,
    },
  };

  let results;
  try {
    results = ndarrayOptimization.unconstrained.quasiNewton(options);
    return mOpt
  } catch (err) {
    console.log('error during optimization');
    return null
  }
};

exports.Model = Model;
exports.optimize = optimize;
