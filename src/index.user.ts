import { finalizeId, unfinalize, finalize } from "./actions/finalize";
import { hideCropLines } from "./actions/hideCropLines";
import { Graph } from "./classes/Graph";
import { MyCalcClass } from "./classes/MyCalc";
import { LinkedVariable, setVariable, generateBounds, createGraphObject, doesIntersect, functionRegex, toId, simplify, createConic, isBaseExpression, substituteParenthesis, typeFilter, getIdParts, transformBezier, createLineSegment, createBezier } from "./lib/lib";
import { CalcType } from "./types/desmosTypes";
import { Expression, NumberBounds, Bounds, GraphingOptions, InputBaseExpression, BaseExpression, IdParts, GraphTypeIdToName, GraphTypeNames, GraphTypesByName } from "./types/types";

interface SelectionObject {
  id: string
  pos: { x: number
    y: number
  }
}

declare const Calc: CalcType;
declare const unsafeWindow: { Graph ?: typeof Graph
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

export function createGraphWithBounds(graphId: number, graphType: GraphTypeNames, variables: any, _bounds: NumberBounds | Bounds, options?: GraphingOptions) {
  const logical = !!options?.logical
  let xMin = _bounds.xMin instanceof LinkedVariable ? _bounds.xMin.value : _bounds.xMin
  let yMin = _bounds.yMin instanceof LinkedVariable ? _bounds.yMin.value : _bounds.yMin
  let xMax = _bounds.xMax instanceof LinkedVariable ? _bounds.xMax.value : _bounds.xMax
  let yMax = _bounds.yMax instanceof LinkedVariable ? _bounds.yMax.value : _bounds.yMax
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

  const graphFormat = GraphTypesByName[graphType].expressionFormat;
  const expressionsToSet = [];

  const Class = GraphTypesByName[graphType]
  Class.setGraphVariables(variables, graphId)
  if (Class.hasCenter) {
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
  if (logical || options?.finalize) {
    const newExpression = graphFormat[0]
    let newExpressionLatex = newExpression.latex;
    newExpressionLatex = newExpressionLatex.replaceAll('_{1', `_{${graphId}`);
    if (Class.hasCenter) {
      newExpressionLatex += generateBounds(
        MyCalc.linkedVariable(`x_{${graphId}ca}`, xMin),
        MyCalc.linkedVariable(`y_{${graphId}ca}`, yMin),
        MyCalc.linkedVariable(`x_{${graphId}cb}`, xMax),
        MyCalc.linkedVariable(`y_{${graphId}cb}`, yMax)
      ).reference;
    }
    const graphObject = createGraphObject({
      id: `${graphId.toString()}_${0}`,
      latex: newExpressionLatex,
      color: 'BLACK', 
      hidden: false,
      type: "expression",
      label: JSON.stringify({
        graphType
      })
    })
    graphFormat
      .map((expression, index) => { return {index, ...expression}})
      .filter(expression => doesIntersect(expression.types, ['x_expression', 'y_expression']))
      .forEach(_expression => {
        const expression = _expression.latex.replaceAll('_{1', `_{${graphId}`);
        const split = expression.split('=');
        const matches = [...split[0].matchAll(functionRegex)]
        if (matches.length > 0) {
          const [full, name, args] = matches[0];
          MyCalc.globalFunctionsObject[name] = {
            id: `${graphId}_${_expression.index}`,
            args: args.split(','),
            definition: split[1],
          }
        }
      })
    if (Class.hasCrop) {
      const bounds = graphObject.getRealBounds();
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
    if (options?.finalize) {
      graphObject.latex = graphObject.convertToStandard();
      graphObject.id = `final_${graphObject.graphId}`
      MyCalc.setExpression(graphObject);
    } else {
      MyCalc.setLogicalExpression(graphObject);
    }
  } else {
    for (let i = 0; i < graphFormat.length; i++) {
      const newExpression = graphFormat[i];
      let newExpressionLatex = newExpression.latex;
      newExpressionLatex = newExpressionLatex.replaceAll('_{1', `_{${graphId}`);
      if (doesIntersect(newExpression.types, ['var'])) {
        const [variable] = newExpressionLatex.split('=');
        const value = MyCalc.virtualCalc.variables[toId(variable, graphId)];
        newExpressionLatex = `${variable}=${simplify(parseFloat(value), 4)}`;
      }
      let label = ""
      if (graphType !== "line_segment") {
        if (i === 0) {
          label = JSON.stringify({
            graphType
          })
          newExpressionLatex += generateBounds(
            MyCalc.linkedVariable(`x_{${graphId}ca}`, xMin),
            MyCalc.linkedVariable(`y_{${graphId}ca}`, yMin),
            MyCalc.linkedVariable(`x_{${graphId}cb}`, xMax),
            MyCalc.linkedVariable(`y_{${graphId}cb}`, yMax)
          ).reference;
          const conic = createGraphObject({
            id: `${graphId.toString()}_${i}`,
            latex: newExpressionLatex, color: 'BLACK',
            hidden: doesIntersect(graphFormat[i].types, ['x_expression', 'y_expression']),
            type: "expression",
            label: JSON.stringify({
              graphType
            })
          });
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
      let isHidden;
      if (options?.hideCropLines) {
        isHidden = doesIntersect(graphFormat[i].types, ['x_expression', 'y_expression', 'x', 'y', 'xy']);
      } else {
        isHidden = doesIntersect(graphFormat[i].types, ['x_expression', 'y_expression']);
        if (doesIntersect(graphFormat[i].types, ['x'])) isHidden = (cropType % 2 === 1);
        if (doesIntersect(graphFormat[i].types, ['y'])) isHidden = cropType > 1;
        if (doesIntersect(graphFormat[i].types, ['xy'])) isHidden = cropType === 3;        
      }
      if (options?.hideAll) {
        isHidden = doesIntersect(graphFormat[i].types, ['x_expression', 'y_expression', 'x', 'y', 'xy', 'point']);
      }
      
      if (doesIntersect(graphFormat[i].types, ['x_expression', 'y_expression'])) {
        const split = newExpressionLatex.split('=');
        const matches = [...split[0].matchAll(functionRegex)]
        if (matches.length > 0) {
          const [full, name, args] = matches[0];
          MyCalc.globalFunctionsObject[name] = {
            id: `${graphId}_${i}`,
            args: args.split(','),
            definition: split[1],
          }
        }
      }
      const newBaseExpression: InputBaseExpression = {
        id: `${graphId}_${i}`,
        latex: newExpressionLatex,
        color: 'BLACK',
        hidden: isHidden,
        type: "expression",
        label: label
      }
      expressionsToSet.push(newBaseExpression);
    }
    if (options?.update) {
      MyCalc.updateExpressions(expressionsToSet)
    } else if (options?.set) {
      MyCalc.setExpressions(expressionsToSet)
    } else {
      MyCalc.newGraph(graphId, expressionsToSet);
    }
  }
}

function main() {
  MyCalc = new MyCalcClass(Calc);

  const selections: SelectionObject[] = [];
  let easySelections: {x: number, y: number}[] = [];
  const graphAbbrev = ['C', 'HP', 'VP', 'E', 'HH', 'VH', 'LS'];
  let easyMode = false;
  let lastSelectedId = '';
  let currentlyPressed: number[] = [];
  let shadeIdSet = false;
  let altTime = 0;
  let ctrlTime = 0;
  let expressionPos = { x: 0, y: 0 };
  let shadeId = 1;
  let currGraphName: GraphTypeNames = "circle";
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
      x: MyCalc.linkedVariable(-Infinity),
      y: MyCalc.linkedVariable(-Infinity),
    },
    lastLowerBoundary: {
      x: MyCalc.linkedVariable(Infinity),
      y: MyCalc.linkedVariable(Infinity),
    },
  };

  function createDefaultConic(graphType: GraphTypeNames) {
    const Class = GraphTypesByName[graphType]
    const coordinates = MyCalc.graphpaperBounds.mathCoordinates;
    expressionPos = { x: parseFloat(((coordinates.left + coordinates.right) / 2).toFixed(MyCalc.precision)), y: parseFloat(((coordinates.top + coordinates.bottom) / 2).toFixed(MyCalc.precision)) };
    const verticalSize = (coordinates.top - coordinates.bottom);
    const horizontalSize = (coordinates.right - coordinates.left);
    const size = Math.min(verticalSize, horizontalSize);
    Class.setDefault(MyCalc.globalId, expressionPos, size)
    if (Class.hasCenter) {
      setVariable(`h_{${MyCalc.globalId}}`, expressionPos.x);
      setVariable(`k_{${MyCalc.globalId}}`, expressionPos.y);
    }
    if (Class.hasCrop) {
      setVariable(`x_{${MyCalc.globalId}cam}`, -size * 0.4);
      setVariable(`y_{${MyCalc.globalId}cam}`, -size * 0.4);
      setVariable(`x_{${MyCalc.globalId}cbm}`, size * 0.4);
      setVariable(`y_{${MyCalc.globalId}cbm}`, size * 0.4);
    }
    createConic(graphType, MyCalc.globalId)
    MyCalc.globalId += 1
  }

  function freeze(force: boolean, append?: boolean) {
    let newId = 1;
    const numExpressions = MyCalc.getItemCount()    
    if (append) {
      const expressionsString = localStorage.getItem('expressions')
      if (expressionsString) {
        const expressions: Expression[] = JSON.parse(expressionsString);
        let newId = MyCalc.globalId
        let newShadeId = shadeId
        const baseExpressions = expressions.filter(isBaseExpression)
        const newExpressions: BaseExpression[] = []
        baseExpressions.forEach((_expression) => {
          const expression = _expression
          if (!MyCalc.existingExpressions.has(expression.latex)) {
            const split = expression.id.split("_")
            if (split[0] === "final") {
              expression.id = `final_${newId}`
              newId += 1             
            } else if (split[0] === "shade") {
              expression.id = `shade_${newShadeId}`
              newShadeId += 1
            }
            MyCalc.existingExpressions.add(expression.latex)
            newExpressions.push(expression)
          }
        })
        MyCalc.setExpressions(newExpressions)
        MyCalc.globalId = newId
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
          if (isBaseExpression(_graphExpression)) {
            const conic = createGraphObject(_graphExpression);
            conic.latex = conic.convertToStandard();
            conic.id = `final_${newId}`;
            conic.graphId = newId;
            newId += 1;
            return conic.toExpression();
          }
        });
        const graphExpressionsFinalLatex = graphExpressionsFinal.map((_graphExpression) => {
          const graphExpression = _graphExpression;
          graphExpression.id = `final_${newId}`;
          newId += 1;
          return graphExpression;
        });
        const graphExpressionsShadeLatex = graphExpressionsShade.map((_graphExpression) => {
          const graphExpression = _graphExpression;
          if (isBaseExpression(graphExpression)) {
            const latex = substituteParenthesis(graphExpression.latex);
            const expression: InputBaseExpression & {fillOpacity: string} = {
              color: graphExpression.color,
              fillOpacity: graphExpression.fillOpacity,
              hidden: false,
              id: graphExpression.id,
              latex,
              type: "expression",
              label: JSON.stringify({
                graphType: "shade"
              })
            };
            return expression;
          }
        });
        const _latexAll = [
          ...graphExpressionsNormalLatex,
          ...graphExpressionsShadeLatex,
          ...graphExpressionsBaseLatex,
          ...graphExpressionsFinalLatex,
        ];
        const latexAll = _latexAll.filter(expression => {
          if (expression && isBaseExpression(expression)) {
            if (!MyCalc.existingExpressions.has(expression.latex)) {
              MyCalc.existingExpressions.add(expression.latex)
              return true
            }
            console.log('bruh')
          }
          return false
        })
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

  function fixNegative() {
    let toFix: Expression[] = [];
    const allExpressions = MyCalc.getExpressions().filter(isBaseExpression)
    const negativeab = allExpressions.filter((x) => /[ab]_{\d*\w+}=-\d+[.]{0,1}\d*/g.test(x.latex)); // Selects ellipse, hyperbola with negative a, b
    toFix = [...toFix, ...negativeab.map((expression) => {
      expression.latex.replaceAll('-', '');
      return expression;
    })];
    MyCalc.updateExpressions(toFix);
  }

  function changeCropMode(_id: string) {
    if (_id.includes('_')) {
      const graphId = _id.split('_')[0];
      const idFilter = `${graphId}_`;
      const filteredExpressions = MyCalc.getExpressions();
      const baseExpressions = filteredExpressions.filter(isBaseExpression);
      const idFilteredExpressions = baseExpressions.filter((x) => x.id.startsWith(idFilter))
      const graphExpression = filteredExpressions.find((x) => x.id.endsWith('_0'));

      if (!graphExpression) {
        throw new Error();
      } else if (!isBaseExpression(graphExpression)) {
        throw new Error("Selected item is not a BaseExpression")
      }

      const conic = createGraphObject(graphExpression);
      const { graphType } = conic;
      // 0 - default (x and y), 1 - x only, 2 - y only, 3 - no crop
      let cropType = conic.getCropType();
      cropType = (cropType + 1) % 4;
      [conic.latex] = conic.latex.split('\\left\\{');
      const addition = (cropType < 2 ? '\\left\\{x_{1ca}<x<x_{1cb}\\right\\}' : '') + (!(cropType % 2) ? '\\left\\{y_{1ca}<y<y_{1cb}\\right\\}' : '');
      conic.latex += addition.replaceAll('_{1', `_{${graphId}`);
      const xBoundary = typeFilter(idFilteredExpressions, graphType, ['x']); // x only domain
      const yBoundary = typeFilter(idFilteredExpressions, graphType, ['y']); // y only domain
      const xyPoints = typeFilter(idFilteredExpressions, graphType, ['xy']); // points
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

  function setId() {
    const baseId = Math.max(0, Math.max(...MyCalc.getExpressions()
      .filter((x) => x.id.endsWith('_0'))
      .map((x) => parseInt(x.id.split('_')[0], 10))
      .filter((x) => !Number.isNaN(x)))) + 1;

    const finalId = Math.max(0, Math.max(...MyCalc.getExpressions()
      .filter((x) => x.id.startsWith('final_'))
      .map((x) => parseInt(x.id.split('_')[1], 10))
      .filter((x) => !Number.isNaN(x)))) + 1;
    MyCalc.globalId = Math.max(baseId, finalId);
  }
  function shadeToBack() {
    const state = MyCalc.getState();
    state.expressions.list = state.expressions.list
      .filter((x) => x.id.startsWith('shade_'))
      .concat(state.expressions.list.filter((x) => !x.id.startsWith('shade_')));
    MyCalc.setState(state);
  }

  function toggleShading() {
    const baseExpressions = MyCalc.getExpressions().filter(isBaseExpression);
    const shade = baseExpressions.filter((x) => x.id.startsWith('shade_'))
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
      if (isBaseExpression(graphExpression)) {
        console.log((createGraphObject(graphExpression))
          .getRealBounds());
      }
    }
  }
  function expressionToFront(id: IdParts) {
    const state = MyCalc.getState();
    const expression = state.expressions.list
      .filter((_expression) => _expression.id === id.id);
    const multipleExpressions = state.expressions.list
      .filter((_expression) => _expression.id !== id.id);
    state.expressions.list = expression.concat(multipleExpressions);
    MyCalc.setState(state);
  }
  function keyUpHandler(e: KeyboardEvent) {
    if (MyCalc) MyCalc.updateLinkedVariables()
    MyCalc.updateVariables();
    setId();
    if (currentlyPressed.includes(e.keyCode)) {
      currentlyPressed = currentlyPressed.filter((key) => key !== e.keyCode);
    }
    if (e.ctrlKey && e.shiftKey) {
      const { key } = e;
      if (key === '<') {
        if (MyCalc.selectedExpressionId) {
          expressionToFront(getIdParts(MyCalc.selectedExpressionId));
        }
      }
      if (key === 'F') { // F - Finalize
        if (MyCalc.selectedExpressionId) {
          finalizeId(getIdParts(MyCalc.selectedExpressionId));
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
      if (keyCode === 71) {
        if (MyCalc.selectedExpressionId) {
          transformBezier(MyCalc.selectedExpressionId)
        }
      }
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
        createDefaultConic(GraphTypeIdToName[keyCode - 49]);
      } else if (keyCode === 83) { // bottom
        resetSelection();
      } else if (keyCode === 48) {
        freeze(e.shiftKey, e.ctrlKey);
      } else if (keyCode === 88) {
        if (MyCalc.selectedExpressionId) MyCalc.deleteById(MyCalc.selectedExpressionId);
      } else if (keyCode === 81) {
        if (MyCalc.selectedExpressionId) changeCropMode(MyCalc.selectedExpressionId);
      } else if (keyCode === 72) {
        if (MyCalc.selectedExpressionId) hideCropLines(getIdParts(MyCalc.selectedExpressionId));
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

  function fillInside(id: string) {
    const expression = MyCalc.getExpression(id)
    if (expression) {
      if (isBaseExpression(expression)) {
        const conic = createGraphObject(expression);
        if ([0, 4].includes(conic.graphType)) {
          conic.latex = conic.latex.replace('=', '>');
        } else if ([1, 2, 3, 5, 6].includes(conic.graphType)) {
          conic.latex = conic.latex.replace('=', '<');
        }
        MyCalc.setExpression({
          color: 'BLACK',
          hidden: false,
          type: "expression",
          id: `shade_${shadeId}`,
          latex: conic.latex,
          label: JSON.stringify({
            graphType: "shade"
          })
        });
        shadeId += 1;
      }
    }
  }

  function fillIntersection(lowerId: string, upperId: string, axis: string, options?: {useValue: boolean}) {
    const lowerObject = MyCalc.getExpression(lowerId)
    const upperObject = MyCalc.getExpression(upperId)

    if (!upperObject || !lowerObject) {
      throw new Error("This shouldn't happen");
    }

    if (!isBaseExpression(lowerObject) || !isBaseExpression(upperObject)) {
      throw new Error('bruh')
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
      const boundsObject = generateBounds(
        realMin, MyCalc.linkedVariable(-Infinity), realMax, MyCalc.linkedVariable(Infinity),
      );
      let bounds: string;
      if (options?.useValue) {
        bounds = boundsObject.value 
      } else {
        bounds = boundsObject.reference
      }

      const newExpressions: (InputBaseExpression & {fillOpacity: string})[] = [];
      const lowerConicConverted = lowerConic.convertToYRelevant();
      const upperConicConverted = upperConic.convertToYRelevant();

      for (let lowerIndex = 0; lowerIndex < lowerConicConverted.length; lowerIndex++) {
        const currLowerConic = lowerConicConverted[lowerIndex];
        for (let upperIndex = 0; upperIndex < upperConicConverted.length; upperIndex++) {
          const currUpperConic = upperConicConverted[upperIndex];
          const newExpression = `${currLowerConic}<y<${currUpperConic}${bounds}`;
          newExpressions.push({
            color: 'BLACK',
            hidden: false,
            type: "expression",
            id: `shade_${shadeId}`,
            latex: newExpression,
            fillOpacity: '1',
            label: JSON.stringify({
              graphType: "shade"
            })
          });
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
      const boundsObject = generateBounds(MyCalc.linkedVariable(-Infinity), realMin, MyCalc.linkedVariable(Infinity), realMax);
      let bounds: string;
      if (options?.useValue) {
        bounds = boundsObject.value 
      } else {
        bounds = boundsObject.reference
      }

      const newExpressions: InputBaseExpression[] = [];
      const lowerConicConverted = lowerConic.convertToXRelevant();
      const upperConicConverted = upperConic.convertToXRelevant();

      for (let lowerIndex = 0; lowerIndex < lowerConicConverted.length; lowerIndex++) {
        const currLowerConic = lowerConicConverted[lowerIndex];
        for (let upperIndex = 0; upperIndex < upperConicConverted.length; upperIndex++) {
          const currUpperConic = upperConicConverted[upperIndex];
          const newExpression = `${currLowerConic}<x<${currUpperConic}${bounds}`;
          newExpressions.push({
            color: 'BLACK',
            hidden: false,
            type: "expression",
            id: `shade_${shadeId}`,
            latex: newExpression,
            label: JSON.stringify({
              graphType: "shade"
            })
          });
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
    MyCalc.updateVariables();
    if (!shadeIdSet) {
      shadeId = getShadeId() + 1;
      shadeIdSet = true;
    }
    if (easyMode) {
      // if (easySelections.length > 4) {
      //   easySelections.pop()
      // }
      if (e.button === 0) {
        const selectedExpression = MyCalc.getSelected()
        MyCalc.selectedExpressionId = undefined
        if (selectedExpression && isBaseExpression(selectedExpression) && isGraph(selectedExpression)) {
          const point = createGraphObject(selectedExpression).getClosestEndpoint(MyCalc.pixelsToMath({
            x: e.clientX,
            y: e.clientY,
          }))
          easySelections.push({
            x: point.x.value,
            y: point.y.value,
          })
        } else {
          easySelections.push(MyCalc.pixelsToMath({ x: e.clientX, y: e.clientY }));
        }
      }
      console.log(easySelections, e.button)
      if (e.button == 1) {
        if (easySelections.length === 1) {

        } 
        if (easySelections.length === 2) {
          createLineSegment(easySelections[0], easySelections[1], MyCalc.globalId, {finalize: true})
        }
        if (easySelections.length === 4) {
          createBezier({
            p1: easySelections[0],
            p2: easySelections[1],
            p3: easySelections[2],
            p4: easySelections[3],
          },
            MyCalc.globalId
          )
          // MyCalc.regression(easySelections)
        }
        easySelections = []
      }
    } else {
      if (e.button === 1) {
        const shade = MyCalc.getExpressions().filter((expression) => expression.id.includes("shade_"))
        shade.forEach((shade) => {
          // const {xMin, xMax, yMin, yMax} = parseDomains(getDomainsFromLatex(shade.latex))
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
  
          const lowerIdParts = getIdParts(lowerId)
          const upperIdParts = getIdParts(upperId)

          if (upperId === lowerId) {
            if (lowerIdParts.isFinal) {
              unfinalize(lowerIdParts);
              lowerId = `${lowerIdParts.graphId}_0`;
            }
            const newLowerIdParts = getIdParts(lowerId)
            fillInside(lowerId);
            if (newLowerIdParts.isEditable && lowerIdParts.isFinal) finalize(newLowerIdParts);
          } else {
            if (lowerIdParts.isFinal) {
              unfinalize(lowerIdParts, {logical: true});
              lowerId = `${lowerIdParts.graphId}_0`;
            }
            if (upperIdParts.isFinal) {
              unfinalize(upperIdParts, {logical: true});
              upperId = `${upperIdParts.graphId}_0`;
            }
            const newLowerIdParts = getIdParts(lowerId)
            const newUpperIdParts = getIdParts(upperId)
            fillIntersection(lowerId, upperId, axis, {useValue: true});
            if (newLowerIdParts.isEditable && lowerIdParts.isFinal) MyCalc.removeExpressionById(lowerId);
            if (newUpperIdParts.isEditable && upperIdParts.isFinal) MyCalc.removeExpressionById(upperId);
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
    if (graphExpression && isBaseExpression(graphExpression)) {
      const colorForm = $('#colorForm');
      if (colorForm) {
        const [color, fillOpacity] = colorForm.serializeArray();
        graphExpression.color = color.value
        graphExpression.fillOpacity = fillOpacity.value
        MyCalc.updateExpression(graphExpression);
      }
    }
  }

  function changegraphType() {
    // currGraphId = (currGraphId + 1) % 7;
    currGraphName = "circle"
    const button = document.querySelector('#artist-button');
    if (button) {
      // button.innerHTML = graphAbbrev[currGraphId];
      button.innerHTML = "circle"
    }
  }

  function createConicHandler() {
    createDefaultConic(currGraphName);
  }

  const shortcutButtons = false

  const pillbox = unsafeWindow.document.querySelector('.dcg-overgraph-pillbox-elements');
  if (pillbox) {
    pillbox.insertAdjacentHTML('beforeend', '<div id="artist-button-container"><div class="dcg-tooltip-hit-area-container"><div class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings" role="button" onclick=\'toggleArtist()\' style="background:#ededed"><i class="dcg-icon-wrench" aria-hidden="true"></i></div></div><div style="display: none"></div></div>');
    pillbox.insertAdjacentHTML('beforeend', '<div id="artist-container" class="dcg-artist-view-container"></div>');
    const artistContainer = unsafeWindow.document.querySelector('#artist-container');
    if (shortcutButtons) {
      if (artistContainer) {
        artistContainer.insertAdjacentHTML('beforeend', `<div class="dcg-tooltip-hit-area-container dcg-hovered"> <div id="artist-button" class="dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings dcg-hovered" role="button" oncontextmenu="createConicHandler();return false;" onclick="changegraphType()" style="background:#ededed">${"circle" /* graphAbbrev[currGraphId] */}</div></div>`);
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
  unsafeWindow.Graph = Graph;
  unsafeWindow.changeColor = changeColor;
  unsafeWindow.changegraphType = changegraphType;
  unsafeWindow.createConicHandler = createConicHandler;
  unsafeWindow.deleteById = MyCalc.deleteById;
  unsafeWindow.toggleArtist = toggleArtist;
}

(async () => {
  while (typeof Calc === 'undefined') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  main();
})();
