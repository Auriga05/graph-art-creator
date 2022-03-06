import { finalizeId, unfinalize, finalize } from "./actions/finalize";
import { hideCropLines } from "./actions/hideCropLines";
import { Graph } from "./classes/Graph";
import { MyCalcClass } from "./classes/MyCalc";
import { LinkedVariable, setVariable, generateBounds, createGraphObject, doesIntersect, functionRegex, toId, simplify, createConic, isBaseExpression, substituteParenthesis, typeFilter, getIdParts, transformBezier, createLineSegment, createBezier, getValue } from "./lib/lib";
import { CalcType } from "./types/desmosTypes";
import { Expression, NumberBounds, Bounds, GraphingOptions, InputBaseExpression, BaseExpression, IdParts, GraphTypeIdToName, GraphTypeNames, GraphTypesByName, Value } from "./types/types";

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
  let xMin = _bounds.xMin instanceof LinkedVariable ? getValue(_bounds.xMin) : _bounds.xMin
  let yMin = _bounds.yMin instanceof LinkedVariable ? getValue(_bounds.yMin) : _bounds.yMin
  let xMax = _bounds.xMax instanceof LinkedVariable ? getValue(_bounds.xMax) : _bounds.xMax
  let yMax = _bounds.yMax instanceof LinkedVariable ? getValue(_bounds.yMax) : _bounds.yMax
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
        xMin = getValue(bounds.xMin) - 2;
      }
      if (!Number.isFinite(yMin)) {
        yMin = getValue(bounds.yMin) - 2;
      }
      if (!Number.isFinite(xMax)) {
        xMax = getValue(bounds.xMax) + 2;
      }
      if (!Number.isFinite(yMax)) {
        yMax = getValue(bounds.yMax) + 2;
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
            xMin = getValue(bounds.xMin) - 2;
          }
          if (!Number.isFinite(yMin)) {
            yMin = getValue(bounds.yMin) - 2;
          }
          if (!Number.isFinite(xMax)) {
            xMax = getValue(bounds.xMax) + 2;
          }
          if (!Number.isFinite(yMax)) {
            yMax = getValue(bounds.yMax) + 2;
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

class App {
  MyCalc = new MyCalcClass(Calc);
  selections: SelectionObject[] = [];
  easySelections: {x: number, y: number}[] = [];
  graphAbbrev = ['C', 'HP', 'VP', 'E', 'HH', 'VH', 'LS'];
  easyMode = false;
  lastSelectedId = '';
  currentlyPressed: number[] = [];
  shadeIdSet = false;
  altTime = 0;
  ctrlTime = 0;
  expressionPos = { x: 0, y: 0 };
  shadeId = 1;
  currGraphName: GraphTypeNames = "circle";
  centerPoint = {
    x: Infinity,
    y: Infinity,
  };

  lastCenterPoint = {
    x: Infinity,
    y: Infinity,
  };
  shadingData: {
    lastUpperBoundary: { x: Value, y: Value }
    lastLowerBoundary: { x: Value, y: Value }
  } = {
    lastUpperBoundary: {
      x: -Infinity,
      y: -Infinity,
    },
    lastLowerBoundary: {
      x: Infinity,
      y: Infinity,
    },
  };
  constructor() {
    document.addEventListener('keydown', this.keyDownHandler, false);
    document.addEventListener('keyup', this.keyUpHandler, false);
    document.addEventListener('pointerup', this.mouseUpHandler, false);

    this.drawHtml(false)
  
    unsafeWindow.MyCalc = MyCalc;
    unsafeWindow.Graph = Graph;
    unsafeWindow.changeColor = this.changeColor;
    unsafeWindow.changegraphType = this.changegraphType;
    unsafeWindow.createConicHandler = this.createConicHandler;
    unsafeWindow.deleteById = MyCalc.deleteById;
    unsafeWindow.toggleArtist = this.toggleArtist;
  }
  drawHtml(shortcutButtons: boolean) {
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
  }
  getShadeId() {
    return Math.max(...MyCalc
      .getExpressions()
      .filter((x) => x.id.startsWith('shade_'))
      .filter((x) => !x.id.includes('folder'))
      .map((x) => parseInt(x.id.split('_')[1], 10)), 0);
  }


  createDefaultConic(graphType: GraphTypeNames) {
    const Class = GraphTypesByName[graphType]
    const coordinates = MyCalc.graphpaperBounds.mathCoordinates;
    this.expressionPos = { x: parseFloat(((coordinates.left + coordinates.right) / 2).toFixed(MyCalc.precision)), y: parseFloat(((coordinates.top + coordinates.bottom) / 2).toFixed(MyCalc.precision)) };
    const verticalSize = (coordinates.top - coordinates.bottom);
    const horizontalSize = (coordinates.right - coordinates.left);
    const size = Math.min(verticalSize, horizontalSize);
    Class.setDefault(MyCalc.globalId, this.expressionPos, size)
    if (Class.hasCenter) {
      setVariable(`h_{${MyCalc.globalId}}`, this.expressionPos.x);
      setVariable(`k_{${MyCalc.globalId}}`, this.expressionPos.y);
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


  resetSelection() {
    this.shadingData.lastUpperBoundary = { x: -Infinity, y: -Infinity };
    this.shadingData.lastLowerBoundary = { x: Infinity, y: Infinity };
  }

  fixNegative() {
    let toFix: Expression[] = [];
    const allExpressions = MyCalc.getExpressions().filter(isBaseExpression)
    const negativeab = allExpressions.filter((x) => /[ab]_{\d*\w+}=-\d+[.]{0,1}\d*/g.test(x.latex)); // Selects ellipse, hyperbola with negative a, b
    toFix = [...toFix, ...negativeab.map((expression) => {
      expression.latex.replaceAll('-', '');
      return expression;
    })];
    MyCalc.updateExpressions(toFix);
  }

  changeCropMode(_id: string) {
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

  setId() {
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
  shadeToBack() {
    const state = MyCalc.getState();
    state.expressions.list = state.expressions.list
      .filter((x) => x.id.startsWith('shade_'))
      .concat(state.expressions.list.filter((x) => !x.id.startsWith('shade_')));
    MyCalc.setState(state);
  }

  toggleShading() {
    const baseExpressions = MyCalc.getExpressions().filter(isBaseExpression);
    const shade = baseExpressions.filter((x) => x.id.startsWith('shade_'))
    const newState = !shade[0].hidden;
    MyCalc.updateExpressions(shade.map((_x) => {
      const x = _x;
      x.hidden = newState;
      return x;
    }));
  }
  getBoundsById(_id: string) {
    const graphExpression = MyCalc.getExpression(_id)
    if (graphExpression) {
      if (isBaseExpression(graphExpression)) {
        console.log((createGraphObject(graphExpression))
          .getRealBounds());
      }
    }
  }
  expressionToFront(id: IdParts) {
    const state = MyCalc.getState();
    const expression = state.expressions.list
      .filter((_expression) => _expression.id === id.id);
    const multipleExpressions = state.expressions.list
      .filter((_expression) => _expression.id !== id.id);
    state.expressions.list = expression.concat(multipleExpressions);
    MyCalc.setState(state);
  }
  keyUpHandler(e: KeyboardEvent) {
    if (MyCalc) MyCalc.updateLinkedVariables()
    MyCalc.updateVariables();
    this.setId();
    if (this.currentlyPressed.includes(e.keyCode)) {
      this.currentlyPressed = this.currentlyPressed.filter((key) => key !== e.keyCode);
    }
    if (e.ctrlKey && e.shiftKey) {
      const { key } = e;
      if (key === '<') {
        if (MyCalc.selectedExpressionId) {
          this.expressionToFront(getIdParts(MyCalc.selectedExpressionId));
        }
      }
      if (key === 'F') { // F - Finalize
        if (MyCalc.selectedExpressionId) {
          finalizeId(getIdParts(MyCalc.selectedExpressionId));
        }
      }
    }
    if (e.key === 'Control') {
      this.ctrlTime = Date.now();
    }
    if (e.key === 'Alt') {
      this.altTime = Date.now();
    }
    if (e.ctrlKey || (Date.now() - this.ctrlTime) < 100) {
      this.ctrlTime = Date.now();
      const { key } = e;
    }
    if (e.altKey || (Date.now() - this.altTime) < 100) {
      this.altTime = Date.now();
      const { keyCode } = e;
      if (keyCode === 71) {
        if (MyCalc.selectedExpressionId) {
          transformBezier(MyCalc.selectedExpressionId)
        }
      }
      if (keyCode === 87) {
        const selection = this.selections.pop();
      }
      if (keyCode === 77) {
        if (MyCalc.selectedExpressionId) {
          this.getBoundsById(MyCalc.selectedExpressionId);
        }
      }
      if (keyCode === 219) {
        this.fixNegative();
      }
      if (keyCode === 189) {
        this.shadeToBack();
      } else if (keyCode === 187) {
        this.toggleShading();
      } else if ((keyCode >= 49) && (keyCode <= 56)) {
        this.createDefaultConic(GraphTypeIdToName[keyCode - 49]);
      } else if (keyCode === 83) { // bottom
        this.resetSelection();
      } else if (keyCode === 48) {
        this.freeze(e.shiftKey, e.ctrlKey);
      } else if (keyCode === 88) {
        if (MyCalc.selectedExpressionId) MyCalc.deleteById(MyCalc.selectedExpressionId);
      } else if (keyCode === 81) {
        if (MyCalc.selectedExpressionId) this.changeCropMode(MyCalc.selectedExpressionId);
      } else if (keyCode === 72) {
        if (MyCalc.selectedExpressionId) hideCropLines(getIdParts(MyCalc.selectedExpressionId));
      } else if (keyCode === 70) {
        this.easyMode = !this.easyMode;
      }
    }
    e.preventDefault();
  }

  keyDownHandler(e: KeyboardEvent) {
    if (MyCalc) MyCalc.updateLinkedVariables()
    if (e.altKey) {
      if (!this.currentlyPressed.includes(e.keyCode)) {
        this.currentlyPressed.push(e.keyCode);
      }
    }
  }

  freeze(force: boolean, append?: boolean) {
    let newId = 1;
    const numExpressions = MyCalc.getItemCount()    
    if (append) {
      const expressionsString = localStorage.getItem('expressions')
      if (expressionsString) {
        const expressions: Expression[] = JSON.parse(expressionsString);
        let newId = MyCalc.globalId
        let newShadeId = this.shadeId
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
        this.shadeId = newShadeId
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

  fillInside(id: string) {
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
          id: `shade_${this.shadeId}`,
          latex: conic.latex,
          label: JSON.stringify({
            graphType: "shade"
          })
        });
        this.shadeId += 1;
      }
    }
  }

  fillIntersection(lowerId: string, upperId: string, axis: string, options?: {useValue: boolean}) {
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
      let realMin = getValue(lowerBounds.xMin) < getValue(upperBounds.xMin)
        ? upperBounds.xMin : lowerBounds.xMin;
      let realMax = getValue(lowerBounds.xMax) > getValue(upperBounds.xMax)
        ? upperBounds.xMax : lowerBounds.xMax;

      if (Number.isFinite(this.lastCenterPoint.x)) {
        if (getValue(this.shadingData.lastUpperBoundary.y) > getValue(realMin) && this.lastCenterPoint.x < this.centerPoint.x) { // To right
          realMin = this.shadingData.lastUpperBoundary.y;
        }
        if (getValue(this.shadingData.lastLowerBoundary.y) < getValue(realMax) && this.lastCenterPoint.x > this.centerPoint.x) {
          realMax = this.shadingData.lastLowerBoundary.y;
        }
      }

      this.shadingData.lastUpperBoundary.y = realMax;
      this.shadingData.lastLowerBoundary.y = realMin;
      const boundsObject = generateBounds(
        realMin, -Infinity, realMax, Infinity,
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
            id: `shade_${this.shadeId}`,
            latex: newExpression,
            fillOpacity: '1',
            label: JSON.stringify({
              graphType: "shade"
            })
          });
          this.shadeId += 1;
        }
      }
      MyCalc.setExpressions(newExpressions);
    } else if (axis === 'x') {
      let realMin: Value = getValue(lowerBounds.yMin) < getValue(upperBounds.yMin)
        ? upperBounds.yMin : lowerBounds.yMin;
      let realMax: Value = getValue(lowerBounds.yMax) > getValue(upperBounds.yMax)
        ? upperBounds.yMax : lowerBounds.yMax;

      if (Number.isFinite(this.lastCenterPoint.y)) {
        if (getValue(this.shadingData.lastUpperBoundary.x) > getValue(realMin) && this.lastCenterPoint.y < this.centerPoint.y) {
          realMin = this.shadingData.lastUpperBoundary.x;
        }
        if (getValue(this.shadingData.lastLowerBoundary.x) < getValue(realMax) && this.lastCenterPoint.y > this.centerPoint.y) {
          realMax = this.shadingData.lastLowerBoundary.x;
        }
      }

      this.shadingData.lastUpperBoundary.x = realMax;
      this.shadingData.lastLowerBoundary.x = realMin;
      const boundsObject = generateBounds(-Infinity, realMin, Infinity, realMax);
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
            id: `shade_${this.shadeId}`,
            latex: newExpression,
            label: JSON.stringify({
              graphType: "shade"
            })
          });
          this.shadeId += 1;
        }
      }
      MyCalc.setExpressions(newExpressions);
    }
  }
  mouseUpHandler(e: PointerEvent) {
    if (MyCalc) MyCalc.updateLinkedVariables()
    this.setId();
    if (MyCalc.selectedExpressionId) {
      this.lastSelectedId = MyCalc.selectedExpressionId;
    }
    MyCalc.updateVariables();
    if (!this.shadeIdSet) {
      this.shadeId = this.getShadeId() + 1;
      this.shadeIdSet = true;
    }
    if (this.easyMode) {
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
          this.easySelections.push({
            x: getValue(point.x),
            y: getValue(point.y),
          })
        } else {
          this.easySelections.push(MyCalc.pixelsToMath({ x: e.clientX, y: e.clientY }));
        }
      }
      console.log(this.easySelections, e.button)
      if (e.button == 1) {
        if (this.easySelections.length === 1) {

        } 
        if (this.easySelections.length === 2) {
          createLineSegment(this.easySelections[0], this.easySelections[1], MyCalc.globalId, {finalize: true})
        }
        if (this.easySelections.length === 4) {
          createBezier({
            p1: this.easySelections[0],
            p2: this.easySelections[1],
            p3: this.easySelections[2],
            p4: this.easySelections[3],
          },
            MyCalc.globalId
          )
          // MyCalc.regression(easySelections)
        }
        this.easySelections = []
      }
    } else {
      if (e.button === 1) {
        const shade = MyCalc.getExpressions().filter((expression) => expression.id.includes("shade_"))
        shade.forEach((shade) => {
          // const {xMin, xMax, yMin, yMax} = parseDomains(getDomainsFromLatex(shade.latex))
        })
      }
      if (this.currentlyPressed.includes(65)) {
        const selected = MyCalc.getSelected();
        if (selected && isGraph(selected)) {
          this.selections.push({ id: selected.id, pos: MyCalc.pixelsToMath({ x: e.clientX, y: e.clientY }) });
        }
        if (this.selections.length >= 2) {
          const lowerSelection = this.selections.shift();
          const upperSelection = this.selections.shift();

          if (!upperSelection || !lowerSelection) {
            throw new Error("This shouldn't happen");
          }

          this.centerPoint = {
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
            this.fillInside(lowerId);
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
            this.fillIntersection(lowerId, upperId, axis, {useValue: true});
            if (newLowerIdParts.isEditable && lowerIdParts.isFinal) MyCalc.removeExpressionById(lowerId);
            if (newUpperIdParts.isEditable && upperIdParts.isFinal) MyCalc.removeExpressionById(upperId);
          }
          this.lastCenterPoint = this.centerPoint;
        }
      }
    }
  }

  toggleArtist() {
    const x: HTMLElement = document.querySelector('#artist') as HTMLElement;
    const y: HTMLElement = document.querySelector('#artist-container') as HTMLElement;

    if (x) x.style.display = x.style.display === 'none' ? 'block' : 'none';
    if (y) y.style.display = y.style.display === 'none' ? 'block' : 'none';
  }

  changeColor() {
    const graphExpression = MyCalc.getExpression(this.lastSelectedId);
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

  changegraphType() {
    // currGraphId = (currGraphId + 1) % 7;
    this.currGraphName = "circle"
    const button = document.querySelector('#artist-button');
    if (button) {
      // button.innerHTML = graphAbbrev[currGraphId];
      button.innerHTML = "circle"
    }
  }

  createConicHandler() {
    this.createDefaultConic(this.currGraphName);
  }
}

(async () => {
  while (typeof Calc === 'undefined') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  const app = new App();
})();
