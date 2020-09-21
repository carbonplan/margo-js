const test = require('tape')
const margo = require('..')

const modelDefault = margo.Model({
  time: {
    dt: 20,
  },
})

const modelControlled = margo.Model({
  time: {
    dt: 20,
  },
  controls: {
    mitigate: () => 0.1,
    remove: () => 0.1,
    adapt: () => 0.1,
    geoeng: () => 0.1,
  },
})

test.Test.prototype.almostEqual = function (a, b, msg, extra) {
  this._assert(a.toFixed(11) == b.toFixed(11), {
    message: msg || 'should be equal up to precision of 12',
    operator: 'equal',
    actual: a,
    expected: b,
    extra: extra,
  })
}

test.Test.prototype.arrayAlmostEqual = function (a, b, msg, extra) {
  const matches = a
    .map((ai, i) => ai.toFixed(11) == b[i].toFixed(11))
    .reduce((x, y) => x + y, 0)
  this._assert(a.length == b.length, {
    message: msg || 'arrays should be the same length',
    operator: 'equal',
    actual: a.length,
    expected: b.length,
    extra: extra,
  })
  this._assert(matches == a.length, {
    message: msg || 'arrays should be equal up to precision of 12',
    operator: 'equal',
    actual: a,
    expected: b,
    extra: extra,
  })
}

test('n (default)', (t) => {
  const m = margo.Model()
  t.equal(m.n(), 37)
  t.end()
})

test('t (default)', (t) => {
  const m = margo.Model()
  t.equal(m.t()[0], 2020)
  t.equal(m.t()[5], 2045)
  t.end()
})

test('opts (default)', (t) => {
  const m = margo.Model()
  t.equal(m.opts().time.dt, 5)
  t.end()
})

test('update', (t) => {
  const m = margo.Model()

  t.almostEqual(m.ecs(), 3.053097345132744)
  m.physics = { B: 1.2 }
  t.almostEqual(m.ecs(), 2.8750000000000004)

  t.equal(m.t()[0], 2020)
  m.time = { tmin: 2030 }
  t.equal(m.t()[0], 2030)

  t.end()
})

test('specify controls as function', (t) => {
  const m = margo.Model({
    controls: {
      remove: (t, i) => i * 0.1,
    },
  })
  t.equal(m.remove()[0], 0)
  t.equal(m.remove()[5], 0.5)
  t.end()
})

test('specify controls as array', (t) => {
  const m = margo.Model()
  m.controls = {
    remove: Array(m.n()).fill(1),
  }
  t.equal(m.remove()[0], 1)
  t.equal(m.remove()[5], 1)
  t.end()
})

test('specify baseline as array', (t) => {
  const m = margo.Model()
  m.baseline = {
    form: 'array',
    q: Array(m.n()).fill(1),
  }
  t.equal(m.emissions()[0], 1)
  t.equal(m.emissions()[1], 1)
  t.equal(m.emissions()[m.n() - 1], 1)
  t.end()
})

test('emissions (default)', (t) => {
  t.arrayAlmostEqual(modelDefault.emissions(), [
    7.5,
    11.25,
    15.0,
    18.75,
    22.5,
    13.5,
    4.5,
    0.0,
    0.0,
    0.0,
  ])
  t.end()
})

test('emissions (controlled) (default)', (t) => {
  t.arrayAlmostEqual(modelControlled.emissions(), [
    6.75,
    10.125,
    13.5,
    16.875,
    20.25,
    12.15,
    4.05,
    0.0,
    0.0,
    0.0,
  ])
  t.end()
})

test('concentration (default)', (t) => {
  t.arrayAlmostEqual(modelDefault.concentration(), [
    535.0,
    647.5,
    797.5,
    985.0,
    1210.0,
    1345.0,
    1390.0,
    1390.0,
    1390.0,
    1390.0,
  ])
  t.end()
})

test('concentration (controlled) (default)', (t) => {
  t.arrayAlmostEqual(modelControlled.concentration(), [
    520.0,
    613.75,
    741.25,
    902.5,
    1097.5,
    1211.5,
    1244.5,
    1237.0,
    1229.5,
    1222.0,
  ])
  t.end()
})

test('forcing (default)', (t) => {
  t.arrayAlmostEqual(modelDefault.forcing(), [
    0.7517723546872629,
    1.7016998441219167,
    2.7387847690921054,
    3.7897900287278037,
    4.813789420200657,
    5.34025640242366,
    5.504057952499408,
    5.504057952499408,
    5.504057952499408,
    5.504057952499408,
  ])
  t.end()
})

