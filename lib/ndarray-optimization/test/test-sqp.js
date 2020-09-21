'use strict';

var chai = require('chai');
var ndarray = require('ndarray');
var sqp = require('../src/seq-quad-programming.js');

describe('Constrained - Sequential Quadratic Programming', function () {
  it('1 Constraint - Inequality', function () {
    var F = function (X) {
      var x1 = X.get(0, 0);
      var x2 = X.get(1, 0);
      var f = x1 * x1 * x1 * x1 - 2 * x2 * x1 * x1 + x2 * x2 + x1 * x1 - 2 * x1 + 5;
      return f;
    };

    var G1 = function (X) {
      var x1 = X.get(0, 0);
      var x2 = X.get(1, 0);
      var f = -((x1 + 0.25) * (x1 + 0.25)) + 0.75 * x2;
      return f;
    };

    var options = {
      objective: {
        start: ndarray(new Float64Array([-1, 4]), [2, 1]),
        func: F,
        gradient: {
          func: 'centralDifference',
          delta: 0.01
        }
      },
      constraints: {
        equality: [
          {
            func: G1,
            gradient: {
              func: 'centralDifference',
              delta: 0.01
            }
          }
        ]
      },
      solution: {
        tolerance: 1e-10,
        maxIterations: 200
      }
    };
    var result = sqp(options);
    chai.assert(result, 'Not yet fully implemented.');
  });
});
