'use strict';

var ndarray = require('ndarray');
var lineSearch = require('./line-search.js');
var blas1 = require('ndarray-blas-level1');
var gradientSelect = require('./lib/gradient-select.js');
var defaults = require('./global-defaults.js');

/*
 *  An implementation of a steepest descent optimization algorithm.
 *  @param{Object} options - contains the information for the algorithm.
 */
module.exports = function steepestDescent (options) {
  if (!options.objective) {
    throw new Error('Undefined optimization objective.');
  }
  if (!options.objective.start) {
    throw new Error('Undefined start position.');
  }
  if (!options.objective.func) {
    throw new Error('Undefined objective function.');
  }
  var maxIterations = defaults.MAX_ITERATIONS;
  var tolerance = defaults.tolerance;
  if (options.solution) {
    if (options.solution.maxIterations &&
      !isNaN(options.solution.maxIterations)) {
      maxIterations = options.solution.maxIterations;
    } else {
      console.warn('Maximum iterations capped at default of ' + maxIterations + '.');
    }
    if (options.solution.tolerance &&
      !isNaN(options.solution.tolerance)) {
      tolerance = options.solution.tolerance;
    } else {
      console.warn('Numerical tolerance is default of ' + tolerance + '.');
    }
  }

  var X = options.objective.start;
  var n = X.shape[0];
  var F = options.objective.func;
  var f0 = F(X);
  var grad = ndarray(new Float64Array(n), [n, 1]);
  var evaluateDerivative = gradientSelect(options.objective);

  var gradNorm = evaluateDerivative(X, grad);
  var f = Number.POSITIVE_INFINITY;
  var iter = 0;
  while (Math.abs(f0 - f) > tolerance && Math.abs(gradNorm) > tolerance && iter <= maxIterations) {
    blas1.scal(-1.0 / gradNorm, grad);
    lineSearch.parabolicApprox(X, grad, F, X);
    f0 = f;
    f = F(X);
    gradNorm = evaluateDerivative(X, grad);
    iter++;
  }

  var solutionValid = (Math.abs(f0 - f) > tolerance) || (Math.abs(gradNorm) > tolerance);
  var results = {
    'solutionValid': solutionValid,
    'iterations': iter,
    'objective': f,
    'gradNorm': gradNorm
  };
  return results;
};
