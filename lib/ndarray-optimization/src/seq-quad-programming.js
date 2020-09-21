'use strict';

var ndarray = require('ndarray');
var blas1 = require('ndarray-blas-level1');
var defaults = require('./global-defaults.js');
var quasiNewton = require('./quasi-newton.js');

var printWarnings = true;

module.exports = function seqQuadProgramming (options) {
  // property checks
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

  // var validEquality = false;
  // var validInequality = false;
  var equalityConstraints;
  var inequalityConstraints;

  if (options.hasOwnProperty('constraints') &&
    options.constraints.hasOwnProperty('equality') &&
    Array.isArray(options.constraints.equality)) {
    // validEquality = true;
    equalityConstraints = options.constraints.equality;
  } else if (printWarnings) {
    console.warn('Equality constraints not in an array. Skipping equality constraints.');
  }
  if (options.hasOwnProperty('constraints') &&
    options.constraints.hasOwnProperty('inequality') &&
    Array.isArray(options.constraints.inequality)) {
    // validInequality = true;
    inequalityConstraints = options.constraints.inequality;
  } else if (printWarnings) {
    console.warn('Inequality constraints not in an array. Skipping inequality constraints.');
  }
  var TOL = defaults.TOLERANCE;
  if (tolerance !== undefined && tolerance > 0) {
    TOL = tolerance;
  } else if (tolerance === undefined &&
    options.solution &&
    options.solution.tolerance &&
    !isNaN(options.solution.tolerance)) {
    TOL = options.solution.tolerance;
  } else if (printWarnings) {
    console.warn('No tolerance specified. Using default tolerance of ' + TOL + '.');
  }

  // SQP Algorithm
  // -------------
  // 1. Make a QP approximation, set Lagrangian Hessian to identity
  // 2. Solve for the optimum of the unconstrained problem
  // 3. Execute a line search, compute penalty function, then take steps that minimize the penalty.
  // 4. Compute dx based on step to penalty function minimization.
  // 5. Evaluate the Lagrangian at the new point, then do a BFGS update to Lagrangian Hessian.
  // 6. Go to Step 1 until dx is small.

  var X = options.objective.start;
  var k = inequalityConstraints.length;
  var m = k + equalityConstraints.length;
  var i = 0;
  var j = 0;
  var n = X.shape[0];
  var H = ndarray(new Float64Array(n * n), [n, n]);
  for (i = 0; i < n; ++i) {
    for (j = 0; j < n; ++j) {
      if (i === j) {
        H.set(i, j, 1.0);
      } else {
        H.set(i, j, 0.0);
      }
    }
  }

  // Set up options for unconstrained solution
  var X0 = ndarray(new Float64Array(n), [n, 1]);
  var unconstrainedOptions = {
    objective: {
      start: X0,
      func: options.objective.func,
      gradient: {
        func: options.objective.gradient.func
      }
    },
    update: {
      hessianInverse: true,
      type: 'rank2-bfgs'
    },
    solution: {
      tolerance: TOL
    }
  };
  if (options.objective.gradient.func.delta) {
    unconstrainedOptions.objective.gradient.delta = options.objective.gradient.func.delta;
  }

  // Start the SQP iteration loop
  blas1.copy(X, X0);
  var dX = ndarray(new Float64Array(n), [n, 1]);
  var dXNorm = 2 * TOL;
  var results;
  while (dXNorm > TOL) {
    // Solve for the unconstrained optimum
    results = quasiNewton(options);
    if (!results.solutionValid) {
      throw new Error('Unconstrained solution cannot be found. SQP cannot progress.');
    }

    // Find all the constraints that are violated and "add them in" to find the constrained optimum
    dXNorm = blas1.nrm2(dX);
  }

  // default return false to signal incomplete implementation
  return false;
};
