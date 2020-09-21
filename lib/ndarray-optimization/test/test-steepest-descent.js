'use strict';

var chai = require('chai');
var ndarray = require('ndarray');
var steepestDescent = require('../src/steepest-descent.js');

var F = function (X) {
  var x1 = X.get(0, 0);
  var x2 = X.get(1, 0);
  // var f = x1 * x1 + x2 * x2;
  var f = x1 * x1 - 2 * x1 * x2 + 4 * x2 * x2;
  // console.log('F(' + x1 + ',' + x2 + ') = ' + f);
  return f;
};

var parabola = function (X) {
  var x1 = X.get(0, 0);
  var x2 = X.get(1, 0);
  var f = x1 * x1 + x2 * x2;
  return f;
};

describe('Unconstrained -- Steepest Descent', function () {
  it('Numerical Derivatives', function () {
    var x0 = ndarray(new Float64Array([-3, 1]), [2, 1]);
    var options = {
      'objective': {
        'start': x0,
        'func': F,
        'gradient': {
          'func': 'centralDifference',
          'delta': 0.01
        }
      },
      'solution': {
        'tolerance': 1e-4,
        'maxIterations': 200
      }
    };
    var results = steepestDescent(options);
    // console.log(results);
    chai.assert(results.solutionValid, 'Solution is not optimal');
    chai.assert.isBelow(results.objective, 1e-4, 'Result is not within tolerance');
  });

  it('Analytical Derivatives', function () {
    var x0 = ndarray(new Float64Array([-3, 1]), [2, 1]);
    var options = {
      'objective': {
        'start': x0,
        'func': F,
        'gradient': {
          'func': function (X, grad) {
            var x1 = X.get(0, 0);
            var x2 = X.get(1, 0);
            var g1 = 2 * x1 - 2 * x2;
            var g2 = -2 * x1 + 8 * x2;
            grad.set(0, 0, g1);
            grad.set(1, 0, g2);
            return Math.sqrt(g1 * g1 + g2 * g2);
          },
          'delta': 0
        }
      },
      'solution': {
        'tolerance': 1e-4,
        'maxIterations': 200
      }
    };
    var results = steepestDescent(options);
    // console.log(results);
    chai.assert(results.solutionValid, 'Solution is not optimal');
    chai.assert.isBelow(results.objective, 1e-4, 'Result is not within tolerance');
  });

  it('One Step Descent -- Numerical', function () {
    var x0 = ndarray(new Float64Array([-3, 1]), [2, 1]);
    var options = {
      'objective': {
        'start': x0,
        'func': parabola,
        'gradient': {
          'func': 'centralDifference',
          'delta': 0.01
        }
      },
      'solution': {
        'tolerance': 1e-10,
        'maxIterations': 200
      }
    };
    var results = steepestDescent(options);
    // console.log(results);
    chai.assert(results.solutionValid, 'Solution is not optimal');
    chai.assert.isBelow(results.objective, 1e-10, 'Result is not within tolerance');
    chai.assert(results.iterations === 1, 'Should take only 1 iteration to reach optimum');
  });

  it('One Step Descent -- Analytical', function () {
    var x0 = ndarray(new Float64Array([-3, 1]), [2, 1]);
    var options = {
      'objective': {
        'start': x0,
        'func': parabola,
        'gradient': {
          'func': function (X, grad) {
            var x1 = X.get(0, 0);
            var x2 = X.get(1, 0);
            var g1 = 2 * x1;
            var g2 = 2 * x2;
            grad.set(0, 0, g1);
            grad.set(1, 0, g2);
            return Math.sqrt(g1 * g1 + g2 * g2);
          },
          'delta': 0,
          'array': null
        }
      },
      'solution': {
        'tolerance': 1e-10,
        'maxIterations': 200
      }
    };
    var results = steepestDescent(options);
    // console.log(results);
    chai.assert(results.solutionValid, 'Solution is not optimal');
    chai.assert.isBelow(results.objective, 1e-10, 'Result is not within tolerance');
    chai.assert(results.iterations === 1, 'Should take only 1 iteration to reach optimum');
  });
});
