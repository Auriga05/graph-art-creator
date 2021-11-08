import { MyCalc } from "../index.user";
import { isBaseExpression, createGraphObject, typeFilter } from "../lib";
import { IdParts } from "../types";

export function hideCropLines(id: IdParts) {
  if (id.isEditable) {
    const idFilter = `${id.graphId}_`;
    const filteredExpressions = MyCalc.getExpressions();
    const baseExpressions = filteredExpressions.filter(isBaseExpression).filter((x) => x.id.startsWith(idFilter));
    const graphExpression = baseExpressions.find((x) => x.id.endsWith('_0'));

    if (!graphExpression) {
      throw new Error();
    }

    const conic = createGraphObject(graphExpression);
    const { graphType } = conic;
    const hidableBaseExpressions = typeFilter(baseExpressions, graphType, ['hide']);
    let [newExpression] = baseExpressions;
    const newState = !hidableBaseExpressions.every(expression => expression.hidden);
    const expressionsToSet = [];
    const cropType = conic.getCropType();
    const xBoundary = typeFilter(hidableBaseExpressions, graphType, ['x']); // x only domain
    const yBoundary = typeFilter(hidableBaseExpressions, graphType, ['y']); // y only domain
    const xyPoints = typeFilter(hidableBaseExpressions, graphType, ['xy']); // points
    const points = typeFilter(hidableBaseExpressions, graphType, ['point']); // points
    if (!newState) {
      for (let i = 0; i < points.length; i++) {
        const newExpression = points[i]
        newExpression.hidden = false;
        expressionsToSet.push(newExpression);
      }
      for (let j = 0; j < xBoundary.length; j++) {
        const newExpression = xBoundary[j]
        if (!newExpression.hidden && (cropType % 2 === 1)) {
          newExpression.hidden = false;
          expressionsToSet.push(newExpression);
        }
      }
      for (let j = 0; j < yBoundary.length; j++) {
        const newExpression = yBoundary[j]
        if (!newExpression.hidden && (cropType > 1)) {
          newExpression.hidden = false;
          expressionsToSet.push(newExpression);
        }
      }
      for (let j = 0; j < xyPoints.length; j++) {
        const newExpression = xyPoints[j]
        if (!newExpression.hidden && !(cropType === 3)) {
          newExpression.hidden = false;
          expressionsToSet.push(newExpression);
        }
      }
    } else {
      for (let i = 0; i < points.length; i++) {
        const newExpression = points[i]
        newExpression.hidden = true;
        expressionsToSet.push(newExpression);
      }
      for (let i = 0; i < hidableBaseExpressions.length; i++) {
        const newBaseExpression = hidableBaseExpressions[i]
        newExpression = newBaseExpression;
        newExpression.hidden = true;
        expressionsToSet.push(newExpression);
      }
    }
    MyCalc.updateExpressions(expressionsToSet);
  } else {
    throw Error("Tried hiding crop lines from a non-editable expression")
  }
}