'use strict'

var blas1 = require('ndarray-blas-level1')
var ndarray = require('ndarray')

module.exports.parabolicApprox = function parabolicLineSearch(X0, s, F, X) {
  var n = X0.shape[0]
  var x = ndarray(new Float64Array(n), [n, 1])
  blas1.copy(X0, x)
  var alphas = new Float64Array([0, 0, 0])
  var fs = new Float64Array([0, 0, 0])

  fs[0] = F(x)
  alphas[0] = 0
  var alpha = 0.01
  blas1.copy(X0, x)
  blas1.axpy(alpha, s, x)
  fs[1] = F(x)
  alphas[1] = alpha
  alpha *= 2
  blas1.copy(X0, x)
  blas1.axpy(alpha, s, x)
  fs[2] = F(x)
  alphas[2] = alpha

  var j = 2
  while (fs[(j - 1) % 3] - fs[j % 3] > 0) {
    j++
    alpha *= 2
    blas1.copy(X0, x)
    blas1.axpy(alpha, s, x)
    fs[j % 3] = F(x)
    alphas[j % 3] = alpha
  }
  var da = (alphas[j % 3] - alphas[(j - 1) % 3]) / 2
  var aLast = alpha - da
  blas1.copy(X0, x)
  blas1.axpy(aLast, s, x)
  var fLast = F(x)

  var a2
  var f1
  var f2
  var f3
  if (fs[(j - 1) % 3] < fLast) {
    // a1 = alphas[(j - 2) % 3];
    a2 = alphas[(j - 1) % 3]
    // a3 = aLast;
    f1 = fs[(j - 2) % 3]
    f2 = fs[(j - 1) % 3]
    f3 = fLast
  } else {
    // a1 = alphas[(j - 1) % 3];
    a2 = aLast
    // a3 = alphas[j % 3];
    f1 = fs[(j - 1) % 3]
    f2 = fLast
    f3 = fs[j % 3]
  }

  // points now bracket the minimum
  // approximate with parabola and find the minimum
  var aMin = a2 + (da * (f1 - f3)) / (2 * (f1 - 2 * f2 + f3))
  blas1.copy(X0, X)
  blas1.axpy(aMin, s, X)
  return true
}

// module.exports.cubicApprox = function cubicLineSearch (X0, s, F, X) {
// };
