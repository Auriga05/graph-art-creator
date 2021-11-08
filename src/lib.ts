import { Coordinate } from './mathLib';
import { Graph } from "./classes/Graph";
import { createGraphWithBounds, MyCalc } from "./index.user";
import { Circle } from './graphs/Circle'
import { Ellipse } from './graphs/Ellipse';
import { HorizontalHyperbola } from './graphs/HorizontalHyperbola';
import { HorizontalParabola } from './graphs/HorizontalParabola';
import { LineSegment } from './graphs/LineSegment';
import { VerticalHyperbola } from './graphs/VerticalHyperbola';
import { VerticalParabola } from './graphs/VerticalParabola';
import { Conic } from "./classes/Conic";
import { bezierMinMax, evaluateBezier, getCriticalPoints } from "./bezierLib";
import { Bezier } from "./graphs/Bezier";
import { Command, CommandMadeAbsolute, makeAbsolute, parseSVG } from "svg-path-parser";
import { svgArcToCenterParam } from "./svgLib";
import { BaseExpression, EditableIdParts, Expression, FinalIdParts, GraphingOptions, IdParts, InputBaseExpression, InvalidIdParts, MinBaseExpression, ShadeIdParts, TableExpression } from "./types";
import { getConicFit } from './conicLib';
import { getGraphTypeFromStandard } from './actions/convertFromStandard';
 
export const GraphTypes = [
  Circle,
  HorizontalParabola,
  VerticalParabola,
  Ellipse,
  HorizontalHyperbola,
  VerticalHyperbola,
  LineSegment,
  Bezier,
]

export const baseExpressionFormat: string[] = GraphTypes.map(graphClass => graphClass.expressionFormat[0].latex);
export type EvaluatexType = (equation: string, variables ? : {
  [key: string]: number
}) =>
() => number | undefined

export const functionRegex = /([a-zA-Z]+_{[\w\d]+})(?:\(([^,\n=<>]+(?:,.+)*)\))/g;
export const functionVariableRegex = /([a-zA-Z]+_{[\w\d]+})(?:\(([^,\n=<>]+(?:,.+)*)\))?/g;

declare const evaluatex: EvaluatexType

