'use strict';

var rankUpdates = require('./rank-updates.js');

module.exports = function getUpdate (options) {
  var updateFn;
  if (!options.update) {
    throw new Error('No update variables defined.');
  }
  if (!options.update.hasOwnProperty('hessianInverse')) {
    throw new Error('No option specified for Hessian or Hessian Inverse.');
  }
  var hessianInverse = options.update.hessianInverse;
  if (!options.update.type) {
    throw new Error('No update type specified.');
  }
  var updateType = options.update.type;

  if (hessianInverse) {
    if (typeof updateType === 'string') {
      switch (updateType) {
        case 'rank1':
          updateFn = rankUpdates.hessianInverse.rank1;
          break;
        case 'rank2-dfp':
          updateFn = rankUpdates.hessianInverse.rank2DFP;
          break;
        case 'rank2-bfgs':
        default:
          updateFn = rankUpdates.hessianInverse.rank2BFGS;
          break;
      }
    } else if (typeof updateType === 'function') {
      // TODO: don't accept just anything blindly
      updateFn = updateType;
    } else {
      throw new Error('Update type is invalid.');
    }
  } else {
    if (typeof updateType === 'string') {
      switch (updateType) {
        case 'rank1':
          updateFn = rankUpdates.hessian.rank1;
          break;
        case 'rank2-dfp':
          updateFn = rankUpdates.hessian.rank2DFP;
          break;
        case 'rank2-bfgs':
        default:
          updateFn = rankUpdates.hessian.rank2BFGS;
          break;
      }
    } else if (typeof updateType === 'function') {
      // TODO: don't accept just anything blindly
      updateFn = updateType;
    } else {
      throw new Error('Update type is invalid.');
    }
  }

  return updateFn;
};
