// 'use strict';

// // var chai = require('chai');
// var ndarray = require('ndarray');
// var ops = require('ndarray-ops');

// describe('Steepest Descent', function () {
//   var Adata = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
//   var Bdata = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18];
//   var A;
//   var B;

//   beforeEach(function () {
//     A = ndarray(new Float64Array(Adata), [10]);
//     B = ndarray(new Float64Array(Bdata), [10]);
//   });

//   it('Subtract -- A = (A - B)', function () {
//     ops.sub(A, B, A);
//     console.log('A = ');
//     console.log(A.data);
//     console.log('B = ');
//     console.log(B.data);
//   });

//   it('Subtract -- B = (A - B)', function () {
//     ops.sub(A, B, B);
//     console.log('A = ');
//     console.log(A);
//     console.log('B = ');
//     console.log(B);
//   });

//   it('Subtract -- (A -= B)', function () {
//     ops.subeq(A, B);
//     console.log('A = ');
//     console.log(A);
//     console.log('B = ');
//     console.log(B);
//   });
// });
