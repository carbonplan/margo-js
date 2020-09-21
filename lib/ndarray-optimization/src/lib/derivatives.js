'use strict';

module.exports.forwardDifference = function forwardDifference (x0, dx, f, grad) {
  var fx0 = f(x0);
  var fxh = 0;
  var h = 0;
  var xi = 0;
  var i = 0;
  var len = x0.shape[0];
  var nrm2 = 0;
  var gradVal = 0;

  if (x0.length !== grad.length) {
    throw new Error('Gradient and point arrays not same length.');
  }

  if (Array.isArray(dx)) {
    for (i = 0; i < len; i++) {
      xi = x0.get(i, 0);
      h = dx.get(i, 0);
      x0.set(i, 0, xi + h);
      fxh = f(x0);
      gradVal = (fxh - fx0) / h;
      grad.set(i, 0, gradVal);
      nrm2 += gradVal * gradVal;
      x0.set(i, 0, xi);
    }
  } else if (typeof dx === 'number') {
    for (i = 0; i < len; i++) {
      xi = x0.get(i, 0);
      x0.set(i, 0, xi + dx);
      fxh = f(x0);
      gradVal = (fxh - fx0) / dx;
      grad.set(i, 0, gradVal);
      nrm2 += gradVal * gradVal;
      x0.set(i, 0, xi);
    }
  } else {
    throw new Error('Invalid dx.');
  }

  if (isNaN(nrm2)) {
    throw new Error('2-norm of gradient is NaN.');
  }
  return Math.sqrt(nrm2);
};

module.exports.backwardDifference = function backwardDifference (x0, dx, f, grad) {
  var fx0 = f(x0);
  var fxh = 0;
  var h = 0;
  var xi = 0;
  var i = 0;
  var len = x0.shape[0];
  var nrm2 = 0;
  var gradVal = 0;

  if (x0.shape[0] !== grad.shape[0]) {
    throw new Error('Gradient and point arrays not same length.');
  }

  if (Array.isArray(dx)) {
    for (i = 0; i < len; i++) {
      xi = x0.get(i, 0);
      h = dx.get(i, 0);
      x0.set(i, 0, xi - h);
      fxh = f(x0);
      gradVal = (fxh - fx0) / h;
      grad.set(i, 0, gradVal);
      nrm2 += gradVal * gradVal;
      x0.set(i, 0, xi);
    }
  } else if (typeof dx === 'number') {
    for (i = 0; i < len; i++) {
      xi = x0.get(i, 0);
      x0.set(i, 0, xi - dx);
      fxh = f(x0);
      gradVal = (fxh - fx0) / dx;
      grad.set(i, 0, gradVal);
      nrm2 += gradVal * gradVal;
      x0.set(i, 0, xi);
    }
  } else {
    throw new Error('Invalid dx.');
  }

  if (isNaN(nrm2)) {
    throw new Error('2-norm of gradient is NaN.');
  }
  return Math.sqrt(nrm2);
};

module.exports.centralDifference = function centralDifference (x0, dx, f, grad) {
  var fx0 = 0;
  var fxh = 0;
  var h = 0;
  var xi = 0;
  var i = 0;
  var len = x0.shape[0];
  var nrm2 = 0;
  var gradVal = 0;

  if (x0.shape[0] !== grad.shape[0]) {
    throw new Error('Gradient and point arrays not same length.');
  }

  if (Array.isArray(dx)) {
    for (i = 0; i < len; i++) {
      xi = x0.get(i, 0);

      h = dx.get(i, 0);
      x0.set(i, 0, xi - h);
      fx0 = f(x0);
      x0.set(i, 0, xi);
      fxh = f(x0);
      gradVal = (fxh - fx0) / (2 * h);
      grad.set(i, 0, gradVal);
      nrm2 += gradVal * gradVal;
      x0[i] = xi;
    }
  } else if (typeof dx === 'number') {
    for (i = 0; i < len; i++) {
      xi = x0.get(i, 0);

      h = dx;
      x0.set(i, 0, xi - h);
      fx0 = f(x0);
      x0.set(i, 0, xi + h);
      fxh = f(x0);
      gradVal = (fxh - fx0) / (2 * h);
      grad.set(i, 0, gradVal);
      nrm2 += gradVal * gradVal;
      x0.set(i, 0, xi);
    }
  } else {
    throw new Error('Invalid dx.');
  }

  if (isNaN(nrm2)) {
    throw new Error('2-norm of gradient is NaN.');
  }
  return Math.sqrt(nrm2);
};
