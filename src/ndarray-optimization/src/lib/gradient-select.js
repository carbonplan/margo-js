'use strict'

var derivs = require('./derivatives.js')

module.exports = function getGradient(options) {
  var derivFn
  var delta = 0.01

  if (options.gradient.func) {
    if (typeof options.gradient.func === 'string') {
      switch (options.gradient.func) {
        case 'forwardDifference':
          delta = 0.0001
          if (options.gradient.delta) {
            delta = Math.abs(options.gradient.delta)
          }
          derivFn = function (X, grad) {
            return derivs.forwardDifference(X, delta, options.func, grad)
          }
          break
        case 'backwardDifference':
          delta = 0.0001
          if (options.gradient.delta) {
            delta = Math.abs(options.gradient.delta)
          }
          derivFn = function (X, grad) {
            return derivs.backwardDifference(X, delta, options.func, grad)
          }
          break
        case 'centralDifference':
        default:
          if (options.gradient.delta) {
            delta = Math.abs(options.gradient.delta)
          }
          derivFn = function (X, grad) {
            return derivs.centralDifference(X, delta, options.func, grad)
          }
          break
      }
    } else {
      // TODO: don't just accept this blindly
      derivFn = options.gradient.func
    }
  } else {
    if (options.gradient.delta) {
      delta = Math.abs(options.gradient.delta)
    }
    derivFn = function (X, grad) {
      return derivs.centralDifference(X, delta, options.func, grad)
    }
  }

  return derivFn
}
