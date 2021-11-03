import { baseExpressionFormat } from "./constants";
import { Graph } from "./Graph";
import { MyCalc } from "./index.user";
import nerdamer from "./nerdamer/index.js"
import { Circle } from './graphs/Circle'
import { Ellipse } from './graphs/Ellipse';
import { HorizontalHyperbola } from './graphs/HorizontalHyperbola';
import { HorizontalParabola } from './graphs/HorizontalParabola';
import { LineSegment } from './graphs/LineSegment';
import { VerticalHyperbola } from './graphs/VerticalHyperbola';
import { VerticalParabola } from './graphs/VerticalParabola';
 
export const GraphTypes = [
  Circle,
  HorizontalParabola,
  VerticalParabola,
  Ellipse,
  HorizontalHyperbola,
  VerticalHyperbola,
  LineSegment
]

export type EvaluatexType = (equation: string, variables ? : {
  [key: string]: number
}) =>
() => number | undefined

export const functionRegex = /([a-z]+_{[\w\d]+})(?:\(([^,\n=<>]+(?:,.+)*)\))/g;
export const functionVariableRegex = /([a-z]+_{[\w\d]+})(?:\(([^,\n=<>]+(?:,.+)*)\))?/g;

declare const evaluatex: EvaluatexType

export function getVariable(name: string): number {
  const match = name.match(/(\w_{\d+\w*})/g);
  if (match && match[0].length === name.length) {
    if (name in MyCalc.globalVariablesObject) {
      return parseFloat(MyCalc.globalVariablesObject[name]);
    }
  } else {
    const match = [...name.matchAll(functionRegex)]
    if (match.length > 0) {
      const parts = match[0];
      const args = parts[2].split(',')
      const value = evaluateFunction(parts[1], args.map((arg) => getVariable(arg)));
      return value
    } else {
      const value = evaluatex(substitute(name))()
      if (value) {
        return value
      }
    }
  }
  throw Error(`The variable ${name} is missing`)
}

export interface Expression {
  [key: string]: any;
  fillOpacity ?: string
  color: string
  hidden: boolean
  id: string
  latex: string
  type: string
}

export function substituteParenthesis(_latex: string) {
  let latex = _latex;
  const variablesNeeded = getVariablesNeeded(latex);
  for (let j = 0; j < variablesNeeded.length; j++) {
    const variableNeeded = variablesNeeded[j][0];
    latex = latex.replace(variableNeeded, `(${simplify(getVariable(variableNeeded), 4)})`);
  }
  return latex;
}

function evaluateFunction(_func: string, values: number[]) {
  const funcObject = MyCalc.globalFunctionsObject[_func]
  if (!funcObject) {
    throw Error(`Cannot find function with name ${_func}`);
  }
  const args = funcObject.args
  if (args.length !== values.length) {
    throw Error(`Variable length (${args.length}) and value length (${values.length}) mismatch`);
  } else {
    const variablesNeeded = getVariablesNeeded(funcObject.definition)
      .map((variable) => variable[0])
      .filter((variable) => !args.includes(variable))

    const variableObject: {[key: string]: number} = {}
    args.forEach((value, index) => 
      variableObject[value] = values[index]
    )
    variablesNeeded.forEach((value) => 
      variableObject[value.replace(/([a-z])(?:_{(\d+[a-z]*)})/g, '$1_$2')] = getVariable(value)
    )
    let newDefinition = funcObject.definition
    variablesNeeded.forEach((value) => {
      newDefinition = newDefinition.replace(value, value.replace(/([a-z])(?:_{(\d+[a-z]*)})/g, '$1_$2'))
    })
    newDefinition = newDefinition.replaceAll('}\\sqrt{', '}\\cdot\\sqrt{');
    const value = evaluatex(newDefinition, variableObject)()
    if (value !== undefined) {
      return value
    }
  }
  throw Error('function broken lul')
}

export class LinkedVariable {
  reference: string | null

  clean: boolean

  alwaysClean: boolean

  _value: number

  constructor(reference: number | string | null, _value ?: number) {
    if (typeof reference === 'number') {
      this.reference = null;
      this._value = reference;
      this.clean = true
      this.alwaysClean = true
    } else {
      this.clean = true
      this.alwaysClean = false
      this.reference = reference;
      if (_value === undefined) {
        if (reference != null) {
          this._value = getVariable(reference);
        } else {
          throw new Error('Null reference and undefined value');
        }
      } else {
        this._value = _value;
      }
    }
    if (MyCalc) {
      MyCalc.addLinkedVariable(this)
    }
  }

