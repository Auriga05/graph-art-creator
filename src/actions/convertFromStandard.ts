import { GraphingOptions } from './../types';
import { createGraphWithBounds } from "../index.user";
import { getDomainsFromLatex, parseDomains, transformVariables } from "../lib";

export const regex = [
  /\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\+\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}=([-+]?\d+\.?\d*)/g,
  /\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}=([-+]?\d+\.?\d*)\\left\(x([-+]?\d+\.?\d*)\\right\)/g,
  /\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}=([-+]?\d+\.?\d*)\\left\(y([-+]?\d+\.?\d*)\\right\)/g,
  /\\frac\{\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}\+\\frac\{\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}=1/g,
  /\\frac\{\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}-\\frac\{\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}=1/g,
  /\\frac\{\\left\(y([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}-\\frac\{\\left\(x([-+]?\d+\.?\d*)\\right\)\^\{2\}\}\{([-+]?\d+\.?\d*)\}=1/g,
  /y=([-+]?\d+\.?\d*)x([-+]?\d+\.?\d*)\\left\\{([-+]?\d+\.?\d*)<x<([-+]?\d+\.?\d*)\\right\\}/g,
];

export function getGraphTypeFromStandard(latex: string) {
  const graphType = regex.findIndex((pattern) => pattern.test(latex));
  return graphType
}

export function convertFromStandard(latex: string, graphId: number, options?: GraphingOptions) {
  const graphType = getGraphTypeFromStandard(latex)
  if (graphType === -1) {
    throw Error(`Failed converting expression '${latex}' to standard form`)
  } else {
    const currRegex = regex[graphType];
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