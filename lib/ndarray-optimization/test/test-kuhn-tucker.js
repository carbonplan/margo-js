'use strict';

var chai = require('chai');
var ndarray = require('ndarray');
var kuhnTucker = require('../src/kuhn-tucker.js');

// var TOLERANCE = 1e-11;
// var MAX_ITERATIONS = 5;

describe('Constrained - Kuhn-Tucker Conditions', function () {
  it('1 Constraint - Linear, Equality', function () {
    var F = function (X) {
      var x1 = X.get(0, 0);
      var x2 = X.get(1, 0);
      var f = 2 * x1 * x1 + 4 * x2 * x2;
      return f;
    };

    var G1 = function (X) {
      var x1 = X.get(0, 0);
      var x2 = X.get(1, 0);
      var f = 3 * x1 + 2 * x2 - 12;
      return f;
    };

    var options = {
      objective: {
        func: F,
        gradient: {
          func: 'centralDifference',
          delta: 0.01
        }
      },
      constraints: {
        equality: [ {
          func: G1,
          gradient: {
            func: 'centralDifference',
            delta: 0.01
          }
        }]
      },
      solution: {
        tolerance: 1e-10
      }
    };
    // Test case: Point at unconstrained minimum
    var result = kuhnTucker(options, ndarray(new Float64Array([0, 0]), [2, 1]));
    chai.assert(!result, 'Problem should not meet the Kuhn-Tucker conditions.');

    // Test case: Point at constrained optimum
    result = kuhnTucker(options, ndarray(new Float64Array([3.2727272727, 1.0909090909]), [2, 1]));
    chai.assert(result, 'Problem should meet the Kuhn-Tucker conditions.');

    // Test case: Point on equality constraint, but not optimum
    result = kuhnTucker(options, ndarray(new Float64Array([4, 0]), [2, 1]));
    chai.assert(!result, 'Problem should not meet the Kuhn-Tucker conditions.');
  });
  it('1 Constraint - Linear, Inequality', function () {
    var F = function (X) {
      var x1 = X.get(0, 0);
      var x2 = X.get(1, 0);
      var f = x1 * x1 + x2 * x2;
      return f;
    };

    var G1 = function (X) {
      var x1 = X.get(0, 0);
      var x2 = X.get(1, 0);
      var f = x1 + 4 * x2 - 12;
      return f;
    };

    var options = {
      objective: {
        func: F,
        gradient: {
          func: 'centralDifference',
          delta: 0.01
        }
      },
      constraints: {
        inequality: [ {
          func: G1,
          gradient: {
            func: 'centralDifference',
            delta: 0.01
          }
        }]
      },
      solution: {
        tolerance: 1e-10
      }
    };
    // Test case: point at constrained optimum
    var result = kuhnTucker(options, ndarray(new Float64Array([0.7058823529411764, 2.823529411764706]), [2, 1]));
    chai.assert(result, 'Point should meet the Kuhn-Tucker conditions.');

    // Test case: point on binding constraint, not optimum
    result = kuhnTucker(options, ndarray(new Float64Array([0, 3]), [2, 1]));
    chai.assert(!result, 'Point should not meet the Kuhn-Tucker conditions.');
  });
  it('2 Constraints - Nonlinear, Inequality', function () {
    var F = function (X) {
      var x1 = X.get(0, 0);
      var x2 = X.get(1, 0);
      var f = x1 * x1 + x2;
      return f;
    };

    var G1 = function (X) {
      var x1 = X.get(0, 0);
      var x2 = X.get(1, 0);
      var f = -x1 * x1 - x2 * x2 + 9;
      return f;
    };

    var G2 = function (X) {
      var x1 = X.get(0, 0);
      var x2 = X.get(1, 0);
      var f = -x1 - x2 + 1;
      return f;
    };

    var options = {
      objective: {
        func: F,
        gradient: {
          func: 'centralDifference',
          delta: 0.01
        }
      },
      constraints: {
        inequality: [
          {
            func: G1,
            gradient: {
              func: 'centralDifference',
              delta: 0.01
            }
          },
          {
            func: G2,
            gradient: {
              func: 'centralDifference',
              delta: 0.01
            }
          }
        ]
      },
      solution: {
        tolerance: 1e-10
      }
    };
    // Test case: point binding G1, at optimum
    var result = kuhnTucker(options, ndarray(new Float64Array([0, -3]), [2, 1]));
    chai.assert(result, 'Point should meet the Kuhn-Tucker conditions.');
    result = kuhnTucker(options, ndarray(new Float64Array([1, 0]), [2, 1]));
    chai.assert(!result, 'Point should meet the Kuhn-Tucker conditions.');
  });
});