test('forcing (controlled) (default)', (t) => {
  t.arrayAlmostEqual(modelControlled.forcing(), [
    -0.2397717208099268,
    0.5852595409889971,
    1.5247258677870188,
    2.504411094364046,
    3.478077348500291,
    3.9699558028490514,
    4.103718600926479,
    4.073632082410381,
    4.043362591848391,
    4.012907890116523,
  ])
  t.end()
})

test('temperature (default)', (t) => {
  t.arrayAlmostEqual(modelDefault.temperature(), [
    1.526027622362269,
    2.084444353331271,
    2.716031706089714,
    3.3797073431351334,
    4.050707999726517,
    4.45984901106036,
    4.668647265532098,
    4.779688595923032,
    4.881816322065217,
    4.9757459643907636,
  ])
  t.end()
})

test('temperature (controlled) (default)', (t) => {
  t.arrayAlmostEqual(
    modelControlled.temperature({ adapt: modelControlled.adapt() }),
    [
      0.9146463729161577,
      1.3521166061390153,
      1.8725186957965274,
      2.4371360912108346,
      3.0203168365445863,
      3.3643771969166685,
      3.5219907666743833,
      3.588028833495759,
      3.6466061031219152,
      3.69830773498119,
    ]
  )
  t.end()
})

test('ecs (default)', (t) => {
  t.almostEqual(modelDefault.ecs(), 3.053097345132744)
  t.end()
})

test('growth (default)', (t) => {
  t.arrayAlmostEqual(modelDefault.growth(), [
    100.0,
    148.59473959783548,
    220.80396636148535,
    328.10307883654144,
    487.5439156096396,
    724.4646118252348,
    1076.5163034201773,
    1599.6465977954572,
    2376.990696479794,
    3532.083135698926,
  ])
  t.end()
})

test('discount (default)', (t) => {
  t.arrayAlmostEqual(modelDefault.discount(), [
    0.0,
    0.8195444703372954,
    0.6716531388604381,
    0.5504496159377597,
    0.45111793894107893,
    0.3697112123291189,
    0.30299477968602717,
    0.24831769623275063,
    0.20350739483444705,
    0.16678336010931977,
  ])
  t.end()
})

test('damage (uncontrolled) (default)', (t) => {
  t.arrayAlmostEqual(modelDefault.damage(), [
    0.5175022898250311,
    1.4347344706408394,
    3.6196287378150434,
    8.328292746269222,
    17.777189524316363,
    32.02174347710779,
    52.142304647436056,
    81.21022954559251,
    125.88611715367614,
    194.32774104003025,
  ])
  t.end()
})

test('damage (uncontrolled) (discounting) (default)', (t) => {
  t.arrayAlmostEqual(modelDefault.damage({ discounting: true }), [
    0.0,
    1.1758287018160065,
    2.4311350032629195,
    4.584305543601123,
    8.019609098374536,
    11.838797601813575,
    15.798846108971599,
    20.165937111294397,
    25.618755747768624,
    32.410633613110015,
  ])
  t.end()
})

test('damage (controlled) (default)', (t) => {
  t.arrayAlmostEqual(modelControlled.damage(), [
    0.18590621944192953,
    0.6036972739498833,
    1.7204683264755536,
    4.330692563717323,
    9.883396858033253,
    18.22275448302025,
    29.674576101056132,
    45.76393727413851,
    70.24132205730149,
    107.3555484651727,
  ])
  t.end()
})

test('damage baseline (default)', (t) => {
  t.arrayAlmostEqual(modelControlled.damageBaseline(), [
    0.18590621944192953,
    1.3100712566223116,
    3.4068158193946076,
    7.981577194840826,
    17.230177158437797,
    31.18437511609189,
    50.87710685785302,
    79.30786945028866,
    123.03017624623443,
    190.045908029986,
  ])
  t.end()
})

