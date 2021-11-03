// ==UserScript==
// @name         Precal thing
// @namespace    http://tampermonkey.net/
// @version      0.1.2
// @description  precal thing
// @author       You (not Watanabe)
// @match        https://www.desmos.com/calculator*
// @icon         https://www.google.com/s2/favicons?domain=desmos.com
// @grant        unsafeWindow
// @updateURL    https://github.com/Auriga05/graph-art-creator/raw/master/index.user.js
// @downloadURL  https://github.com/Auriga05/graph-art-creator/raw/master/index.user.js
// @require      https://code.jquery.com/jquery-3.5.1.slim.min.js
// @require      https://cdn.jsdelivr.net/npm/evaluatex@2.2.0/dist/evaluatex.min.js
// ==/UserScript==

import { LinkedVariable, Expression, getGraphType, parseDomains, simplify, generateBounds, substituteParenthesis, substituteFromId, usesVariable, functionRegex, setVariable, Bounds, NumberBounds, GraphTypes, createGraphObject} from './lib'
import { Graph } from './Graph'
import { expressionFormat } from './constants';
import { CalcType, MyCalcClass } from './MyCalc';

interface SelectionObject {
  id: string
  pos: { x: number
    y: number
  }
}

declare const Calc: CalcType;
declare const unsafeWindow: { Conic?: typeof Graph
  onload: number
  document: Document
  changeColor: () => void
  changegraphType: () => void
  deleteById: (_id: string) => void
  createConicHandler: () => void
  toggleArtist: () => void
  id: number
  idSet: boolean
  MyCalc: MyCalcClass
};

function isGraph(expression: Expression) {
  return expression.id.endsWith('_0') || expression.id.startsWith('final_');
}

export let MyCalc: MyCalcClass;

