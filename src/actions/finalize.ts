import { EditableIdParts, FinalIdParts, IdParts, InvalidIdParts, GraphingOptions } from './../types';
import { MyCalc, createGraphWithBounds } from "../index.user";
import { createGraphObject, getDomainsFromLatex, isBaseExpression, parseDomains, substituteFromId, substituteToAll, usesVariable } from "../lib";
import { convertFromStandard } from "./convertFromStandard";

function unfinalizeConvert(id: InvalidIdParts) {
  const regex = /y=([-+]?(?:\d+\.?\d*)?)\\sqrt\{([-+]?\d+\.?\d*)\+\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}([-+]?\d+\.?\d*)/g;
  const expression = MyCalc.getExpression(id.id);
  if (expression && isBaseExpression(expression)) {
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
          createGraphWithBounds(MyCalc.globalId, 4, { h, a: Math.sqrt(Math.abs(b2)), k, b: Math.sqrt(Math.abs(a2)) }, { xMin, xMax, yMin, yMax });
        } else if (b > 0) { // vertical hyperbola
          createGraphWithBounds(MyCalc.globalId, 5, { h, a: Math.sqrt(Math.abs(a2)), k, b: Math.sqrt(Math.abs(b2)) }, { xMin, xMax, yMin, yMax });
        }
      } else if (a > 0) { // up
        const yMin = Math.max(k, _yMin);
        const yMax = Math.min(Infinity, _yMax);
        if (b < 0) { // horizontal hyperbola
          createGraphWithBounds(MyCalc.globalId, 4, { h, a: Math.sqrt(Math.abs(b2)), k, b: Math.sqrt(Math.abs(a2)) }, { xMin, xMax, yMin, yMax });
        } else if (b > 0) { // vertical parabola
          createGraphWithBounds(MyCalc.globalId, 5, { h, a: Math.sqrt(Math.abs(a2)), k, b: Math.sqrt(Math.abs(b2)) }, { xMin, xMax, yMin, yMax });
        }
      }
    }
  }
}

export function unfinalize(id: FinalIdParts, options?: GraphingOptions) {
  const graphExpression = MyCalc.getExpression(id.id);
  if (graphExpression && isBaseExpression(graphExpression)) {
    convertFromStandard(graphExpression.latex, id.graphId, {...options, set: true});
    if (!options?.logical) {
      MyCalc.removeExpressions([graphExpression]);
    }
  }
}

export function finalize(id: EditableIdParts) {
  if (MyCalc.isLogical(id.id)) {
    const expressionList = MyCalc.dependsOn(id.graphId).map((_expression) => {
      const expression = _expression
      expression.latex = substituteFromId(expression.latex, id.graphId)
      return expression
    })
    MyCalc.updateExpressions(expressionList);
    MyCalc.removeExpressionById(id.id);
  } else {
    const sameIdItem = MyCalc.getExpression(`final_${id.graphId}`)
    if (sameIdItem) {
      // throw Error('Same id for some reason')
    }
    const idFilter = `${id.graphId}_`;
    const filteredExpressions = MyCalc.getExpressions().filter((expression) => expression.id.startsWith(idFilter));
    const baseExpression = MyCalc.getExpression(`${id.graphId}_0`);

    if (!baseExpression) {
      throw Error(`Cannot find expression with id ${id.graphId}_0`)
    }
    if (baseExpression && isBaseExpression(baseExpression)) {
      const conic = createGraphObject(baseExpression);

      MyCalc.removeExpressions(filteredExpressions);
      const allExpressions = MyCalc.getExpressions();
      const expressionList = substituteToAll(allExpressions, conic.graphId)
      MyCalc.updateExpressions(expressionList);

      conic.latex = conic.convertToStandard();
      conic.id = `final_${conic.graphId}`
      MyCalc.setExpression(conic);
      MyCalc.globalId += 1
    }
  }
}

export function finalizeId(id: IdParts) {
  if (id.isFinal) {
    unfinalize(id);
  } else if (id.isEditable) {
    finalize(id);
  } else if (id.isInvalid) {
    unfinalizeConvert(id);
  }
}