test('cost (uncontrolled)', (t) => {
  t.arrayAlmostEqual(modelDefault.cost(), [0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  t.end()
})

test('cost (controlled)', (t) => {
  t.arrayAlmostEqual(modelControlled.cost(), [
    0.24091550000000006,
    0.2732268302150044,
    0.3164008245262834,
    0.3757161662648092,
    0.45901670118043436,
    0.5441016214396082,
    0.6821467995732817,
    0.9108374349859105,
    1.2684157203807056,
    1.7997582424215064,
  ])
  t.end()
})

test('cost (controlled) (discounting)', (t) => {
  t.arrayAlmostEqual(modelControlled.cost({ discounting: true }), [
    0.0,
    0.2239215378504939,
    0.2125116069311089,
    0.20681281942207166,
    0.20707066817605063,
    0.20116047009267682,
    0.20668691925023502,
    0.22617705349824913,
    0.25813197882173583,
    0.3001697270555026,
  ])
  t.end()
})

test('benefit (controlled)', (t) => {
  t.arrayAlmostEqual(modelControlled.benefit(), [
    0.0,
    0.7063739826724283,
    1.686347492919054,
    3.6508846311235033,
    7.346780300404545,
    12.96162063307164,
    21.20253075679689,
    33.54393217615015,
    52.788854188932945,
    82.6903595648133,
  ])
  t.end()
})

test('net benefit (controlled)', (t) => {
  t.arrayAlmostEqual(modelControlled.netBenefit(), [
    -0.24091550000000006,
    0.43314715245742397,
    1.3699466683927706,
    3.275168464858694,
    6.88776359922411,
    12.41751901163203,
    20.520383957223608,
    32.63309474116424,
    51.520438468552236,
    80.8906013223918,
  ])
  t.end()
})

test('net benefit (controlled) (discounting)', (t) => {
  t.arrayAlmostEqual(modelControlled.netBenefit({ discounting: true }), [
    0.0,
    0.3549833536388272,
    0.920128979897404,
    1.8028152236129302,
    3.107193718795368,
    4.590896007910361,
    6.217569216191653,
    8.103374907070997,
    10.484790213463496,
    13.491206289811894,
  ])
  t.end()
})

test('net present beneft (controlled)', (t) => {
  t.almostEqual(modelControlled.netPresentBenefit(), 4194.142957717939)
  t.end()
})

test('net present beneft (discounting) (controlled)', (t) => {
  t.almostEqual(
    modelControlled.netPresentBenefit({ discounting: true }),
    981.4591582078585
  )
  t.end()
})

test('net present cost (controlled)', (t) => {
  t.almostEqual(modelControlled.netPresentCost(), 137.41071681975086)
  t.end()
})

test('net present cost (discounting) (controlled)', (t) => {
  t.almostEqual(
    modelControlled.netPresentCost({ discounting: true }),
    40.85285562196249
  )
  t.end()
})

// TODO
test('optimize (scenario 1)', (t) => {
  // only mitigation and removal
  // max slope = 1
  // delay = 0
  const mitigate = [0.1, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0]
  const remove = [
    0.0,
    0.23325056852892845,
    0.25984182298286934,
    0.283166359353035,
    0.299734271077061,
    0.3050648973889498,
    0.29405543459327804,
    0.2618315586018339,
    0.20476995015808586,
    0.12010630879608018,
  ]
  const temperature = [
    1.4862064011145981,
    1.409294914749376,
    1.3116686437588891,
    1.19292348794043,
    1.0541837991033607,
    0.8991273969898784,
    0.7351953048948227,
    0.5746009587994698,
    0.43453061045117886,
    0.3365130068803957,
  ]
  t.end()
})

// TODO
test('optimize (scenario 2)', (t) => {
  // only mitigation and removal and geoeng
  // max slope = 1
  // delay = 0
  const mitigate = [
    0.1,
    0.8686679076280138,
    0.9900616821924062,
    1.0,
    1.0,
    1.0,
    1.0,
    0.0,
    0.0,
    0.0,
  ]
  const remove = [
    0.0,
    0.13307658258315852,
    0.15167364306412573,
    0.17011699569911526,
    0.18679128327926137,
    0.19919894162496385,
    0.20368474540527906,
    0.19508401488675087,
    0.166199808069727,
    0.10668150259805251,
  ]
  const geoeng = [
    0.0,
    0.2022367705395075,
    0.18658383392279568,
    0.170258508396621,
    0.15398883791003007,
    0.13778749044295244,
    0.12187075277448782,
    0.1067678999510518,
    0.09347175917741171,
    0.08363862665030122,
  ]
  const temperature = [
    1.4862064011145981,
    0.5557818792968877,
    0.5503176771811303,
    0.5345305752102375,
    0.5120000819378663,
    0.48320787012732336,
    0.4495357127230821,
    0.4138067089199785,
    0.38103431663391896,
    0.35942390482779196,
  ]
  t.end()
})
