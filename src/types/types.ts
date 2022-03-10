import { Bezier } from "../graphs/Bezier";
import { EllipseOrHyperbola } from "../graphs/EllipseOrHyperbola";

interface TableColumnInput {
  hidden: boolean;
  id: string;
  latex: string;
  values: string[];
}

interface TableColumn {
  hidden: boolean;
  id: string;
  latex: string;
  values: string[];
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

export interface TableExpressionInput {
  id: string;
  type: "table";
  columns: TableColumnInput[];
}

export interface TableExpression {
  id: string;
  type: "table";
  columns: TableColumn[];
}

export interface InputTableExpression {
  id?: string;
  type: "table";
  columns: TableColumnInput[];
}
export interface InputBaseExpression {
  id?: string;
  latex: string;
  type: "expression";
  color?: string;
  hidden?: boolean;
  label?: string;
}

export interface BaseExpression extends InputBaseExpression {
  fillOpacity: string;
  label: string;
}

export type Expression = TableExpression | BaseExpression;

export type InputExpression = InputTableExpression | InputBaseExpression;

export type SaveExpressionType = {
	id: number
  graphType: GraphTypeName
	focused: boolean
	shown: boolean
	cropVariables?: {
		minX: number,
		minY: number,
		maxX: number,
		maxY: number,
	},
	variables: {
		[key: string]: number
	}
}

export type SaveType = {
	graphs: SaveExpressionType[],
	variables: { key: string, value: number }[],
	lastId: number,
	points: InputExpression[]
}
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

const GraphTypesClass = [EllipseOrHyperbola, Bezier]

export const GraphTypes = Object.fromEntries(GraphTypesClass.map(graphType => [graphType.graphType, graphType]))
export type GraphTypeName = typeof GraphTypesClass[number]["graphType"]

export type KeyValuePair<T, S> = {
  key: T
  value: S
}
