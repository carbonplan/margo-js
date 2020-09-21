# ndarray-optimization

An optimization library for [ndarrays](https://github.com/scijs/ndarray).

## Available Functions

- Unconstrained Optimization
  - Parabolic Line Search
  - Steepest Descent
  - Quasi-Newton Methods
    - Rank 1 Update
    - Rank 2 DFP Update
    - Rank 2 BFGS Update
- Constrained Optimization
  - Kuhn-Tucker Conditions

## Options structure

Optimization methods have very similar inputs, so the options structure provides a common interface for methods.

```
options = {
  'objective': {
    'start': <ndarray>,
    'func': <function>,
    'gradient': {
      'func': <string> or <function>,
      'delta': <number>
    }
  },
  'update': {
    'hessianInverse': <boolean>,
    'type': <string>
  },
  'constraints': {
    'equality': [
      {
        'func': <function>,
        'gradient': {
          'func': <string> or <function>,
          'delta': <number>
        }
      },
      {
        'func': <function>,
        'gradient': {
          'func': <string> or <function>,
          'delta': <number>
        }
      },
      ...
    ],
    'inequality': [
      {
        'func': <function>,
        'gradient': {
          'func': <string> or <function>,
          'delta': <number>
        }
      },
      {
        'func': <function>,
        'gradient': {
          'func': <string> or <function>,
          'delta': <number>
        }
      },
      ...
    ]
  },
  'solution': {
    'tolerance': <number>,
    'maxIterations': <number/integer>
  }
}
```

### Modules

#### objective

Required for all routines. This defines the objective function that is to be minimized.

- `"start"`: the n-dimensional start position for the optimization routine.
- `"func"`: this is the scalar objective function.
  - Options:
    - `function(X) { ... }`:  a function that takes a n-dimensional vector X as its only argument and returns a scalar.
- `"gradient"`: this is the gradient of the objective function is determined.
  - `"func"`: this takes the current n-dimensional position vector and evaluates the gradient at that position.
    - Options:
      - `function(X, grad) { ... }`: a function that evaluates at `X` and modifies the `grad` argument.
      - `"forwardDifference"`: the string literal that specifies use of the objective function to calculate the derivative numerically using the forward difference method.
      - `"backwardDifference"`: the string literal that specifies use of the objective function to calculate the derivative numerically using the backward difference method.
      - `"centralDifference"`: the string literal that specifies use of the objective function to calculate the derivative numerically using the central difference method.
  - `"delta"`: a number that specifies the numerical step that the numerical derivatives will take. This is only used when numerical derivatives are specified.
- `"solution"`: this defines how a solution is to be determined.
  - `"tolerance"`: the tolerance that must be achieved in order to count as a valid solution. To count as a solution, either the objective function or the gradient norm must be below this tolerance.
  - `maxIterations`: the maximum number of iterations that the optimization routine will run before quitting. The solution given when this is reached is not necessarily valid.

#### update

Used where Hessian and Hessian inverse updates are required.

- `"hessianInverse"`: a boolean that indicates if the inputs are supposed to update the Hessian inverse or just the regular Hessian.
- `"type"`: the type of update to perform on the inputs.
  - Options:
    - `"rank1"`: a rank-1 update.
    - `"rank2-dfp"`: a rank-2 update using the DFP algorithm.
    - `"rank2-bfgs"`: a rank-2 update using the BFGS algorithm. This is the default if the string is mangled.

#### constraints

Used in constrained algorithms, such as sequential quadratic programming.

- `"equality"`: an array of objects that represent equality constraints (i.e. `g(x) = 0`) that must be satisfied. The constraint function is considered satisfied if the scalar function is less than the tolerance specified. 
- `"inequality"`: an array of objects that represent inequality constraints (i.e. `g(x) >= 0`) that must be satisfied. The constraint function is considered satisfied if the scalar function value is greater than zero.

Each constraint is an object with the following properties:
- `"func"`: the function that defines the constraint.
- `"gradient"`: an object that defines the gradient of the constraint (see objective gradient above).

## Notes

- The convention is to define everything as a 2D array, including column vectors. The `ndarray` library requires different arguments for a 1D vector and a 2D matrix with 1 column when it comes to the `.get()` and `.set()` functions. Sometimes, a `NaN` is returned if this isn't done correctly, so 2D matrices are required.

- The rank update algorithms rely on the Hessian matrix being symmetric locally. Although this is often the case, there are cases where it is not. This is usually a problem with differentiability of the objective function. A lack of symmetry may lead to an erroneous result.

## License

&copy; 2016 Tim Bright. MIT License.

## Authors

Tim Bright
