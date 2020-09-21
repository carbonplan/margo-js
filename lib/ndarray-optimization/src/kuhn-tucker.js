'use strict';

var ndarray = require('ndarray');
var qr = require('ndarray-givens-qr');
var gradientSelect = require('./lib/gradient-select.js');
var defaults = require('./global-defaults.js');

var printWarnings = false;
/*
 *  Checks if the Kuhn-Tucker conditions hold.
 *
 *  @param{Object} options - contains the information for the algorithm
 *  @param{ndarray} X - the point to evaluate the Kuhn-Tucker conditions
 */
module.exports = function kuhnTucker (options, X, tolerance) {
  // Check if objective is properly defined
  if (!options.hasOwnProperty('objective')) {
    throw new Error('Objective not defined.');
  }
  if (X === undefined) {
    throw new Error('Evaluation point not defined.');
  }

  // Check if constraints have been defined
  var validEquality = false;
  var validInequality = false;
  var equalityConstraints;
  var inequalityConstraints;
  if (options.hasOwnProperty('constraints') &&
    options.constraints.hasOwnProperty('equality') &&
    Array.isArray(options.constraints.equality)) {
    validEquality = true;
    equalityConstraints = options.constraints.equality;
  } else if (printWarnings) {
    console.warn('Equality constraints not in an array. Skipping equality constraints.');
  }
  if (options.hasOwnProperty('constraints') &&
    options.constraints.hasOwnProperty('inequality') &&
    Array.isArray(options.constraints.inequality)) {
    validInequality = true;
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

  // Check for binding constraints
  var n = X.shape[0];
  var m = (validEquality ? equalityConstraints.length : 0) + (validInequality ? inequalityConstraints.length : 0);
  var r = 0;
  var ri = 0;
  var i = 0;
  var j = 0;
  var k = 0;
  var N = ndarray(new Float64Array(n * m), [n, m]);
  var gradGX = ndarray(new Float64Array(n), [n, 1]);
  var getGradG;
  var G;
  var tmp = 0;
  var len;
  var funcObject;

  if (validInequality) {
    // Determine active inequality constraints
    len = inequalityConstraints.length;
    for (k = 0; k < len; ++k) {
      funcObject = inequalityConstraints[k];
      if (funcObject.hasOwnProperty('func') && funcObject.hasOwnProperty('gradient')) {
        G = funcObject.func;
        var Gx = G(X);
        // check if the constraint is feasible
        // -- KT CONDITION --
        if (Gx > -TOL) {
          // check if constraint is active, i.e. equal to zero
          if (Math.abs(Gx) < TOL) {
            // count it if constraint is active
            getGradG = gradientSelect(funcObject);
            getGradG(X, gradGX);
            for (i = 0; i < n; ++i) {
              N.set(i, r, gradGX.get(i, 0));
            }
            r++;
            ri++;
          }
        } else {
          // infeasible constraint
          return false;
        }
      }
    }
  }
  if (validEquality) {
    // All equality constraints are active.
    len = equalityConstraints.length;
    for (k = 0; k < len; ++k) {
      funcObject = equalityConstraints[k];
      if (funcObject.hasOwnProperty('func') && funcObject.hasOwnProperty('gradient')) {
        G = funcObject.func;
        // check if equality constraint is feasible
        // -- KT CONDITION --
        if (Math.abs(G(X)) < TOL) {
          getGradG = gradientSelect(funcObject);
          getGradG(X, gradGX);
          for (i = 0; i < n; ++i) {
            N.set(i, r, gradGX.get(i, 0));
          }
          r++;
        } else {
          // infeasible constraint
          return false;
        }
      }
    }
  }

  // Determine if the objective function gradient is zero
  var getObjectiveDeriv = gradientSelect(options.objective);
  // var F = options.objective.func;
  var gradFX = ndarray(new Float64Array(n), [n, 1]);
  getObjectiveDeriv(X, gradFX);

  // if there are actually constraints, there will be r of them
  var lambda = ndarray(new Float64Array(r), [r, 1]);
  if (r > 0) {
    N.hi(n - 1, r - 1);
    // gradF - N*lambda = 0, N is n x r
    // i = 0, ..., ri are inequality
    // i = r1 + 1, ..., r are equality
    // Perform QR decomposition so that N = QR
    // Q is n x n, R is n x r
    var qrResults = qr.decompose(N);
    var Qt = qrResults.q.transpose(1, 0); // technically n x n
    var R = qrResults.r; // technically n x r

    // Q^T * N = | Q_1^T * N | = | R |
    //           | Q_2^T * N |   | 0 |
    Qt.hi(r - 1, n - 1); // Qt.shape[0] = r; // now it's r x n
    R.hi(r - 1, r - 1); // R.shape[0] = r; // now it's also r x r

    // now solve the equation R * lambda = Q_1^T * gradF to get a least-squares solution for lambda
    // construct Q_1^T * gradF
    var q = ndarray(new Float64Array(r), [r, 1]);
    tmp = 0;
    for (i = 0; i < r; ++i) {
      tmp = 0;
      for (j = 0; j < n; ++j) {
        tmp += Qt.get(i, j) * gradFX.get(j, 0);
      }
      q.set(i, 0, tmp);
    }
    // backsubstitute into R to get lambdas
    for (i = r - 1; i >= 0; --i) {
      tmp = q.get(i, 0);
      for (j = i + 1; j < r; ++j) {
        tmp -= R.get(i, j) * lambda.get(j, 0);
      }
      if (Math.abs(R.get(i, i)) < TOL) {
        throw new Error('Divide by zero in backsubstitution. Check QR factorization of constraint Jacobian matrix.');
      }
      lambda.set(i, 0, tmp / R.get(i, i));
    }

    // -- KT CONDITION --
    // check the inequality lambdas if they're positive (for complementary slackness)
    // equality lambdas can be anything
    for (i = 0; i < ri; ++i) {
      if (lambda.data[i] < -TOL) {
        return false;
      }
    }

    // alter gradF to become the residual vector norm, i.e. gradF - N * lambda
    for (i = 0; i < n; ++i) {
      tmp = gradFX.get(i, 0);
      for (j = 0; j < r; ++j) {
        tmp -= N.get(i, j) * lambda.get(j, 0);
      }
      gradFX.set(i, 0, tmp);
    }
  }

  // -- KT CONDITION --
  // gradF (and modified gradF) should be somewhat near zero
  for (i = 0; i < r; i++) {
    tmp = gradFX.get(i, 0);
    if (Math.abs(tmp) > TOL) {
      return false;
    }
  }

  // if all checks pass, then it satisfies the K-T conditions
  return true;
};
