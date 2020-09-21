'use strict';

var chai = require('chai');
var ndarray = require('ndarray');
var quasiNewton = require('../src/quasi-newton.js');

var F = function (X) {
  var x1 = X.get(0, 0);
  var x2 = X.get(1, 0);
  var f = x1 * x1 - 2 * x1 * x2 + 4 * x2 * x2;
  return f;
};

var dF = function (X, grad) {
  var x1 = X.get(0, 0);
  var x2 = X.get(1, 0);
  var g1 = 2 * x1 - 2 * x2;
  var g2 = -2 * x1 + 8 * x2;
  grad.set(0, 0, g1);
  grad.set(1, 0, g2);
  return Math.sqrt(g1 * g1 + g2 * g2);
};

var TOLERANCE = 1e-11;
var MAX_ITERATIONS = 5;

describe('Unconstrained -- Quasi-Newton Methods', function () {
  it('Two Step -- Rank 1, Analytical', function () {
    var x0 = ndarray(new Float64Array([-3, 1]), [2, 1]);
    var options = {
      objective: {
        start: x0,
        func: F,
        gradient: {
          func: dF,
          delta: 0
        }
      },
      update: {
        hessianInverse: true,
        type: 'rank1'
      },
      solution: {
        tolerance: TOLERANCE,
        maxIterations: MAX_ITERATIONS
      }
    };
    var results = quasiNewton(options);
    chai.assert(results.solutionValid, 'Solution is not optimal');
    chai.assert.isBelow(results.objective, TOLERANCE, 'Result is not within tolerance');
    chai.assert(results.iterations === 2, 'Should take only 2 iterations to reach optimum');
  });
  it('Two Step -- Rank 1, Numerical', function () {
    var x0 = ndarray(new Float64Array([-3, 1]), [2, 1]);
    var options = {
      objective: {
        start: x0,
        func: F,
        gradient: {
          func: 'centralDifference',
          delta: 0.01
        }
      },
      update: {
        hessianInverse: true,
        type: 'rank1'
      },
      solution: {
        tolerance: TOLERANCE,
        maxIterations: MAX_ITERATIONS
      }
    };
    var results = quasiNewton(options);
    chai.assert(results.solutionValid, 'Solution is not optimal');
    chai.assert.isBelow(results.objective, TOLERANCE, 'Result is not within tolerance');
    chai.assert(results.iterations === 2, 'Should take only 2 iterations to reach optimum');
  });
  it('Two Step -- Rank 2 DFP, Analytical', function () {
    var x0 = ndarray(new Float64Array([-3, 1]), [2, 1]);
    var options = {
      objective: {
        start: x0,
        func: F,
        gradient: {
          func: dF,
          delta: 0
        }
      },
      update: {
        hessianInverse: true,
        type: 'rank2-dfp'
      },
      solution: {
        tolerance: TOLERANCE,
        maxIterations: MAX_ITERATIONS
      }
    };
    var results = quasiNewton(options);
    chai.assert(results.solutionValid, 'Solution is not optimal');
    chai.assert.isBelow(results.objective, TOLERANCE, 'Result is not within tolerance');
    chai.assert(results.iterations === 2, 'Should take only 2 iterations to reach optimum');
  });

  it('Two Step -- Rank 2 DFP, Numerical', function () {
    var x0 = ndarray(new Float64Array([-3, 1]), [2, 1]);
    var options = {
      objective: {
        start: x0,
        func: F,
        gradient: {
          func: 'centralDifference',
          delta: 0.01
        }
      },
      update: {
        hessianInverse: true,
        type: 'rank2-dfp'
      },
      solution: {
        tolerance: TOLERANCE,
        maxIterations: MAX_ITERATIONS
      }
    };
    var results = quasiNewton(options);
    chai.assert(results.solutionValid, 'Solution is not optimal');
    chai.assert.isBelow(results.objective, TOLERANCE, 'Result is not within tolerance');
    chai.assert(results.iterations === 2, 'Should take only 2 iterations to reach optimum');
  });

  it('Two Step -- Rank 2 BFGS, Analytical', function () {
    var x0 = ndarray(new Float64Array([-3, 1]), [2, 1]);
    var options = {
      objective: {
        start: x0,
        func: F,
        gradient: {
          func: dF,
          delta: 0
        }
      },
      update: {
        hessianInverse: true,
        type: 'rank2-bfgs'
      },
      solution: {
        tolerance: TOLERANCE,
        maxIterations: MAX_ITERATIONS
      }
    };
    var results = quasiNewton(options);
    chai.assert(results.solutionValid, 'Solution is not optimal');
    chai.assert.isBelow(results.objective, TOLERANCE, 'Result is not within tolerance');
    chai.assert(results.iterations === 2, 'Should take only 2 iterations to reach optimum');
  });

  it('Two Step -- Rank 2 BFGS, Numerical', function () {
    var x0 = ndarray(new Float64Array([-3, 1]), [2, 1]);
    var options = {
      objective: {
        start: x0,
        func: F,
        gradient: {
          func: 'centralDifference',
          delta: 0.01
        }
      },
      update: {
        hessianInverse: true,
        type: 'rank2-bfgs'
      },
      solution: {
        tolerance: TOLERANCE,
        maxIterations: MAX_ITERATIONS
      }
    };
    var results = quasiNewton(options);
    chai.assert(results.solutionValid, 'Solution is not optimal');
    chai.assert.isBelow(results.objective, TOLERANCE, 'Result is not within tolerance');
    chai.assert(results.iterations === 2, 'Should take only 2 iterations to reach optimum');
  });
});
