import { BaseExpression, Expression, TableExpression } from "./types";

interface ExpressionAnalysis { evaluation ? : { type: string
  value: number
}
}
export interface ControllerType {
  getItemModel: (_id: string) => BaseExpression | TableExpression
  getItemCount: () => number
  dispatch: (args: {
    [key: string]: any,
    type: string,
  }) => void
}
export interface CalcType { getExpressions: () => Expression[]
  expressionAnalysis: {
    [key: string]: ExpressionAnalysis
  }
  selectedExpressionId: string
  removeExpressions: (expressions: Partial<Expression>[]) => void
  removeExpression: (expression: Expression) => void
  setExpressions: (expressions: Partial<Expression>[]) => void
  setExpression: (expression: Partial<Expression>) => void
  pixelsToMath: (point: {x: number, y: number}) => {x: number, y: number}
  graphpaperBounds: { mathCoordinates: { left: number
        right: number
        top: number
        bottom: number
      }
    }, setState: (state: State) => void
  getState: () => State
  removeSelected: () => void
  controller: ControllerType
}

export interface State {
  expressions: {
    list: Expression[]
  }
}