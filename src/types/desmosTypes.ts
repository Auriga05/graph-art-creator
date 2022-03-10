import { BaseExpression, TableExpression, Expression, InputExpression } from "./types";

type ExpressionAnalysis = BaseExpressionAnalysis | ValueExpressionAnalysis

type BaseExpressionAnalysis = {
  isGraphable: boolean
  isError: boolean
  errorMessage: string | undefined
}

type ValueExpressionAnalysis = BaseExpressionAnalysis & {
  evaluation: { type: "Number"; value: number };
  evaluationDisplayed: boolean
}

export function isValueAnalysis(analysis: ExpressionAnalysis): analysis is ValueExpressionAnalysis {
  return (analysis as ValueExpressionAnalysis).evaluation !== undefined
}
export interface ControllerType {
  getItemModel: (_id: string) => BaseExpression | TableExpression;
  getItemCount: () => number;
  dispatch: (args: { [key: string]: any; type: string }) => void;
}

export type HelperExpression = {
  observe: (name: string, callback: () => any) => void
  unobserveAll: () => void
}
export interface CalcType {
  getExpressions: () => Expression[];
  expressionAnalysis: {
    [key: string]: ExpressionAnalysis;
  };
  selectedExpressionId?: string;
  removeExpressions: (expressions: Partial<InputExpression>[]) => void;
  removeExpression: (expression: Expression) => void;
  setExpressions: (expressions: Partial<InputExpression>[]) => void;
  setExpression: (expression: Partial<InputExpression>) => void;
  pixelsToMath: (point: { x: number; y: number }) => { x: number; y: number };
  HelperExpression: (expression: Partial<Expression>) => HelperExpression
  graphpaperBounds: {
    mathCoordinates: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
  };
  setState: (state: State) => void;
  getState: () => State;
  removeSelected: () => void;
  controller: ControllerType;
}

export interface State {
  expressions: {
    list: Expression[];
  };
}