  get value() {
    if (!this.clean) {
      if (this.reference) {
        try {
          return getVariable(this.reference)
        } catch {
          return this._value
        }
      }
    }
    return this._value;
  }

  set value(_value: number) {
    if (!this.alwaysClean) {
      this.clean = true
    }
    if (this.reference) {
      MyCalc.globalVariablesObject[this.reference] = _value.toString();
    }
    this._value = _value;
  }
}

export interface MinMax {
  min: LinkedVariable
  max: LinkedVariable
}

export interface Bounds {
  xMin: LinkedVariable
  xMax: LinkedVariable
  yMin: LinkedVariable
  yMax: LinkedVariable
}

export interface NumberBounds {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}


export interface Evaluations {
  xa: MinMax
  xb: MinMax
  ya: MinMax
  yb: MinMax
}

export function getGraphType(expression: Expression) {
  const graphId = parseInt(expression.id.split('_')[0], 10);
  let type = null;
  for (let i = 0; i < baseExpressionFormat.length; i++) {
    const currExpressionFormat = baseExpressionFormat[i];
    const newExpression = currExpressionFormat.replaceAll('_{1', `_{${graphId}`);
    if (expression.latex.includes(newExpression)) {
      type = i;
      break;
    }
  }
  if (type === null) {
    throw new Error('Cannot find conic type');
  } else {
    return type;
  }
}
export function hasXDomain(cropType: number) {
  return cropType <= 1;
}

export function hasYDomain(cropType: number) {
  return !(cropType % 2);
}

export function getDomains(currId: number) {
  return {
    xMin: MyCalc.linkedVariable(`x_{${currId}ca}`),
    yMin: MyCalc.linkedVariable(`y_{${currId}ca}`),
    xMax: MyCalc.linkedVariable(`x_{${currId}cb}`),
    yMax: MyCalc.linkedVariable(`y_{${currId}cb}`),
  };
}

export function parseDomains(domains: string[]) {
  let [xMin, yMin, xMax, yMax] = [-Infinity, -Infinity, Infinity, Infinity];
  for (let i = 0; i < domains.length; i++) {
    const latex = domains[i];
    const split = latex.split('<');
    let variable = '';
    if (split.includes('x')) {
      variable = 'x';
    } else if (split.includes('y')) {
      variable = 'y';
    }
    if (variable !== '') {
      if (['x', 'y'].includes(split[0])) { // x < 2
        if (variable === 'x') {
          xMax = parseFloat(split[1]);
        } else if (variable === 'y') {
          yMax = parseFloat(split[1]);
        }
      } else if (['x', 'y'].includes(split[1]) && split.length === 2) { // 2 < x
        if (variable === 'x') {
          xMin = parseFloat(split[0]);
        } else if (variable === 'y') {
          yMin = parseFloat(split[0]);
        }
      } else if (['x', 'y'].includes(split[1]) && split.length === 3) { // 2 < x < 3
        if (variable === 'x') {
          xMin = parseFloat(split[0]);
          xMax = parseFloat(split[2]);
        } else if (variable === 'y') {
          yMin = parseFloat(split[0]);
          yMax = parseFloat(split[2]);
        }
      }
    }
  }
  return { xMin, xMax, yMin, yMax };
}

export function maxLinkedVariable(linkedVariables: LinkedVariable[]) {
  let maxVariable = MyCalc.linkedVariable(null, -Infinity);
  linkedVariables.forEach((variable) => {
    maxVariable = variable.value > maxVariable.value ? variable : maxVariable;
  });
  return maxVariable;
}

export function minLinkedVariable(linkedVariables: LinkedVariable[]) {
  let minVariable = MyCalc.linkedVariable(null, Infinity);
  linkedVariables.forEach((variable) => {
    minVariable = variable.value < minVariable.value ? variable : minVariable;
  });
  return minVariable;
}

export function minMax(variables: LinkedVariable[]) {
  return {
    min: minLinkedVariable(variables),
    max: maxLinkedVariable(variables),
  };
}

export interface LatexExpression {
  latex: string
  types: string[]
  name?: string
}

