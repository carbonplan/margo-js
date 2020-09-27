'use strict'

var ndarray = require('ndarray')

module.exports.replaceExisting = function outerProduct(a, b, alpha, N) {
  var m = a.shape[0]
  var n = b.shape[0]
  var A = N || ndarray(new Float64Array(m * n), [m, n])
  var i = 0
  var j = 0
  for (i = 0; i < m; ++i) {
    for (j = 0; j < n; ++j) {
      A.set(i, j, alpha * a.get(i, 0) * b.get(j, 0))
    }
  }
  return A
}

module.exports.addToExisting = function outerProduct(a, b, alpha, N) {
  var m = a.shape[0]
  var n = b.shape[0]
  var A = N || ndarray(new Float64Array(m * n), [m, n])
  var i = 0
  var j = 0
  for (i = 0; i < m; ++i) {
    for (j = 0; j < n; ++j) {
      A.set(i, j, alpha * a.get(i, 0) * b.get(j, 0) + N.get(i, j))
    }
  }
  return A
}