export function getVariable(name: string): number {
  const match = name.match(/(\w_{\d+\w*})/g);
  if (match && match[0].length === name.length) {
    if (name in MyCalc.globalVariablesObject) {
      return parseFloat(MyCalc.globalVariablesObject[name]);
    } else if (name in MyCalc.linkedVariables) {
      return MyCalc.linkedVariables[name].value
    }
  } else {
    const match = [...name.matchAll(functionRegex)]
    if (match.length > 0) {
      const parts = match[0];
      const args = parts[2].split(',')
      const value = evaluateFunction(parts[1], args.map((arg) => getVariable(arg)));
      return value
    } else {
      const substituted = substitute(name)
      const value = evaluatex(substituted)()
      if (value) {
        return value
      }
    }
  }
  throw Error(`The variable ${name} is missing`)
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
      variableObject[value.replace(/([a-zA-Z])(?:_{(\d+[a-zA-Z]*)})/g, '$1_$2')] = getVariable(value)
    )
    let newDefinition = funcObject.definition
    variablesNeeded.forEach((value) => {
      newDefinition = newDefinition.replace(value, value.replace(/([a-zA-Z])(?:_{(\d+[a-zA-Z]*)})/g, '$1_$2'))
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

export function isNumeric(str: string) {
  return !isNaN(parseFloat(str))
}

export function getIdParts(id: string) {
  let isFinal = false
  let isShade = false
  let isEditable = false
  let isInvalid = false
  const split = id.split('_')
  if (id.split('_')) {
    if (split.length === 2) {
      if (split[0] === 'final') {
        isFinal = true
        const graphId = parseInt(split[1], 10)
        return {
          id,
          isFinal,
          isShade,
          isEditable,
          isInvalid,
          graphId
        } as FinalIdParts
      } else if (split[0] === 'shade') {
        isShade = true
        return {
          id,
          isFinal,
          isShade,
          isEditable,
          isInvalid,
        } as ShadeIdParts
      } else if (isNumeric(split[0])) {
        isEditable = true
        const graphId = parseInt(split[0], 10)
        const editIndex = parseInt(split[1], 10)
        return {
          id,
          isFinal,
          isShade,
          isEditable,
          isInvalid,
          graphId,
          editIndex,
        } as EditableIdParts
      }
    }
  }
  isInvalid = true
  return {
    isFinal,
    isShade,
    isEditable,
    isInvalid,
  } as InvalidIdParts
}

export function getGraphType(expression: MinBaseExpression) {
  const id = getIdParts(expression.id)
  if (id.isFinal) {
    return getGraphTypeFromStandard(expression.latex)
  } else if (id.isEditable) {
    let type = null;
    for (let i = 0; i < baseExpressionFormat.length; i++) {
      const currExpressionFormat = baseExpressionFormat[i];
      const newExpression = currExpressionFormat.replaceAll('_{1', `_{${id.graphId}`);
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
  throw Error(`Expression with id ${expression.id} is not a graph expression`)
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
  let maxVariable = MyCalc.linkedVariable(-Infinity);
  linkedVariables.forEach((variable) => {
    maxVariable = variable.value > maxVariable.value ? variable : maxVariable;
  });
  return maxVariable;
}

export function minLinkedVariable(linkedVariables: LinkedVariable[]) {
  let minVariable = MyCalc.linkedVariable(Infinity);
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
  xMin.value = parseFloat(xMin.value.toFixed(MyCalc.precision));

  const yMin = _yMin;
  yMin.value = parseFloat(yMin.value.toFixed(MyCalc.precision));

  const xMax = _xMax;
  xMax.value = parseFloat(xMax.value.toFixed(MyCalc.precision));

  const yMax = _yMax;
  yMax.value = parseFloat(yMax.value.toFixed(MyCalc.precision));

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
      const newVariable = [...variable[0].matchAll(/[a-zA-Z]_{(\d+)[a-zA-Z]*}/g)][0]
      if (newVariable) {
        return newVariable[1] === _id.toString()
      }
    }
  });
}

export function substituteFromId(_latex: string, graphId: number) {
  let latex = _latex;
  const variablesNeeded = getVariablesNeeded(latex);
  for (let j = 0; j < variablesNeeded.length; j++) {
    const variableNeeded = variablesNeeded[j][0];
    if (usesVariable(variableNeeded, graphId)) {
      const variableValue = simplify(getVariable(variableNeeded), 4);
      latex = latex.replace(variableNeeded, `(${variableValue})`);
    }
  }
  return latex;
}

export function setVariable(variable: string, _value: string | number | LinkedVariable) {
  let value = _value;
  if (value instanceof LinkedVariable) {
    value = value.value.toString()
  } else if (typeof value === 'number') {
    value = value.toString();
  } else if (value == undefined) {
    throw Error('undefined bruh what')
  }
  MyCalc.globalVariablesObject[variable] = value;
}

export function toId(expression: string, _id: string | number) {
  return expression.replace(/_\{\d+([a-zA-Z]*)}/g, `_{${_id}$1}`);
}

export function intersect(array1: string[], array2: string[]) {
  return array1.filter((value) => array2.includes(value));
}

export function doesIntersect(array1: string[], array2: string[]) {
  const filteredArray = intersect(array1, array2);
  return (filteredArray.length > 0);
}

export function typeFilter<T extends MinBaseExpression>(expressionList: T[], graphType: number, types: string[]) {
  const ceTypes = GraphTypes[graphType].expressionFormat;
  return expressionList.filter((x) => doesIntersect(
    ceTypes[parseInt(x.id.split('_')[1], 10)].types, types,
  ));
}

export function isBaseExpression(argument: Expression): argument is BaseExpression {
  return argument.type === "expression"
}

export function isFinal(argument: IdParts): argument is FinalIdParts {
  return argument.isFinal
}

export function createGraphObject(expression: InputBaseExpression) {
  const id = getIdParts(expression.id)
  const graphType = getGraphType(expression);
  if (id.isEditable || id.isFinal) {
    const Class = GraphTypes[graphType];
    if (Class) {
      return new Class(expression);
    }
    throw Error('Tried to convert non-conic to a conic');
  }
  throw Error('Tried to convert a graph object from a non-curve object')
}

export function createConic(graphType: number, id: number, options?: GraphingOptions) {
  const expression = GraphTypes[graphType].expressionFormat;
  const expressionsToSet = [];
  const willHide = ['x_expression', 'y_expression', 'hidden']
  if (options) {
    if (options.hideHandles) {
      willHide.push('handle')
    }
    if (options.hidePoints) {
      willHide.push('point')
    }
  }
  for (let i = 0; i < expression.length; i++) {
    const newExpression = expression[i];
    let newExpressionLatex = newExpression.latex;
    if (i === 0) {
      if (GraphTypes[graphType].hasCrop) {
        newExpressionLatex += '\\left\\{x_{1ca}<x<x_{1cb}\\right\\}\\left\\{y_{1ca}<y<y_{1cb}\\right\\}';
      }
    }
    newExpressionLatex = newExpressionLatex.replace(/_\{\d+([a-zA-Z]*)}/g, `_{${id}$1}`);
    if (doesIntersect(newExpression.types, ['var'])) {
      const [variable] = newExpressionLatex.split('=');
      const value = MyCalc.globalVariablesObject[toId(variable, id)];
      newExpressionLatex = `${variable}=${simplify(parseFloat(value), 4)}`;
    }
    const hidden = doesIntersect(
      expression[i].types,
      willHide,
    );

    if (hidden) {
      const split = newExpressionLatex.split('=');
      const matches = [...split[0].matchAll(functionRegex)]
      if (matches.length > 0) {
        const [full, name, args] = matches[0];
        MyCalc.globalFunctionsObject[name] = {
          id: `${id.toString()}_${i}`,
          args: args.split(','),
          definition: split[1],
        }
      }
    }
    const label = i === 0 ? JSON.stringify({
      graphType
    }) : ""
    const expressionToAdd: InputBaseExpression = {
      id: `${id.toString()}_${i}`,
      latex: newExpressionLatex,
      color: 'BLACK',
      hidden,
      type: 'expression',
      label
    }
    expressionsToSet.push(expressionToAdd);
  }
  MyCalc.newGraph(id, expressionsToSet);
}

// createLineSegment(p1, p2, startId, {finalize: true})
export function createLineSegment(p1: Coordinate, p2: Coordinate, id: number, options?: GraphingOptions) {
  if (options?.finalize) {
    const xMin = Math.min(p1.x, p2.x)
    const yMin = Math.min(p1.y, p2.y)
    const xMax = Math.max(p1.x, p2.x)
    const yMax = Math.max(p1.y, p2.y)
    const bounds = generateBounds(
      MyCalc.linkedVariable(parseFloat(xMin.toFixed(MyCalc.precision))),
      MyCalc.linkedVariable(-Infinity),
      MyCalc.linkedVariable(parseFloat(xMax.toFixed(MyCalc.precision))),
      MyCalc.linkedVariable(Infinity),
    ).value
    const m = parseFloat(((p1.y - p2.y) / (p1.x - p2.x)).toFixed(MyCalc.precision))
    const b = parseFloat((p1.y - m * p1.x).toFixed(MyCalc.precision))
    const newExpression: InputBaseExpression = {
      color: "BLACK",
      hidden: false,
      id: `final_${id}`,
      latex: `y=${m}x${b >= 0 ? '+' : ''}${b}${bounds}`,
      type: 'expression',
      label: JSON.stringify({
        graphType: 6 
      })
    }
    MyCalc.setExpression(newExpression)
  }
  MyCalc.globalId += 1
}

export function createBezier(
  p1: Coordinate,
  p2: Coordinate,
  p3: Coordinate,
  p4: Coordinate,
  id: number,
  options?: GraphingOptions,
){
  Bezier.setGraphVariables({
    xa: p1.x,
    ya: p1.y,
    xb: p2.x,
    yb: p2.y,
    xc: p3.x,
    yc: p3.y,
    xd: p4.x,
    yd: p4.y
  }, id)
  if (options?.finalize) {
    let criticalPoints = []
    criticalPoints = getCriticalPoints(p1, p2, p3, p4)
    if (criticalPoints.length === 1) {
      const criticalPoint = criticalPoints[0]
      // criticalPoints = [criticalPoint / 2, criticalPoint, (1 + criticalPoint) / 2]
    }
    for (let i = 0; i < criticalPoints.length + 1; i++) {
      const arr = [0, ...criticalPoints, 1]
      const tValues = [
        (4 * arr[i] + 0 * arr[i + 1]) / 4,
        (3 * arr[i] + 1 * arr[i + 1]) / 4,
        (2 * arr[i] + 2 * arr[i + 1]) / 4,
        (1 * arr[i] + 3 * arr[i + 1]) / 4,
        (0 * arr[i] + 4 * arr[i + 1]) / 4,
      ]
      const _tPoints = tValues.map((t) => evaluateBezier(p1, p2, p3, p4, t))
      const tPoints = {
        x: tValues.map((t, index) => _tPoints[index].x),
        y: tValues.map((t, index) => _tPoints[index].y),
      }
      const minMax = {
        xMin: Math.min(...tPoints.x),
        yMin: Math.min(...tPoints.y),
        xMax: Math.max(...tPoints.x),
        yMax: Math.max(...tPoints.y),
      }
      const variables = getConicFit(_tPoints)
      const {A, B, C, D, E, F} = variables
      let graphType = 0
      if (A > 0) {
        if (C > 0) {
          if (A === C) { // Circle
            graphType = 0
          } else { // Ellipse
            graphType = 3
          }
        } else if (C === 0) { // Vertical Parabola
          graphType = 2
        } else if (C < 0) { // Hyperbola
          const delta = A * (C * D ** 2 + A * E ** 2 - 4 * A * C * F)
          if (delta < 0) {
            graphType = 4
          } else {
            graphType = 5
          }
        }
      } else if ( A === 0 ) {
        if (C > 0) {  // Horizontal Parabola
          graphType = 1
        } else if (C === 0) {  // Line
          graphType = 6
        } else if (C < 0) {  // Horizontal Parabola
          graphType = 1            
        }                  
      } else if ( A < 0 ) {
        if (C > 0) {  // Hyperbola
          const delta = A * (C * D ** 2 + A * E ** 2 - 4 * A * C * F)
          if (delta < 0) {
            graphType = 4
          } else {
            graphType = 5
          }
        } else if (C === 0) {  // Vertical Parabola
          graphType = 2
        } else if (C < 0) {
          if (A === C) { // Circle
            graphType = 0
          } else { // Ellipse
          }
          graphType = 3
        }
      }
      const Class = GraphTypes[graphType]
      const newVar = Class.fromGeneral(variables)
      if (newVar) {
        Class.setGraphVariables(newVar as any, MyCalc.globalId)
        if (Object.values(newVar).every((x) => !Number.isNaN(x) && Number.isFinite(x))) {
          if ((minMax.yMax - minMax.yMin < MyCalc.minRes) && (minMax.xMax - minMax.xMin < MyCalc.minRes)) {
            console.log('bounds smaller than minres')
          } else {
            if (graphType === 4 || graphType === 5) {
              if ((newVar as any).a < MyCalc.minRes ** 2 && (newVar as any).b < MyCalc.minRes ** 2) {
                console.log('hypersmall')
              } else {
                createGraphWithBounds(MyCalc.globalId, graphType, newVar, minMax, 
                  {hideAll: true, logical: true, finalize: true})
                MyCalc.globalId += 1
              }
            } else {
              createGraphWithBounds(MyCalc.globalId, graphType, newVar, minMax, 
                {hideAll: true, logical: true, finalize: true})
              MyCalc.globalId += 1
            }
          }
        }
      }
    }
  } else {
    createConic(7, id, options)
  }
}

export function getDomainsFromLatex(latex: string) {
  return [
    ...latex.matchAll(/\\left\\{((?:[-+]?\d+\.?\d*<)?[xy](?:<[-+]?\d+\.?\d*)?)\\right\\}/g),
  ].map((domain) => domain[1]);
}

export function transformVariables(graphType: number, variables: number[]) {
  return GraphTypes[graphType].transformVariables(variables)
}

function dist(a: Coordinate, b: Coordinate) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}
export function hax(_paths: {
  command: CommandMadeAbsolute,
  details: {
    dx: number,
    dy: number,
    color: string,
    isStart: boolean,
  }
}) {
  let startId = MyCalc.globalId;
  const paths = _paths
  const stroke = paths.command
  const {dx, dy, color} = paths.details
  let startPos;
  if (startId !== 1) {
    // finalize(`${startId - 1}_0`, startId - 1)
  }
  if (stroke.command === 'moveto') {
    if (paths.details.isStart) {
      startPos = {
        x: stroke.x,
        y: -stroke.y,
      }
    }
  } else if (stroke.command === 'horizontal lineto' || stroke.command === 'vertical lineto' || stroke.command === 'lineto') {
    const p1 = {x: stroke.x0 + dx, y: -stroke.y0 - dy}
    const p2 = {x: stroke.x + dx, y: -stroke.y - dy}
    if (dist(p1, p2) > MyCalc.minRes) {
      const defArray = [
        Math.floor(p1.x / MyCalc.minRes),
        Math.floor(p1.y / MyCalc.minRes),
        Math.floor(p2.x / MyCalc.minRes),
        Math.floor(p2.y / MyCalc.minRes)
      ].sort().toString()
      if (!MyCalc.doneLines.has(defArray)) {
        MyCalc.doneLines.add(defArray)
        createLineSegment(p1, p2, startId, {finalize: true})
      } else {
        console.log('skip')
      }
    }
    MyCalc.lastControlPoint.cubic = { x: 0, y: 0 }
    MyCalc.lastControlPoint.quadratic = { x: 0, y: 0 }
  } else if (stroke.command === 'curveto') {
    const p0 = {x: stroke.x0 + dx, y: -stroke.y0 - dy}
    const p1 = {x: stroke.x1 + dx, y: -stroke.y1 - dy}
    const p2 = {x: stroke.x2 + dx, y: -stroke.y2 - dy}
    MyCalc.lastControlPoint.cubic = p2
    MyCalc.lastControlPoint.quadratic = { x: 0, y: 0 }
    const p3 = {x: stroke.x + dx, y: -stroke.y - dy}
    const minMax = bezierMinMax(p0, p1, p2, p3)
    if ((minMax.max.y - minMax.min.y < MyCalc.minRes) && (minMax.max.x - minMax.min.x < MyCalc.minRes)) {
    } else {
      const defArray = [
        Math.floor(p0.x / MyCalc.minRes),
        Math.floor(p1.x / MyCalc.minRes),
        Math.floor(p1.x / MyCalc.minRes),
        Math.floor(p1.y / MyCalc.minRes),
        Math.floor(p2.x / MyCalc.minRes),
        Math.floor(p2.y / MyCalc.minRes),
        Math.floor(p3.x / MyCalc.minRes),
        Math.floor(p3.y / MyCalc.minRes),
      ].sort().toString()
      if (!MyCalc.doneLines.has(defArray)) {
        MyCalc.doneLines.add(defArray)
        createBezier(p0, p1, p2, p3, startId, {hideHandles: true, hidePoints: true, finalize: true})
      } else {
        console.log('skip')
      }
    }
  } else if (stroke.command === 'smooth curveto') {
    const p0 = {x: stroke.x0 + dx, y: -stroke.y0 - dy}
    const p1 = {
      x: 2 * stroke.x0 - MyCalc.lastControlPoint.cubic.x + 2 * dx,
      y: 2 * -stroke.y0 - MyCalc.lastControlPoint.cubic.y - 2 * dy,
    }
    const p2 = {x: stroke.x2 + dx, y: -stroke.y2 - dy}
    MyCalc.lastControlPoint.cubic = p2
    MyCalc.lastControlPoint.quadratic = { x: 0, y: 0 }
    const p3 = {x: stroke.x + dx, y: -stroke.y - dy}
    const minMax = bezierMinMax(p0, p1, p2, p3)
    if ((minMax.max.y - minMax.min.y < MyCalc.minRes) && (minMax.max.x - minMax.min.x < MyCalc.minRes)) {
    } else {
      const defArray = [
        Math.floor(p0.x / MyCalc.minRes),
        Math.floor(p1.x / MyCalc.minRes),
        Math.floor(p1.x / MyCalc.minRes),
        Math.floor(p1.y / MyCalc.minRes),
        Math.floor(p2.x / MyCalc.minRes),
        Math.floor(p2.y / MyCalc.minRes),
        Math.floor(p3.x / MyCalc.minRes),
        Math.floor(p3.y / MyCalc.minRes),
      ].sort().toString()
      if (!MyCalc.doneLines.has(defArray)) {
        MyCalc.doneLines.add(defArray)
        createBezier(p0, p1, p2, p3, startId, {hideHandles: true, hidePoints: true, finalize: true})
      } else {
        console.log('skip')
      }
    }
  } else if (stroke.command === 'elliptical arc') {
    const r = stroke.rx
    const centerParam = svgArcToCenterParam(stroke.x0, stroke.y0, r, r, 0, stroke.largeArc, stroke.sweep, stroke.x, stroke.y)
    centerParam.cx = centerParam.cx + dx
    centerParam.cy = -centerParam.cy - dy
    const p1x = stroke.x0 + dx
    const p1y = - stroke.y0 - dy
    const p2x = stroke.x + dx
    const p2y = - stroke.y - dy
    const defArray = [
      Math.floor(p1x / MyCalc.minRes),
      Math.floor(p1y / MyCalc.minRes),
      Math.floor(p2x / MyCalc.minRes),
      Math.floor(p2y / MyCalc.minRes),
      Math.floor(centerParam.cx / MyCalc.minRes),
      Math.floor(centerParam.cy / MyCalc.minRes),
    ].sort().toString()
    if (!MyCalc.doneLines.has(defArray)) {
      MyCalc.doneLines.add(defArray)
      createGraphWithBounds(startId, 0, {
        h: centerParam.cx,
        k: centerParam.cy,
        r: r
      },{
        xMin: Math.min(p1x, p2x),
        yMin: Math.min(p1y, p2y),
        xMax: Math.max(p1x, p2x),
        yMax: Math.max(p1y, p2y),
      },{hideAll: true, finalize: true})
    } else {
      console.log('skip')
    }
    startId += 1
    MyCalc.globalId = startId
    MyCalc.lastControlPoint.cubic = { x: 0, y: 0 }
    MyCalc.lastControlPoint.quadratic = { x: 0, y: 0 }
  } else if (stroke.command === 'closepath') {
    if (stroke.x0 != stroke.x && stroke.y0 != stroke.y) {
      const p0 = {x: stroke.x0 + dx, y: -stroke.y0 - dy}
      const p1 = {x: stroke.x + dx, y: -stroke.y - dy}
      const defArray = [
        Math.floor(p0.x / MyCalc.minRes),
        Math.floor(p1.x / MyCalc.minRes),
        Math.floor(p1.x / MyCalc.minRes),
        Math.floor(p1.y / MyCalc.minRes),
      ].sort().toString()
      if (!MyCalc.doneLines.has(defArray)) {
        MyCalc.doneLines.add(defArray)
        createLineSegment(p0, p1, startId, {finalize: true})
      } else {
        console.log('skip')
      }
    }
    MyCalc.lastControlPoint.cubic = { x: 0, y: 0 }
    MyCalc.lastControlPoint.quadratic = { x: 0, y: 0 }
  } else if (stroke.command === 'quadratic curveto') {
    const p0 = {x: stroke.x0 + dx, y: -stroke.y0 - dy}
    let p1 = {x: stroke.x1 + dx, y: -stroke.y1 - dy}
    const p3 = {x: stroke.x + dx, y: -stroke.y - dy}
    MyCalc.lastControlPoint.quadratic = { x: p1.x, y: p1.y }
    p1 = {
      x: p0.x / 3 + 2 * p1.x / 3,
      y: p0.y / 3 + 2 * p1.y / 3,
    }
    const p2 = {
      x: 2 * p1.x / 3 + p3.x / 3,
      y: 2 * p1.y / 3 + p3.y / 3,
    }
    const minMax = bezierMinMax(p0, p1, p2, p3)
    if ((minMax.max.y - minMax.min.y < MyCalc.minRes) && (minMax.max.x - minMax.min.x < MyCalc.minRes)) {
    } else {
      const defArray = [
        Math.floor(p0.x / MyCalc.minRes),
        Math.floor(p1.x / MyCalc.minRes),
        Math.floor(p1.x / MyCalc.minRes),
        Math.floor(p1.y / MyCalc.minRes),
        Math.floor(p2.x / MyCalc.minRes),
        Math.floor(p2.y / MyCalc.minRes),
        Math.floor(p3.x / MyCalc.minRes),
        Math.floor(p3.y / MyCalc.minRes),
      ].sort().toString()
      if (!MyCalc.doneLines.has(defArray)) {
        MyCalc.doneLines.add(defArray)
        createBezier(p0, p1, p2, p3, startId, {hideHandles: true, hidePoints: true, finalize: true})
      } else {
        console.log('skip')
      }
    }
  } else if (stroke.command === 'smooth quadratic curveto') {
    const p0 = {x: stroke.x0 + dx, y: -stroke.y0 - dy}
    let p1 = {
      x: 2 * stroke.x0 - MyCalc.lastControlPoint.quadratic.x + 2 * dx,
      y: 2 * -stroke.y0 - MyCalc.lastControlPoint.quadratic.y - 2 * dy,
    }
    const p3 = {x: stroke.x + dx, y: -stroke.y - dy}
    MyCalc.lastControlPoint.cubic = { x: 0, y: 0 }
    MyCalc.lastControlPoint.quadratic = { x: p1.x, y: p1.y }
    p1 = {
      x: p0.x / 3 + 2 * p1.x / 3,
      y: p0.y / 3 + 2 * p1.y / 3,
    }
    const p2 = {
      x: 2 * p1.x / 3 + p3.x / 3,
      y: 2 * p1.y / 3 + p3.y / 3,
    }
    const minMax = bezierMinMax(p0, p1, p2, p3)
    if ((minMax.max.y - minMax.min.y < MyCalc.minRes) && (minMax.max.x - minMax.min.x < MyCalc.minRes)) {
    } else {
      const defArray = [
        Math.floor(p0.x / MyCalc.minRes),
        Math.floor(p1.x / MyCalc.minRes),
        Math.floor(p1.x / MyCalc.minRes),
        Math.floor(p1.y / MyCalc.minRes),
        Math.floor(p2.x / MyCalc.minRes),
        Math.floor(p2.y / MyCalc.minRes),
        Math.floor(p3.x / MyCalc.minRes),
        Math.floor(p3.y / MyCalc.minRes),
      ].sort().toString()
      if (!MyCalc.doneLines.has(defArray)) {
        MyCalc.doneLines.add(defArray)
        createBezier(p0, p1, p2, p3, startId, {hideHandles: true, hidePoints: true, finalize: true})
      } else {
        console.log('skip')
      }
    }
  }
}

export function transformBezier(id: string) {
  if (id) {
    const expression = MyCalc.getExpression(id)
    if (expression && isBaseExpression(expression)) {
      const graphObject = createGraphObject(expression)
      if (graphObject instanceof Bezier) {
        const {p1, p2, p3, p4} = graphObject.getControlPoints()
        createBezier(p1, p2, p3, p4, graphObject.graphId, {finalize: true})
        MyCalc.deleteById(graphObject.id)
      }
    }
  }
}

export function substituteToAll(expressions: Expression[], graphId: number) {
  const expressionList = [];
  for (let i = 0; i < expressions.length; i++) {
    const expression = expressions[i];
    if (isBaseExpression(expression)) {
      if (expression.latex) {
        if (usesVariable(expression.latex, graphId)) {
          expression.latex = substituteFromId(expression.latex, graphId);
          expressionList.push(expression);
        }
      }
    }
  }
  return expressionList
}