export function simplify(_number: number, decimalPlaces: number) {
  return parseFloat(_number.toFixed(decimalPlaces))
    .toString();
}

export function getVariablesNeeded(latex: string) {
  return [...latex.matchAll(functionVariableRegex)]
}

export function substitute(_latex: string) {
  let latex = _latex;
  const variablesNeeded = getVariablesNeeded(latex);
  for (let j = 0; j < variablesNeeded.length; j++) {
    const variableNeeded = variablesNeeded[j][0];
    latex = latex.replace(variableNeeded, simplify(getVariable(variableNeeded), 4));
  }
  return latex
}

export function generateBounds(
  _xMin: LinkedVariable,
  _yMin: LinkedVariable,
  _xMax: LinkedVariable,
  _yMax: LinkedVariable,
) {
  const xMin = _xMin;
  xMin.value = parseFloat(xMin.value.toFixed(4));

  const yMin = _yMin;
  yMin.value = parseFloat(yMin.value.toFixed(4));

  const xMax = _xMax;
  xMax.value = parseFloat(xMax.value.toFixed(4));

  const yMax = _yMax;
  yMax.value = parseFloat(yMax.value.toFixed(4));

  const xBounds = { value: '', reference: '' };
  const yBounds = { value: '', reference: '' };
  if (xMin.value === -Infinity) {
    if (xMax.value !== Infinity) {
      xBounds.value = `\\left\\{x<${xMax.value}\\right\\}`;
      xBounds.reference = `\\left\\{x<${xMax.reference}\\right\\}`;
    }
  } else if (xMax.value === Infinity) {
    xBounds.value = `\\left\\{${xMin.value}<x\\right\\}`;
    xBounds.reference = `\\left\\{${xMin.reference}<x\\right\\}`;
  } else {
    xBounds.value = `\\left\\{${xMin.value}<x<${xMax.value}\\right\\}`;
    xBounds.reference = `\\left\\{${xMin.reference}<x<${xMax.reference}\\right\\}`;
  }

  if (yMin.value === -Infinity) {
    if (yMax.value !== Infinity) {
      yBounds.value = `\\left\\{y<${yMax.value}\\right\\}`;
      yBounds.reference = `\\left\\{y<${yMax.reference}\\right\\}`;
    }
  } else if (yMax.value === Infinity) {
    yBounds.value = `\\left\\{${yMin.value}<y\\right\\}`;
    yBounds.reference = `\\left\\{${yMin.reference}<y\\right\\}`;
  } else {
    yBounds.value = `\\left\\{${yMin.value}<y<${yMax.value}\\right\\}`;
    yBounds.reference = `\\left\\{${yMin.reference}<y<${yMax.reference}\\right\\}`;
  }
  return { value: `${xBounds.value}${yBounds.value}`, reference: `${xBounds.reference}${yBounds.reference}` };
}

export function usesVariable(latex: string, _id: number) {
  const variablesNeeded = getVariablesNeeded(latex);
  return variablesNeeded.some((variable) => {
    if (variable) {
      const newVariable = [...variable[0].matchAll(/[a-z]_{(\d+)[a-z]*}/g)][0]
      if (newVariable) {
        return newVariable[1] === _id.toString()
      }
    }
  });
}

export function substituteFromId(_latex: string, expressionId: number) {
  let latex = _latex;
  const variablesNeeded = getVariablesNeeded(latex);
  for (let j = 0; j < variablesNeeded.length; j++) {
    const variableNeeded = variablesNeeded[j][0];
    if (usesVariable(variableNeeded, expressionId)) {
      const variableValue = simplify(getVariable(variableNeeded), 4);
      latex = latex.replace(variableNeeded, `(${variableValue})`);
    }
  }
  return latex;
}

export function setVariable(variable: string, _value: string | number) {
  let value = _value;
  if (typeof value === 'number') {
    value = value.toString();
  }
  if (value == undefined) {
    throw Error('undefined bruh what')
  }
  MyCalc.globalVariablesObject[variable] = value;
}

export interface LinkedCoordinate {
  x: LinkedVariable
  y: LinkedVariable
}

class Matrix {
  mtx: number[][]
  height: number
  width: number
  constructor (ary: number[][]) {
    this.mtx = ary
    this.height = ary.length;
    this.width = ary[0].length;
  }

