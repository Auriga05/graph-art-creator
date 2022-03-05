import { createGraphWithBounds } from "../index.user";
import { getDomainsFromLatex, parseDomains, transformVariables } from "../lib/lib";
import { GraphingOptions, GraphTypeIdToName, GraphTypeNames } from "../types/types";

export const regex = [
  /\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\+\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}=([-+]?\d+\.?\d*)/g,
  /\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}=([-+]?\d+\.?\d*)\\left\(x([-+]?\d+\.?\d*)\\right\)/g,
  /\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}=([-+]?\d+\.?\d*)\\left\(y([-+]?\d+\.?\d*)\\right\)/g,
  /\\frac\{\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}\+\\frac\{\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}=1/g,
  /\\frac\{\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}-\\frac\{\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}=1/g,
  /\\frac\{\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}-\\frac\{\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}=1/g,
  /y=([-+]?\d+\.?\d*)x([-+]?\d+\.?\d*)\\left\\{([-+]?\d+\.?\d*)<x<([-+]?\d+\.?\d*)\\right\\}/g,
];

export const regexByGraphName: {[key in Exclude<GraphTypeNames, "bezier">]: RegExp} = {
  "circle": /\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\+\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}=([-+]?\d+\.?\d*)/g,
  "horizontal_parabola": /\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}=([-+]?\d+\.?\d*)\\left\(x([-+]?\d+\.?\d*)\\right\)/g,
  "vertical_parabola": /\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}=([-+]?\d+\.?\d*)\\left\(y([-+]?\d+\.?\d*)\\right\)/g,
  "ellipse": /\\frac\{\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}\+\\frac\{\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}=1/g,
  "horizontal_hyperbola": /\\frac\{\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}-\\frac\{\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}=1/g,
  "vertical_hyperbola": /\\frac\{\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}-\\frac\{\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}=1/g,
  "line_segment": /y=([-+]?\d+\.?\d*)x([-+]?\d+\.?\d*)\\left\\{([-+]?\d+\.?\d*)<x<([-+]?\d+\.?\d*)\\right\\}/g,
};

export function getGraphTypeFromStandard(latex: string) {
  const graphType = regex.findIndex((pattern) => pattern.test(latex));
  return graphType
}

export function getGraphTypeNameFromStandard(latex: string) {
  const graphType = regex.findIndex((pattern) => pattern.test(latex));
  if (graphType !== -1) {
    return GraphTypeIdToName[graphType] as Exclude<GraphTypeNames, "bezier">
  }
}

export function convertFromStandard(latex: string, graphId: number, options?: GraphingOptions) {
  const graphType = getGraphTypeNameFromStandard(latex)
  if (!graphType) {
    throw Error(`Failed converting expression '${latex}' to standard form`)
  } else {
    const currRegex = regexByGraphName[graphType];
    const match = latex.match(currRegex);
    if (match) {
      const variables = [...match[0].matchAll(currRegex)][0].slice(1)
        .map((x) => parseFloat(x));
      const domains = getDomainsFromLatex(latex);
      if (domains) {
        const bounds = parseDomains(domains);
        createGraphWithBounds(graphId, graphType, transformVariables(graphType, variables), bounds, options);
      }
    }
  }
}