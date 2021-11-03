import { LinkedVariable } from "../lib";

export interface Conic {
  getGeneralForm(): {
    A: number,
    C: number,
    D: number,
    E: number,
    F: number,
  }

  getConicVariables(): {[key: string]: LinkedVariable}

  convertToStandard(): string
}