function main() {
  MyCalc = new MyCalcClass(Calc);

  const selections: SelectionObject[] = [];
  let easySelections: {x: number, y: number}[] = [];
  let lastSelection: {x: number, y: number};
  const graphAbbrev = ['C', 'HP', 'VP', 'E', 'HH', 'VH', 'LS'];
  let easyMode = false;
  let lastSelectedId = '';
  let currentlyPressed: number[] = [];
  let idSet = false;
  let shadeIdSet = false;
  let altTime = 0;
  let ctrlTime = 0;
  let expressionPos = { x: 0, y: 0 };
  let globalId = 1;
  let shadeId = 1;
  let currGraphId = 0;
  let centerPoint = {
    x: Infinity,
    y: Infinity,
  };

  let lastCenterPoint = {
    x: Infinity,
    y: Infinity,
  };

  function getShadeId() {
    return Math.max(...MyCalc
      .getExpressions()
      .filter((x) => x.id.startsWith('shade_'))
      .filter((x) => !x.id.includes('folder'))
      .map((x) => parseInt(x.id.split('_')[1], 10)), 0);
  }

  const shadingData: {
    [key: string]: { x: LinkedVariable, y: LinkedVariable }
  } = {
    lastUpperBoundary: {
      x: MyCalc.linkedVariable(null, -Infinity),
      y: MyCalc.linkedVariable(null, -Infinity),
    },
    lastLowerBoundary: {
      x: MyCalc.linkedVariable(null, Infinity),
      y: MyCalc.linkedVariable(null, Infinity),
    },
  };

  function updateVariables(filter ? : string) {
    Object.keys(MyCalc.globalVariablesObject).forEach(key => {
      delete MyCalc.globalVariablesObject[key];
    })
    let currExpressions = MyCalc.getExpressions();
    if (filter) {
      const idFilter = `${filter}_`;
      currExpressions = currExpressions.filter((x) => x.id.startsWith(idFilter));
    }
    for (let i = 0; i < currExpressions.length; i++) {
      const expression = currExpressions[i];
      const analysis = MyCalc.expressionAnalysis[expression.id];
      if (analysis) {
        if (analysis.evaluation) {
          if (analysis.evaluation.type === 'Number') {
            const variable = expression.latex.split('=')[0];
            if (variable.includes('_') && !(['x', 'y'].includes(variable))) {
              MyCalc.globalVariablesObject[variable] = analysis.evaluation.value.toString();
            }
          }
        } else if (expression.latex) {
          if (expression.latex.includes('f_')) {
            // console.log(expression);
          }
        }
      }
    }
  }

  function intersect(array1: string[], array2: string[]) {
    return array1.filter((value) => array2.includes(value));
  }

  function doesIntersect(array1: string[], array2: string[]) {
    const filteredArray = intersect(array1, array2);
    return (filteredArray.length > 0);
  }

  function typeFilter(expressionList: Expression[], graphType: number, types: string[]) {
    const ceTypes = expressionFormat[graphType];
    return expressionList.filter((x) => doesIntersect(
      ceTypes[parseInt(x.id.split('_')[1], 10)].types, types,
    ));
  }

  function getDomainsFromLatex(latex: string) {
    return [
      ...latex.matchAll(/\\left\\{((?:[-+]?\d+\.?\d*<)?[xy](?:<[-+]?\d+\.?\d*)?)\\right\\}/g),
    ].map((domain) => domain[1]);
  }

  function transformVariables(graphType: number, variables: number[]) {
    return GraphTypes[graphType].transformVariables(variables)
  }

  function toId(expression: string, _id: string | number) {
    return expression.replace(/_\{\d+([a-z]*)}/g, `_{${_id}$1}`);
  }

  function createGraphWithBounds(graphId: number, graphType: number, variables: any, _bounds: NumberBounds, _logical?: boolean) {
    const logical = !!_logical
    let { xMin, yMin, xMax, yMax } = _bounds;
    let cropType = 0;
    // 0 - default (x and y), 1 - x only, 2 - y only, 3 - no crop
    if (!Number.isFinite(xMin) && !Number.isFinite(xMax)) { // Has no x domain
      cropType += 2;
    }
    if (!Number.isFinite(yMin) && !Number.isFinite(yMax)) { // Has no y domain
      cropType += 1;
    }
    let h = 0;
    let k = 0;

    const expression = expressionFormat[graphType];
    const expressionsToSet = [];

    GraphTypes[graphType].setGraphVariables(variables, graphId)
    if (GraphTypes[graphType].hasCenter) {
      ({h, k} = variables);
      setVariable(`x_{${graphId}cam}`, (xMin - h).toString());
      setVariable(`y_{${graphId}cam}`, (yMin - k).toString());
      setVariable(`x_{${graphId}cbm}`, (xMax - h).toString());
      setVariable(`y_{${graphId}cbm}`, (yMax - k).toString());
      setVariable(`x_{${graphId}ca}`, xMin.toString());
      setVariable(`y_{${graphId}ca}`, yMin.toString());
      setVariable(`x_{${graphId}cb}`, xMax.toString());
      setVariable(`y_{${graphId}cb}`, yMax.toString());
    }
    if (logical) {
      const newExpression = expression[0]
      let newExpressionLatex = newExpression.latex;
      newExpressionLatex = newExpressionLatex.replaceAll('_{1', `_{${graphId}`);
      if (GraphTypes[graphType].hasCenter) {
        newExpressionLatex += generateBounds(MyCalc.linkedVariable(`x_{${graphId}ca}`, xMin), MyCalc.linkedVariable(`y_{${graphId}ca}`, yMin), MyCalc.linkedVariable(`x_{${graphId}cb}`, xMax), MyCalc.linkedVariable(`y_{${graphId}cb}`, yMax))
          .reference;
        const conic = createGraphObject({
          id: `${graphId.toString()}_${0}`,
          latex: newExpressionLatex,
          color: 'BLACK', 
          hidden: false,
          type: 'expression'
        })
        const bounds = conic.getRealBounds();
        if (!Number.isFinite(xMin)) {
          xMin = bounds.xMin.value - 2;
        }
        if (!Number.isFinite(yMin)) {
          yMin = bounds.yMin.value - 2;
        }
        if (!Number.isFinite(xMax)) {
          xMax = bounds.xMax.value + 2;
        }
        if (!Number.isFinite(yMax)) {
          yMax = bounds.yMax.value + 2;
        }
        setVariable(`x_{${graphId}cam}`, (xMin - h).toString());
        setVariable(`y_{${graphId}cam}`, (yMin - k).toString());
        setVariable(`x_{${graphId}cbm}`, (xMax - h).toString());
        setVariable(`y_{${graphId}cbm}`, (yMax - k).toString());
        setVariable(`x_{${graphId}ca}`, xMin.toString());
        setVariable(`y_{${graphId}ca}`, yMin.toString());
        setVariable(`x_{${graphId}cb}`, xMax.toString());
        setVariable(`y_{${graphId}cb}`, yMax.toString());
        MyCalc.setLogicalExpression({
          id: `${graphId.toString()}_${0}`,
          latex: newExpressionLatex,
          color: 'BLACK',
          hidden: false,
          type: 'expression',
        });
      }
    } else {
      for (let i = 0; i < expression.length; i++) {
        const newExpression = expression[i];
        let newExpressionLatex = newExpression.latex;
        newExpressionLatex = newExpressionLatex.replaceAll('_{1', `_{${graphId}`);
        if (doesIntersect(newExpression.types, ['var'])) {
          const [variable] = newExpressionLatex.split('=');
          const value = MyCalc.globalVariablesObject[toId(variable, graphId)];
          newExpressionLatex = `${variable}=${simplify(parseFloat(value), 4)}`;
        }
        if (graphType !== 6) {
          if (i === 0) {
            newExpressionLatex += generateBounds(MyCalc.linkedVariable(`x_{${graphId}ca}`, xMin), MyCalc.linkedVariable(`y_{${graphId}ca}`, yMin), MyCalc.linkedVariable(`x_{${graphId}cb}`, xMax), MyCalc.linkedVariable(`y_{${graphId}cb}`, yMax))
              .reference;
            const conic = createGraphObject({ id: `${graphId.toString()}_${i}`, latex: newExpressionLatex, color: 'BLACK', hidden: doesIntersect(expression[i].types, ['x_expression', 'y_expression']), type: 'expression' });
            const bounds = conic.getRealBounds();
            if (!Number.isFinite(xMin)) {
              xMin = bounds.xMin.value - 2;
            }
            if (!Number.isFinite(yMin)) {
              yMin = bounds.yMin.value - 2;
            }
            if (!Number.isFinite(xMax)) {
              xMax = bounds.xMax.value + 2;
            }
            if (!Number.isFinite(yMax)) {
              yMax = bounds.yMax.value + 2;
            }
            setVariable(`x_{${graphId}cam}`, (xMin - h).toString());
            setVariable(`y_{${graphId}cam}`, (yMin - k).toString());
            setVariable(`x_{${graphId}cbm}`, (xMax - h).toString());
            setVariable(`y_{${graphId}cbm}`, (yMax - k).toString());
            setVariable(`x_{${graphId}ca}`, xMin.toString());
            setVariable(`y_{${graphId}ca}`, yMin.toString());
            setVariable(`x_{${graphId}cb}`, xMax.toString());
            setVariable(`y_{${graphId}cb}`, yMax.toString());
          }
        }
        let isHidden = doesIntersect(expression[i].types, ['x_expression', 'y_expression']);
        if (doesIntersect(expression[i].types, ['x'])) isHidden = (cropType % 2 === 1);
        if (doesIntersect(expression[i].types, ['y'])) isHidden = cropType > 1;
        if (doesIntersect(expression[i].types, ['xy'])) isHidden = cropType === 3;
        expressionsToSet.push({
          id: `${graphId.toString()}_${i}`,
          latex: newExpressionLatex,
          color: 'BLACK',
          hidden: isHidden,
          type: 'expression',
        });
      }
      MyCalc.setExpressions(expressionsToSet);
    }
  }

  function convertFromStandard(latex: string, _id: string, _logical?: boolean) {
    const logical = !!_logical;
    const graphId = parseInt(_id, 10);
    const regex = [
      /\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\+\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}=([-+]?\d+\.?\d*)/g,
      /\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}=([-+]?\d+\.?\d*)\\left\(x([-+]?\d+\.?\d*)\\right\)/g,
      /\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}=([-+]?\d+\.?\d*)\\left\(y([-+]?\d+\.?\d*)\\right\)/g,
      /\\frac\{\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}\+\\frac\{\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}=1/g,
      /\\frac\{\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}-\\frac\{\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}=1/g,
      /\\frac\{\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}-\\frac\{\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}=1/g,
      /y=([-+]?\d+\.?\d*)x([-+]?\d+\.?\d*)\\left\\{([-+]?\d+\.?\d*)<x<([-+]?\d+\.?\d*)\\right\\}/g,
    ];
    const graphType = regex.findIndex((pattern) => pattern.test(latex));
    if (graphType === -1) {
    } else {
      const currRegex = regex[graphType];
      const match = latex.match(currRegex);
      if (match) {
        const variables = [...match[0].matchAll(currRegex)][0].slice(1)
          .map((x) => parseFloat(x));
        const domains = getDomainsFromLatex(latex);
        if (domains) {
          const bounds = parseDomains(domains);
          createGraphWithBounds(graphId, graphType, transformVariables(graphType, variables), bounds, logical);
        }
      }
    }
  }

  function unfinalizeConvert(expressionId: string) {
    const regex = /y=([-+]?(?:\d+\.?\d*)?)\\sqrt\{([-+]?\d+\.?\d*)\+\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}([-+]?\d+\.?\d*)/g;
    const expression = MyCalc.getExpression(expressionId);
    if (expression) {
      const variables = [...expression.latex.matchAll(regex)][0].slice(1);
      if (variables.length) {
        const [_a, _b, _h, _k] = variables;
        const a = parseFloat(_a === '-' ? '-1' : _a);
        const b = parseFloat(_b);
        const h = -parseFloat(_h);
        const k = parseFloat(_k);
        const a2 = b * a ** 2;
        const b2 = b;
        const { xMin: _xMin, xMax: _xMax, yMin: _yMin, yMax: _yMax } = parseDomains(getDomainsFromLatex(expression.latex));
        const xMin = Math.max(-Infinity, _xMin);
        const xMax = Math.min(Infinity, _xMax);
        if (a < 0) { // down
          const yMin = Math.max(-Infinity, _yMin);
          const yMax = Math.min(k, _yMax);
          if (b < 0) { // horizontal hyperbola
            createGraphWithBounds(globalId, 4, { h, a: Math.sqrt(Math.abs(b2)), k, b: Math.sqrt(Math.abs(a2)) }, { xMin, xMax, yMin, yMax });
          } else if (b > 0) { // vertical hyperbola
            createGraphWithBounds(globalId, 5, { h, a: Math.sqrt(Math.abs(a2)), k, b: Math.sqrt(Math.abs(b2)) }, { xMin, xMax, yMin, yMax });
          }
        } else if (a > 0) { // up
          const yMin = Math.max(k, _yMin);
          const yMax = Math.min(Infinity, _yMax);
          if (b < 0) { // horizontal hyperbola
            createGraphWithBounds(globalId, 4, { h, a: Math.sqrt(Math.abs(b2)), k, b: Math.sqrt(Math.abs(a2)) }, { xMin, xMax, yMin, yMax });
          } else if (b > 0) { // vertical parabola
            createGraphWithBounds(globalId, 5, { h, a: Math.sqrt(Math.abs(a2)), k, b: Math.sqrt(Math.abs(b2)) }, { xMin, xMax, yMin, yMax });
          }
        }
      }
    }
  }

  function unfinalize(expressionId: string, _logical?: boolean) {
    const logical = !!_logical;
    const currId = expressionId.split('_')[1];
    const baseExpression = MyCalc.getExpression(expressionId);
    if (baseExpression) {
      convertFromStandard(baseExpression.latex, currId, logical);
      if (!logical) {
        MyCalc.removeExpressions([baseExpression]);
      }
    }
  }

  function finalize(expressionId: string) {
    if (MyCalc.isLogical(expressionId)) {
      const graphId = parseInt(expressionId.split("_")[0])
      const expressionList = MyCalc.dependsOn(graphId).map((_expression) => {
        const expression = _expression
        expression.latex = substituteFromId(expression.latex, graphId)
        return expression
      })
      MyCalc.updateExpressions(expressionList);
      MyCalc.removeExpressionById(expressionId);
    } else {
      const currId = expressionId.split('_')[0];
      const sameIdItem = MyCalc.getExpression(`final_${currId}`)
      if (sameIdItem) {
        // throw Error('Same id for some reason')
      }
      const idFilter = `${currId}_`;
      const filteredExpressions = MyCalc.getExpressions().filter((expression) => expression.id.startsWith(idFilter));
      const baseExpression = MyCalc.getExpression(`${currId}_0`);

      if (!baseExpression) {
        throw Error(`Cannot find expression with id ${currId}_0`)
      }
      const conic = createGraphObject(baseExpression);

      const expressionList = [];
      MyCalc.removeExpressions(filteredExpressions);
      const allExpressions = MyCalc.getExpressions();

      for (let i = 0; i < allExpressions.length; i++) {
        const expression = allExpressions[i];
        if (expression.latex) {
          if (usesVariable(expression.latex, conic.graphId)) {
            expression.latex = substituteFromId(expression.latex, conic.graphId);
            expressionList.push(expression);
          }
        }
      }
      MyCalc.updateExpressions(expressionList);

      conic.latex = conic.convertToStandard();
      if (sameIdItem) {
        conic.id = `final_${globalId}`;
        globalId += 1
      } else {
        conic.id = `final_${conic.graphId}`;        
      }
      MyCalc.setExpression(conic);
    }
  }

  function createConic(graphType: number) {
    const expression = expressionFormat[graphType];
    const expressionsToSet = [];
    for (let i = 0; i < expression.length; i++) {
      const newExpression = expression[i];
      let newExpressionLatex = newExpression.latex;
      if (i === 0) {
        if (graphType !== 6) {
          newExpressionLatex += '\\left\\{x_{1ca}<x<x_{1cb}\\right\\}\\left\\{y_{1ca}<y<y_{1cb}\\right\\}';
        }
      }
      newExpressionLatex = newExpressionLatex.replace(/_\{\d+([a-z]*)}/g, `_{${globalId}$1}`);
      if (doesIntersect(newExpression.types, ['var'])) {
        const [variable] = newExpressionLatex.split('=');
        const value = MyCalc.globalVariablesObject[toId(variable, globalId)];
        newExpressionLatex = `${variable}=${simplify(parseFloat(value), 4)}`;
      }
      const hidden = doesIntersect(
        expression[i].types,
        ['x_expression', 'y_expression'],
      );
      if (hidden) {
        const split = newExpressionLatex.split('=');
        const matches = [...split[0].matchAll(functionRegex)]
        if (matches.length > 0) {
          const [full, name, args] = matches[0];
          MyCalc.globalFunctionsObject[name] = {
            id: `${globalId.toString()}_${i}`,
            args: args.split(','),
            definition: split[1],
          }
        }
      }
      expressionsToSet.push({ id: `${globalId.toString()}_${i}`,
        latex: newExpressionLatex,
        color: 'BLACK',
        hidden,
        type: 'expression' });
    }
    MyCalc.newGraph(globalId, expressionsToSet);
    globalId += 1;
  }

  function createDefaultConic(graphType: number) {
    const coordinates = MyCalc.graphpaperBounds.mathCoordinates;
    expressionPos = { x: parseFloat(((coordinates.left + coordinates.right) / 2).toFixed(4)), y: parseFloat(((coordinates.top + coordinates.bottom) / 2).toFixed(4)) };
    const verticalSize = (coordinates.top - coordinates.bottom);
    const horizontalSize = (coordinates.right - coordinates.left);
    const size = Math.min(verticalSize, horizontalSize);
    GraphTypes[graphType].setDefault(globalId, expressionPos, size)
    if (GraphTypes[graphType].hasCenter) {
      setVariable(`h_{${globalId}}`, expressionPos.x);
      setVariable(`k_{${globalId}}`, expressionPos.y);
    }
    if (GraphTypes[graphType].hasCrop) {
      setVariable(`x_{${globalId}cam}`, -size * 0.4);
      setVariable(`y_{${globalId}cam}`, -size * 0.4);
      setVariable(`x_{${globalId}cbm}`, size * 0.4);
      setVariable(`y_{${globalId}cbm}`, size * 0.4);
    }
    createConic(graphType)
  }

  function freeze(force: boolean, append?: boolean) {
    let newId = 1;
    const numExpressions = MyCalc.getItemCount()    
    if (append) {
      const expressionsString = localStorage.getItem('expressions')
      if (expressionsString) {
        const expressions: Expression[] = JSON.parse(expressionsString);
        let newId = globalId
        let newShadeId = shadeId
        const newExpressions = expressions.map((_expression) => {
          const expression = _expression
          const split = expression.id.split("_")
          if (split[0] === "final") {
            expression.id = `final_${newId}`
            newId += 1             
          } else if (split[0] === "shade") {
            expression.id = `shade_${newShadeId}`
            newShadeId += 1
          }
          return expression
        })
        MyCalc.setExpressions(newExpressions)
        globalId = newId
        shadeId = newShadeId
      }
    } else {
      if (numExpressions !== 1) {
        const expressions = MyCalc.getExpressions();
        let graphExpressionsNormal: Expression[] = [];
        if (force) {
          graphExpressionsNormal = expressions.filter((x) => !x.id.includes('_'));
        }
        const graphExpressionsBase = expressions.filter((x) => x.id.endsWith('_0') && !x.id.startsWith('final_'));
        const graphExpressionsFinal = expressions.filter((x) => x.id.startsWith('final_') && !x.id.includes('folder'));
        const graphExpressionsShade = expressions.filter((x) => x.id.startsWith('shade_') && !x.id.includes('folder'));
        const graphExpressionsNormalLatex = graphExpressionsNormal.map((_graphExpression) => {
          const graphExpression = _graphExpression;
          graphExpression.id = `final_${newId}`;
          newId += 1;
          return graphExpression;
        });
        const graphExpressionsBaseLatex = graphExpressionsBase.map((_graphExpression) => {
          const conic = createGraphObject(_graphExpression);
          conic.latex = conic.convertToStandard();
          conic.id = `final_${newId}`;
          conic.graphId = newId;
          newId += 1;
          return conic.toExpression();
        });
        const graphExpressionsFinalLatex = graphExpressionsFinal.map((_graphExpression) => {
          const graphExpression = _graphExpression;
          graphExpression.id = `final_${newId}`;
          newId += 1;
          return graphExpression;
        });
        const graphExpressionsShadeLatex = graphExpressionsShade.map((_graphExpression) => {
          const graphExpression = _graphExpression;
          const latex = substituteParenthesis(graphExpression.latex);
          const expression = { color: graphExpression.color, fillOpacity: graphExpression.fillOpacity, hidden: false, id: graphExpression.id, latex, type: 'expression' };
          return expression;
        });
        const latexAll = [
          ...graphExpressionsNormalLatex,
          ...graphExpressionsShadeLatex,
          ...graphExpressionsBaseLatex,
          ...graphExpressionsFinalLatex,
        ];
        localStorage.setItem('expressions', JSON.stringify(latexAll));
      } else {
        const expressionsString = localStorage.getItem('expressions')
        if (expressionsString) {
          const expressions: Expression[] = JSON.parse(expressionsString);
          MyCalc.setExpressions(expressions);
        }
      }
    }
  }

  function resetSelection() {
    shadingData.lastUpperBoundary = { x: MyCalc.linkedVariable(-Infinity), y: MyCalc.linkedVariable(-Infinity) };
    shadingData.lastLowerBoundary = { x: MyCalc.linkedVariable(Infinity), y: MyCalc.linkedVariable(Infinity) };
  }

  function finalizeId(_id: string) {
    if (_id.startsWith('final_')) {
      unfinalize(_id);
    } else if (_id.includes('_')) {
      finalize(_id);
    } else {
      unfinalizeConvert(_id);
    }
  }
  function fixNegative() {
    let toFix: Expression[] = [];
    const negativeab = MyCalc.getExpressions()
      .filter((x) => /[ab]_{\d*\w+}=-\d+[.]{0,1}\d*/g.test(x.latex)); // Selects ellipse, hyperbola with negative a, b
    toFix = [...toFix, ...negativeab.map((expression) => {
      expression.latex.replaceAll('-', '');
      return expression;
    })];
    MyCalc.updateExpressions(toFix);
  }

  function deleteById(_id: string) {
    if (_id.includes('_')) {
      if (['shade', 'final'].includes(_id.split('_')[0])) {
        const expression = MyCalc.getExpression(_id);
        if (expression) {
          MyCalc.removeExpression(expression);
        }
      } else {
        const graphId = parseInt(_id.split('_')[0]);
        const idFilter = `${graphId}_`;
        let filteredExpressions = MyCalc.getExpressions();
        filteredExpressions = filteredExpressions.filter((x) => x.id.startsWith(idFilter));
        MyCalc.removeExpressions(filteredExpressions);
        // MyCalc.removeExpressions(MyCalc.dependsOn(parseInt(currId)))
        const expressionList = MyCalc.dependsOn(graphId).map((_expression) => {
          const expression = _expression
          expression.latex = substituteFromId(expression.latex, graphId)
          return expression
        })
        MyCalc.updateExpressions(expressionList); 
      }
    }
  }

  function changeCropMode(_id: string) {
    if (_id.includes('_')) {
      const currId = _id.split('_')[0];
      const idFilter = `${currId}_`;
      let filteredExpressions = MyCalc.getExpressions();
      filteredExpressions = filteredExpressions.filter((x) => x.id.startsWith(idFilter) && !x.id.includes('folder'));
      const graphExpression = filteredExpressions.find((x) => x.id.endsWith('_0'));

      if (!graphExpression) {
        throw new Error();
      }

      const conic = createGraphObject(graphExpression);
      const { graphType } = conic;
      // 0 - default (x and y), 1 - x only, 2 - y only, 3 - no crop
      let cropType = conic.getCropType();
      cropType = (cropType + 1) % 4;
      [conic.latex] = conic.latex.split('\\left\\{');
      const addition = (cropType < 2 ? '\\left\\{x_{1ca}<x<x_{1cb}\\right\\}' : '') + (!(cropType % 2) ? '\\left\\{y_{1ca}<y<y_{1cb}\\right\\}' : '');
      conic.latex += addition.replaceAll('_{1', `_{${currId}`);
      const xBoundary = typeFilter(filteredExpressions, graphType, ['x']); // x only domain
      const yBoundary = typeFilter(filteredExpressions, graphType, ['y']); // y only domain
      const xyPoints = typeFilter(filteredExpressions, graphType, ['xy']); // points
      const expressionsToSet = [];
      for (let i = 0; i < xBoundary.length; i++) {
        const expression = xBoundary[i];
        expression.hidden = (cropType % 2 === 1);
        expressionsToSet.push(expression);
      }
      for (let i = 0; i < yBoundary.length; i++) {
        const expression = yBoundary[i];
        expression.hidden = (cropType > 1);
        expressionsToSet.push(expression);
      }
      for (let i = 0; i < xyPoints.length; i++) {
        const expression = xyPoints[i];
        expression.hidden = (cropType === 3);
        expressionsToSet.push(expression);
      }
      expressionsToSet.push(conic);
      MyCalc.updateExpressions(expressionsToSet);
    }
  }

  function hideCropLines(_id: string) {
    if (_id.includes('_')) {
      const idFilter = `${_id.split('_')[0]}_`;
      let filteredExpressions = MyCalc.getExpressions();
      filteredExpressions = filteredExpressions.filter((x) => x.id.startsWith(idFilter))
        .filter((x) => !x.id.includes('folder'));
      const graphExpression = filteredExpressions.find((x) => x.id.endsWith('_0'));

      if (!graphExpression) {
        throw new Error();
      }

      const conic = createGraphObject(graphExpression);
      const { graphType } = conic;
      filteredExpressions = typeFilter(filteredExpressions, graphType, ['hide']);
      let [newExpression] = filteredExpressions;
      const newState = !newExpression.hidden;
      const expressionsToSet = [];
      const cropType = conic.getCropType();
      const xBoundary = typeFilter(filteredExpressions, graphType, ['x']); // x only domain
      const yBoundary = typeFilter(filteredExpressions, graphType, ['y']); // y only domain
      const xyPoints = typeFilter(filteredExpressions, graphType, ['xy']); // points
      const avoidPoints = [
        ...xBoundary.map((exp) => exp.id),
        ...yBoundary.map((exp) => exp.id),
        ...xyPoints.map((exp) => exp.id),
      ];
      if (!newState) {
        for (let i = 0; i < filteredExpressions.length; i++) {
          newExpression = filteredExpressions[i];
          if (!avoidPoints.includes(newExpression.id)) {
            newExpression.hidden = false;
          }
          expressionsToSet.push(newExpression);
        }
        for (let j = 0; j < xBoundary.length; j++) {
          const expression = xBoundary[j];
          expression.hidden = (cropType % 2 === 1);
          expressionsToSet.push(expression);
        }
        for (let j = 0; j < yBoundary.length; j++) {
          const expression = yBoundary[j];
          expression.hidden = (cropType > 1);
          expressionsToSet.push(expression);
        }
        for (let j = 0; j < xyPoints.length; j++) {
          const expression = xyPoints[j];
          expression.hidden = (cropType === 3);
          expressionsToSet.push(expression);
        }
      } else {
        for (let i = 0; i < filteredExpressions.length; i++) {
          newExpression = filteredExpressions[i];
          if ('hidden' in newExpression) {
            newExpression.hidden = newState;
          }
          expressionsToSet.push(newExpression);
        }
      }
      MyCalc.updateExpressions(expressionsToSet);
    }
  }

  function setId() {
    const baseId = Math.max(0, Math.max(...MyCalc.getExpressions()
      .filter((x) => x.id.endsWith('_0'))
      .map((x) => parseInt(x.id.split('_')[0], 10))
      .filter((x) => !Number.isNaN(x)))) + 1;

    const finalId = Math.max(0, Math.max(...MyCalc.getExpressions()
      .filter((x) => x.id.startsWith('final_'))
      .map((x) => parseInt(x.id.split('_')[1], 10))
      .filter((x) => !Number.isNaN(x)))) + 1;
    globalId = Math.max(baseId, finalId);
    idSet = true;
  }
  function shadeToBack() {
    const state = MyCalc.getState();
    state.expressions.list = state.expressions.list
      .filter((x) => x.id.startsWith('shade_'))
      .concat(state.expressions.list.filter((x) => !x.id.startsWith('shade_')));
    MyCalc.setState(state);
  }

  function toggleShading() {
    const shade = MyCalc.getExpressions()
      .filter((x) => x.id.startsWith('shade_') && !x.id.includes('folder'));
    const newState = !shade[0].hidden;
    MyCalc.updateExpressions(shade.map((_x) => {
      const x = _x;
      x.hidden = newState;
      return x;
    }));
  }
  function getBoundsById(_id: string) {
    const graphExpression = MyCalc.getExpression(_id)
    if (graphExpression) {
      console.log((createGraphObject(graphExpression))
        .getRealBounds());
    }
  }
  function expressionToFront(_id: string) {
    const state = MyCalc.getState();
    const expression = state.expressions.list
      .filter((_expression) => _expression.id === _id);
    const multipleExpressions = state.expressions.list
      .filter((_expression) => _expression.id !== _id);
    state.expressions.list = expression.concat(multipleExpressions);
    MyCalc.setState(state);
  }
  function keyUpHandler(e: KeyboardEvent) {
    if (MyCalc) MyCalc.updateLinkedVariables()
    updateVariables();
    setId();
    if (currentlyPressed.includes(e.keyCode)) {
      currentlyPressed = currentlyPressed.filter((key) => key !== e.keyCode);
    }
    if (e.ctrlKey && e.shiftKey) {
      const { key } = e;
      if (key === '<') {
        if (MyCalc.selectedExpressionId) {
          expressionToFront(MyCalc.selectedExpressionId);
        }
      }
      if (key === 'F') { // F - Finalize
        if (MyCalc.selectedExpressionId) {
          finalizeId(MyCalc.selectedExpressionId);
        }
      }
    }
    if (e.key === 'Control') {
      ctrlTime = Date.now();
    }
    if (e.key === 'Alt') {
      altTime = Date.now();
    }
    if (e.ctrlKey || (Date.now() - ctrlTime) < 100) {
      ctrlTime = Date.now();
      const { key } = e;
    }
    if (e.altKey || (Date.now() - altTime) < 100) {
      altTime = Date.now();
      const { keyCode } = e;
      if (keyCode === 87) {
        const selection = selections.pop();
      }
      if (keyCode === 77) {
        if (MyCalc.selectedExpressionId) {
          getBoundsById(MyCalc.selectedExpressionId);
        }
      }
      if (keyCode === 219) {
        fixNegative();
      }
      if (keyCode === 189) {
        shadeToBack();
      } else if (keyCode === 187) {
        toggleShading();
      } else if ((keyCode >= 49) && (keyCode <= 56)) {
        createDefaultConic(keyCode - 49);
      } else if (keyCode === 83) { // bottom
        resetSelection();
      } else if (keyCode === 48) {
        freeze(e.shiftKey, e.ctrlKey);
      } else if (keyCode === 88) {
        if (MyCalc.selectedExpressionId) deleteById(MyCalc.selectedExpressionId);
      } else if (keyCode === 81) {
        if (MyCalc.selectedExpressionId) changeCropMode(MyCalc.selectedExpressionId);
      } else if (keyCode === 72) {
        if (MyCalc.selectedExpressionId) hideCropLines(MyCalc.selectedExpressionId);
      } else if (keyCode === 70) {
        easyMode = !easyMode;
      }
    }
    e.preventDefault();
  }

  function keyDownHandler(e: KeyboardEvent) {
    if (MyCalc) MyCalc.updateLinkedVariables()
    if (e.altKey) {
      if (!currentlyPressed.includes(e.keyCode)) {
        currentlyPressed.push(e.keyCode);
      }
    }
  }

  function fillInside(expressionId: string) {
    const object = MyCalc.getExpression(expressionId)
    if (object) {
      const conic = createGraphObject(object);
      if ([0, 4].includes(conic.graphType)) {
        conic.latex = conic.latex.replace('=', '>');
      } else if ([1, 2, 3, 5, 6].includes(conic.graphType)) {
        conic.latex = conic.latex.replace('=', '<');
      }
      MyCalc.setExpression({ color: 'BLACK', hidden: false, type: 'expression', id: `shade_${shadeId}`, latex: conic.latex });
      shadeId += 1;
    }
  }

  function fillIntersection(lowerId: string, upperId: string, axis: string) {
    const lowerObject = MyCalc.getExpression(lowerId)
    const upperObject = MyCalc.getExpression(upperId)

    if (!upperObject || !lowerObject) {
      throw new Error("This shouldn't happen");
    }

    const lowerConic = createGraphObject(lowerObject);
    const upperConic = createGraphObject(upperObject);

    const lowerBounds = lowerConic.getRealBounds();
    const upperBounds = upperConic.getRealBounds();

    if (axis === 'y') {
      let realMin = lowerBounds.xMin.value < upperBounds.xMin.value
        ? upperBounds.xMin : lowerBounds.xMin;
      let realMax = lowerBounds.xMax.value > upperBounds.xMax.value
        ? upperBounds.xMax : lowerBounds.xMax;

      if (Number.isFinite(lastCenterPoint.x)) {
        if (shadingData.lastUpperBoundary.y.value > realMin.value && lastCenterPoint.x < centerPoint.x) { // To right
          realMin = shadingData.lastUpperBoundary.y;
        }
        if (shadingData.lastLowerBoundary.y.value < realMax.value && lastCenterPoint.x > centerPoint.x) {
          realMax = shadingData.lastLowerBoundary.y;
        }
      }

      shadingData.lastUpperBoundary.y = realMax;
      shadingData.lastLowerBoundary.y = realMin;
      const bounds = generateBounds(
        realMin, MyCalc.linkedVariable(-Infinity), realMax, MyCalc.linkedVariable(Infinity),
      ).reference;

      const newExpressions = [];
      const lowerConicConverted = lowerConic.convertToYRelevant();
      const upperConicConverted = upperConic.convertToYRelevant();

      for (let lowerIndex = 0; lowerIndex < lowerConicConverted.length; lowerIndex++) {
        const currLowerConic = lowerConicConverted[lowerIndex];
        for (let upperIndex = 0; upperIndex < upperConicConverted.length; upperIndex++) {
          const currUpperConic = upperConicConverted[upperIndex];
          const newExpression = `${currLowerConic}<y<${currUpperConic}${bounds}`;
          newExpressions.push({ color: 'BLACK', hidden: false, type: 'expression', id: `shade_${shadeId}`, latex: newExpression, fillOpacity: '1' });
          shadeId += 1;
        }
      }
      MyCalc.setExpressions(newExpressions);
    } else if (axis === 'x') {
      let realMin = lowerBounds.yMin.value < upperBounds.yMin.value
        ? upperBounds.yMin : lowerBounds.yMin;
      let realMax = lowerBounds.yMax.value > upperBounds.yMax.value
        ? upperBounds.yMax : lowerBounds.yMax;

      if (Number.isFinite(lastCenterPoint.y)) {
        if (shadingData.lastUpperBoundary.x.value > realMin.value && lastCenterPoint.y < centerPoint.y) {
          realMin = shadingData.lastUpperBoundary.x;
        }
        if (shadingData.lastLowerBoundary.x.value < realMax.value && lastCenterPoint.y > centerPoint.y) {
          realMax = shadingData.lastLowerBoundary.x;
        }
      }

      shadingData.lastUpperBoundary.x = realMax;
      shadingData.lastLowerBoundary.x = realMin;
      const bounds = generateBounds(MyCalc.linkedVariable(-Infinity), realMin, MyCalc.linkedVariable(Infinity), realMax)
        .reference;

      const newExpressions = [];
      const lowerConicConverted = lowerConic.convertToXRelevant();
      const upperConicConverted = upperConic.convertToXRelevant();

      for (let lowerIndex = 0; lowerIndex < lowerConicConverted.length; lowerIndex++) {
        const currLowerConic = lowerConicConverted[lowerIndex];
        for (let upperIndex = 0; upperIndex < upperConicConverted.length; upperIndex++) {
          const currUpperConic = upperConicConverted[upperIndex];
          const newExpression = `${currLowerConic}<x<${currUpperConic}${bounds}`;
          newExpressions.push({ color: 'BLACK', hidden: false, type: 'expression', id: `shade_${shadeId}`, latex: newExpression });
          shadeId += 1;
        }
      }
      MyCalc.setExpressions(newExpressions);
    }
  }
  function mouseUpHandler(e: PointerEvent) {
    if (MyCalc) MyCalc.updateLinkedVariables()
    setId();
    if (MyCalc.selectedExpressionId) {
      lastSelectedId = MyCalc.selectedExpressionId;
    }
    updateVariables();
    if (!shadeIdSet) {
      shadeId = getShadeId() + 1;
      shadeIdSet = true;
    }
    if (easyMode) {
      // if (easySelections.length > 4) {
      //   easySelections.pop()
      // }
      console.log(easySelections)
      if (e.button === 0) {
        const selectedExpression = MyCalc.getSelected()
        MyCalc.selectedExpressionId = undefined
        if (selectedExpression?.type === 'expression' && isGraph(selectedExpression)) {
          console.log(selectedExpression)
          const point = createGraphObject(selectedExpression).getClosestEndpoint(MyCalc.pixelsToMath({
            x: e.clientX,
            y: e.clientY,
          }))
          console.log(point)
          easySelections.push({
            x: point.x.value,
            y: point.y.value,
          })
        } else {
          easySelections.push(MyCalc.pixelsToMath({ x: e.clientX, y: e.clientY }));
        }
      } else if (e.button == 1) {
        if (easySelections.length === 1) {

        } 
        if (easySelections.length === 2) {
          setVariable(`x_{${globalId}a}`, easySelections[0].x);
          setVariable(`y_{${globalId}a}`, easySelections[0].y);
          setVariable(`x_{${globalId}b}`, easySelections[1].x);
          setVariable(`y_{${globalId}b}`, easySelections[1].y);
          createConic(6)
        }
        if (easySelections.length === 4) {
          MyCalc.regression(easySelections)
        }
        easySelections = []
      }
    } else {
      if (e.button === 1) {
        const shade = MyCalc.getExpressions().filter((expression) => expression.id.includes("shade_"))
        shade.forEach((shade) => {
          const {xMin, xMax, yMin, yMax} = parseDomains(getDomainsFromLatex(shade.latex))
          
        })
      }
      if (currentlyPressed.includes(65)) {
        const selected = MyCalc.getSelected();
        if (selected && isGraph(selected)) {
          selections.push({ id: selected.id, pos: MyCalc.pixelsToMath({ x: e.clientX, y: e.clientY }) });
        }
        if (selections.length >= 2) {
          const lowerSelection = selections.shift();
          const upperSelection = selections.shift();

          if (!upperSelection || !lowerSelection) {
            throw new Error("This shouldn't happen");
          }

          centerPoint = {
            x: (upperSelection.pos.x + lowerSelection.pos.x) / 2,
            y: (upperSelection.pos.x + lowerSelection.pos.y) / 2,
          };

          const slope = (Math.abs(upperSelection.pos.y - lowerSelection.pos.y) + 1)
            / (Math.abs(upperSelection.pos.x - lowerSelection.pos.x) + 1);
          const axis = (slope > 1) ? 'y' : 'x';

          let upperId = upperSelection.id;
          let lowerId = lowerSelection.id;

          if (upperId === lowerId) {
            const lowerFinal = lowerId.startsWith('final_');
            if (lowerFinal) {
              unfinalize(lowerId);
              lowerId = `${lowerId.split('_')[1]}_0`;
            }
            fillInside(lowerId);
            if (lowerFinal) finalize(lowerId);
          } else {
            const lowerFinal = lowerId.startsWith('final_');
            const upperFinal = upperId.startsWith('final_');
            if (lowerFinal) {
              unfinalize(lowerId, true);
              lowerId = `${lowerId.split('_')[1]}_0`;
            }
            if (upperFinal) {
              unfinalize(upperId, true);
              upperId = `${upperId.split('_')[1]}_0`;
            }
            fillIntersection(lowerId, upperId, axis);
            if (lowerFinal) finalize(lowerId);
            if (upperFinal) finalize(upperId);
          }
          lastCenterPoint = centerPoint;
        }
      }
    }
  }

  document.addEventListener('keydown', keyDownHandler, false);
  document.addEventListener('keyup', keyUpHandler, false);
  document.addEventListener('pointerup', mouseUpHandler, false);

  function toggleArtist() {
    const x: HTMLElement = document.querySelector('#artist') as HTMLElement;
    const y: HTMLElement = document.querySelector('#artist-container') as HTMLElement;

    if (x) x.style.display = x.style.display === 'none' ? 'block' : 'none';
    if (y) y.style.display = y.style.display === 'none' ? 'block' : 'none';
  }

  function changeColor() {
    const graphExpression = MyCalc.getExpression(lastSelectedId);
    if (graphExpression) {
      const colorForm = $('#colorForm');
      if (colorForm) {
        const data = colorForm.serializeArray();
        data.forEach((pair) => {
          graphExpression[pair.name] = pair.value;
        });
        MyCalc.updateExpression(graphExpression);
      }
    }
  }

  function changegraphType() {
    currGraphId = (currGraphId + 1) % 7;
    const button = document.querySelector('#artist-button');
    if (button) {
      button.innerHTML = graphAbbrev[currGraphId];
    }
  }

  function createConicHandler() {
    createDefaultConic(currGraphId);
  }

  const shortcutButtons = false

  const pillbox = unsafeWindow.document.querySelector('.dcg-overgraph-pillbox-elements');
  if (pillbox) {
    pillbox.insertAdjacentHTML('beforeend', '<div id="artist-button-container"><div class="dcg-tooltip-hit-area-container"><div class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings" role="button" onclick=\'toggleArtist()\' style="background:#ededed"><i class="dcg-icon-wrench" aria-hidden="true"></i></div></div><div style="display: none"></div></div>');
    pillbox.insertAdjacentHTML('beforeend', '<div id="artist-container" class="dcg-artist-view-container"></div>');
    const artistContainer = unsafeWindow.document.querySelector('#artist-container');
    if (shortcutButtons) {
      if (artistContainer) {
        artistContainer.insertAdjacentHTML('beforeend', `<div class="dcg-tooltip-hit-area-container dcg-hovered"> <div id="artist-button" class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings dcg-hovered" role="button" oncontextmenu="createConicHandler();return false;" onclick="changegraphType()" style="background:#ededed">${graphAbbrev[currGraphId]}</div></div>`);
        artistContainer.insertAdjacentHTML('beforeend', '<div class="dcg-tooltip-hit-area-container dcg-hovered"> <div class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings dcg-hovered" role="button" onclick="deleteById(Calc.selectedExpressionId)" style="background:#ededed">X</div></div>');
        artistContainer.insertAdjacentHTML('beforeend', '<div class="dcg-tooltip-hit-area-container dcg-hovered"> <div class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings dcg-hovered" role="button" onclick="hideCropLines(Calc.selectedExpressionId)" style="background:#ededed">H</div></div>');
        artistContainer.insertAdjacentHTML('beforeend', '<div class="dcg-tooltip-hit-area-container dcg-hovered"> <div class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings dcg-hovered" role="button" onclick="changeCropMode(Calc.selectedExpressionId)" style="background:#ededed">Q</div></div>');
        artistContainer.insertAdjacentHTML('beforeend', '<div class="dcg-tooltip-hit-area-container dcg-hovered"> <div class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings dcg-hovered" role="button" onclick="finalizeId(Calc.selectedExpressionId)" style="background:#ededed">F</div></div>');
        artistContainer.insertAdjacentHTML('beforeend', '<div class="dcg-tooltip-hit-area-container dcg-hovered"> <div class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings dcg-hovered" role="button" oncontextmenu="freeze(false);return false;" style="background:#ededed">S</div></div>');
      }
    }
  }

  const body = document.querySelector('.dcg-grapher');
  if (body) {
    body.insertAdjacentHTML('beforeend', '<div id="artist" style="position: absolute; bottom: 5%; right: 5%; padding: 10px; border: 1px solid black; border-radius: 10px"><form id="colorForm" onSubmit="return changeColor()"><div> Color <input name="color" type="color"></div><div> Opacity <input name="fillOpacity" type="number" min="0" max="1" value="0.4"></div><div><input type="button" value="Apply" onclick="changeColor()"></div></form></div>');
  }

  unsafeWindow.MyCalc = MyCalc;
  unsafeWindow.idSet = idSet;
  unsafeWindow.id = globalId;
  unsafeWindow.Conic = Graph;
  unsafeWindow.changeColor = changeColor;
  unsafeWindow.changegraphType = changegraphType;
  unsafeWindow.createConicHandler = createConicHandler;
  unsafeWindow.deleteById = deleteById;
  unsafeWindow.toggleArtist = toggleArtist;
}

(async () => {
  while (typeof Calc === 'undefined') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  main();
})();
