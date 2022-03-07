import { Graph } from "../classes/Graph";
import { Circle } from "../graphs/Circle";
import { Ellipse } from "../graphs/Ellipse";

interface TableColumnMin {
  hidden: boolean;
  id: string;
  latex: string;
  values: string[];
}

interface TableColumn extends TableColumnMin {
  color: string;
  dragMode: "NONE" | "X" | "Y" | "XY";
  lineOpacity: string;
  lineStyle: string;
  lineWidth: string;
  lines: boolean;
  pointOpacity: string;
  pointSize: string;
  pointStyle: "POINT" | "OPEN" | "CROSS";
}

export interface TableExpression {
  id: string;
  type: "table";
  columns: Partial<TableColumn>[];
}

export interface MinBaseExpression {
  id: string;
  latex: string;
  type: "expression";
}

export interface InputBaseExpression extends MinBaseExpression {
  color: string;
  hidden: boolean;
  label: string;
}

export interface BaseExpression extends InputBaseExpression {
  fillOpacity: string;
  label: string;
}

export type PartialInputBaseExpression = Partial<{
  color: string;
  hidden: boolean;
  label: string;
}> & MinBaseExpression

export type Expression = TableExpression | PartialInputBaseExpression;

// export interface Expression {
//   [key: string]: any;
//   fillOpacity ?: string
//   color: string
//   hidden: boolean
//   id: string
//   latex: string
//   type: string
// }

export interface NumberBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface LatexExpression {
  latex: string;
  types: string[];
  name?: string;
}

export interface GeneralConicVariables {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  F: number;
}

export type InvalidIdParts = {
  id: string;
  isFinal: false;
  isShade: false;
  isEditable: false;
  isInvalid: true;
};

export type FinalIdParts = {
  id: string;
  isFinal: true;
  isShade: false;
  isEditable: false;
  isInvalid: false;
  graphId: number;
};

export type ShadeIdParts = {
  id: string;
  isFinal: false;
  isShade: true;
  isEditable: false;
  isInvalid: false;
  graphId: number;
};

export type EditableIdParts = {
  id: string;
  isFinal: false;
  isShade: false;
  isEditable: true;
  isInvalid: false;
  graphId: number;
  editIndex: number;
};

export type IdParts =
  | InvalidIdParts
  | FinalIdParts
  | ShadeIdParts
  | EditableIdParts;

export type GraphingOptions = {
  logical?: boolean;
  finalize?: boolean;
  hideAll?: boolean;
  hideCropLines?: boolean;
  hidePoints?: boolean;
  hideHandles?: boolean;
  update?: boolean;
  set?: boolean;
};

const GraphTypesClass = [Circle, Ellipse]

export const GraphTypes = Object.fromEntries(GraphTypesClass.map(graphType => [graphType.graphType, graphType]))
export type GraphTypeName = typeof GraphTypesClass[number]["graphType"]

export type KeyValuePair<T, S> = {
  key: T
  value: S
}