  toReducedRowEchelonForm() {
    let lead = 0;
    for (let r = 0; r < this.height; r++) {
        if (this.width <= lead) {
            return;
        }
        let i = r;
        while (this.mtx[i][lead] == 0) {
            i++;
            if (this.height == i) {
                i = r;
                lead++;
                if (this.width == lead) {
                    return;
                }
            }
        }

        const tmp = this.mtx[i];
        this.mtx[i] = this.mtx[r];
        this.mtx[r] = tmp;

        let val = this.mtx[r][lead];
        for (let j = 0; j < this.width; j++) {
            this.mtx[r][j] /= val;
        }

        for (let i = 0; i < this.height; i++) {
            if (i == r) continue;
            val = this.mtx[i][lead];
            for (let j = 0; j < this.width; j++) {
                this.mtx[i][j] -= val * this.mtx[r][j];
            }
        }
        lead++;
    }
    return this;
  }
}

export function intersectConics(aGraph: Graph, bGraph: Graph) {
  let {A: A_1, C: C_1, D: D_1, E: E_1, F: F_1} = aGraph.getGeneralForm()
  let {A: A_2, C: C_2, D: D_2, E: E_2, F: F_2} = bGraph.getGeneralForm()
  A_1 = A_1
  C_1 = C_1
  D_1 = D_1 / 2
  E_1 = E_1 / 2
  F_1 = F_1
  A_2 = A_2
  C_2 = C_2
  D_2 = D_2 / 2
  E_2 = E_2 / 2
  F_2 = F_2
  const _variables = { A_1, C_1, D_1, E_1, F_1, A_2, C_2, D_2, E_2, F_2 }
  const variables: {[key: string]: string} = {}
  Object.entries(_variables).map((value) => {
    variables[value[0]] = value[1].toString()
  })
  const a = -A_2*E_2**2-C_2*D_2**2+A_2*C_2*F_2
  const b = -2*A_2*E_1*E_2-2*C_2*D_1*D_2-A_1*E_2**2-C_1*D_2**2+A_1*C_2*F_2+A_2*C_1*F_2+A_2*C_2*F_1
  const c = 0-2*A_1*E_1*E_2-2*C_1*D_1*D_2-A_2*E_1**2-C_2*D_1**2+A_1*C_1*F_2+A_1*C_2*F_1+A_2*C_1*F_1
  const d = -A_1*E_1**2-C_1*D_1**2+A_1*C_1*F_1
  const var2 = {
    a0: a.toString(),
    a1: b.toString(),
    a2: c.toString(),
    a3: d.toString(),
  }

  console.log(var2)
  const startTime = performance.now()

  const p = (3*a*c - b**2)/(3*a**2)
  const q = (2*b**3 - 9*a*b*c + 27*a**2*d)/(27*a**3)

  let det = q**2/4 + p**3/27

  if (det < 0) {
    console.log('bruh', det)
  }
  det = 0
  const t = Math.cbrt(-q/2 + Math.sqrt(det)) + Math.cbrt(-q/2 - Math.sqrt(det)) - b/(3*a)
  
  const A = A_1 + t * A_2
  const C = D_1 + t * D_2
  const E = C_1 + t * C_2
  const F = E_1 + t * E_2
  const I = F_1 + t * F_2

  const matrix = new Matrix([
    [A, 0, C],
    [0, E, F],
    [C, F, I]
  ])
  console.log(t)
  console.log(matrix)
  console.log(matrix.toReducedRowEchelonForm())

  console.log(nerdamer('(-A_2*E_2^2-C_2*D_2^2+A_2*C_2*F_2)*t^3+(-2*A_2*E_1*E_2-2*C_2*D_1*D_2-A_1*E_2^2-C_1*D_2^2+A_1*C_2*F_2+A_2*C_1*F_2+A_2*C_2*F_1)*t^2+(0-2*A_1*E_1*E_2-2*C_1*D_1*D_2-A_2*E_1^2-C_2*D_1^2+A_1*C_1*F_2+A_1*C_2*F_1+A_2*C_1*F_1)*t+(-A_1*E_1^2-C_1*D_1^2+A_1*C_1*F_1) = 0', variables).solveFor('t').toString())
  console.log(performance.now() - startTime)
}

export function createGraphObject(expression: Expression) {
  const graphType = getGraphType(expression);
  const Class = GraphTypes[graphType];
  if (Class) {
    return new Class(expression);
  }
  throw Error('Tried to convert non-conic to a conic');
}