import { LinkedVariable } from "../lib/lib";

export interface Conic {
  getGeneralForm(): {
    A: number,
    B: number,
    C: number,
    D: number,
    E: number,
    F: number,
  }

  getConicVariables(): {[key: string]: LinkedVariable}

  convertToStandard(): string
}