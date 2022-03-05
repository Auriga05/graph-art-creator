import { Coordinate } from './mathLib';
import * as mlMatrix from 'ml-matrix'

export function getConicFit(points: Coordinate[]) {
  const _x = points.map(point => point.x)
  const _y = points.map(point => point.y)

  const x = new mlMatrix.Matrix([_x]).transpose();
  const y = new mlMatrix.Matrix([_y]).transpose();

  const dMatrix = new mlMatrix.Matrix([
    x.mul(x).getColumn(0),
    y.mul(y).getColumn(0),
    _x,
    _y,
    Array.from(Array(y.rows)).map(_ => 1)
  ]);
  const D_2 = dMatrix.mmul(dMatrix.transpose())
  const eigen = new mlMatrix.EigenvalueDecomposition(D_2)
  const minEigenvalue = Math.min(...eigen.realEigenvalues)
  const minEigenvalueIndex = eigen.realEigenvalues.findIndex(x => x == minEigenvalue)
  let [A, C, D, E, F] = eigen.eigenvectorMatrix.getColumn(minEigenvalueIndex);
  const r = Math.sqrt(A ** 2 + C ** 2)
  A = A / r
  C = C / r
  D = D / r
  E = E / r
  F = F / r
  return {
    A,
    B: 0,
    C,
    D,
    E,
    F,
  }
}

// const {A, C, D, E, F} = (getConicFit([
//   {x: -3, y: 3},
//   {x: -3, y: 4},
//   {x: -2, y: 6},
//   {x: -3, y: 7},
//   {x: -6, y: 9},
//   {x: -7, y: 8},
//   {x: -9, y: 7},
//   {x: -10, y: 4},
//   {x: -9, y: 2},
//   {x: -7, y: 1},
// ]))