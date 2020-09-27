'use strict'

var ndarray = require('ndarray')
var blas1 = require('ndarray-blas-level1')
var outerProduct = require('./outer-product.js')
var gemv = require('./math/gemv.js')

module.exports.hessian = {
  rank1: function (H, y, dx) {
    var n = y.shape[0]

    // TODO: should we clobber the y array instead of copy?
    var t1 = ndarray(new Float64Array(n), [n, 1])
    blas1.copy(y, t1)

    gemv(-1.0, H, dx, 1.0, t1)
    var alpha = 1.0 / blas1.dot(t1, dx)
    outerProduct.addToExisting(alpha, t1, t1, H)
    return true
  },
  rank2DFP: function (H, y, dx) {
    // warning: Tim's own implementation!!!
    var n = y.shape[0]
    var t1 = ndarray(new Float64Array(n), [n, 1])
    gemv(-1.0, H, dx, 0.0, t1)
    var a = -1.0 / blas1.dot(t1, dx)
    outerProduct.addToExisting(t1, t1, a, H)
    var b = 1.0 / blas1.dot(y, dx)
    outerProduct.addToExisting(y, y, b, H)
  },
  rank2BFGS: function (H, y, dx) {
    var n = y.shape[0]
    var t1 = ndarray(new Float64Array(n), [n, 1])
    gemv(1.0, H, dx, 0.0, t1) // t1 = H * x
    var a = 1.0 / blas1.dot(y, dx)
    var b = -1.0 / blas1.dot(dx, t1)
    outerProduct.addToExisting(y, y, a, H)
    outerProduct.addToExisting(t1, t1, b, H)
  },
}

module.exports.hessianInverse = {
  rank1: function (N, y, dx) {
    var n = dx.shape[0]

    // TODO: should we clobber the dx array instead of copy?
    var t1 = ndarray(new Float64Array(n), [n, 1])
    blas1.copy(dx, t1)

    gemv(-1.0, N, y, 1.0, t1)
    var alpha = 1.0 / blas1.dot(t1, y)
    outerProduct.addToExisting(t1, t1, alpha, N)
    return true
  },
  rank2DFP: function (N, y, dx) {
    var n = y.shape[0]
    var t1 = ndarray(new Float64Array(n), [n, 1])
    gemv(1.0, N, y, 0.0, t1)
    var b = -1.0 / blas1.dot(t1, y)
    outerProduct.addToExisting(t1, t1, b, N)
    var a = 1.0 / blas1.dot(dx, y)
    outerProduct.addToExisting(dx, dx, a, N)
  },
  rank2BFGS: function (N, y, dx) {
    var n = y.shape[0]
    var t1 = ndarray(new Float64Array(n), [n, 1])
    gemv(1.0, N, y, 0.0, t1) // t1 = Nk * yk
    var a = blas1.dot(dx, y)
    var b = blas1.dot(y, t1)
    var c = 1.0 / a
    var d = (1 + b / a) * c
    outerProduct.addToExisting(dx, dx, d, N)
    outerProduct.addToExisting(dx, t1, -c, N)
    outerProduct.addToExisting(t1, dx, -c, N)
  },
}
