import { GraphTypes, LatexExpression } from './lib'

export const defaultExpressionFormat: LatexExpression[] = [
  { latex: '\\left(x_{1cb},y_{1ca}+\\left(y_{1cb}-y_{1ca}\\right)t\\right)', types: ['segment', 'delete', 'hide', 'y'] },
  { latex: '\\left(x_{1ca},y_{1ca}+\\left(y_{1cb}-y_{1ca}\\right)t\\right)', types: ['segment', 'delete', 'hide', 'y'] },
  { latex: '\\left(x_{1ca}+\\left(x_{1cb}-x_{1ca}\\right)t,y_{1ca}\\right)', types: ['segment', 'delete', 'hide', 'x'] },
  { latex: '\\left(x_{1ca}+\\left(x_{1cb}-x_{1ca}\\right)t,y_{1cb}\\right)', types: ['segment', 'delete', 'hide', 'x'] },
  { latex: '\\left(x_{1cam}+\\operatorname{sgn}(h_{1})\\operatorname{abs}(h_{1}),y_{1cam}+\\operatorname{sgn}(k_{1})\\operatorname{abs}(k_{1})\\right)', types: ['point', 'delete', 'hide', 'xy'] },
  { latex: '\\left(x_{1cbm}+\\operatorname{sgn}(h_{1})\\operatorname{abs}(h_{1}),y_{1cbm}+\\operatorname{sgn}(k_{1})\\operatorname{abs}(k_{1})\\right)', types: ['point', 'delete', 'hide', 'xy'] },
  { latex: 'x_{1ca}=x_{1cam}+h_{1}', types: ['helper_var', 'delete'] },
  { latex: 'y_{1ca}=y_{1cam}+k_{1}', types: ['helper_var', 'delete'] },
  { latex: 'x_{1cb}=x_{1cbm}+h_{1}', types: ['helper_var', 'delete'] },
  { latex: 'y_{1cb}=y_{1cbm}+k_{1}', types: ['helper_var', 'delete'] },
  { latex: 'x_{1cam}=0', types: ['var', 'delete'] },
  { latex: 'y_{1cam}=0', types: ['var', 'delete'] },
  { latex: 'x_{1cbm}=0', types: ['var', 'delete'] },
  { latex: 'y_{1cbm}=0', types: ['var', 'delete'] },
];

export const yExpressions = [
  ['k_{1}-\\sqrt{r_{1}^{2}-\\left(x-h_{1}\\right)^{2}}', 'k_{1}+\\sqrt{r_{1}^{2}-\\left(x-h_{1}\\right)^{2}}'],
  ['k_{1}-\\sqrt{4c_{1}\\left(x-h_{1}\\right)}', 'k_{1}+\\sqrt{4c_{1}\\left(x-h_{1}\\right)}'],
  ['k_{1}+\\frac{\\left(x-h_{1}\\right)^{2}}{4c_{1}}'],
  ['k_{1}-\\frac{b_{1}}{a_{1}}\\sqrt{a_{1}^{2}-\\left(x-h_{1}\\right)^{2}}', 'k_{1}+\\frac{b_{1}}{a_{1}}\\sqrt{a_{1}^{2}-\\left(x-h_{1}\\right)^{2}}'],
  ['k_{1}-\\frac{b_{1}}{a_{1}}\\sqrt{\\left(x-h_{1}\\right)^{2}-a_{1}^{2}}', 'k_{1}+\\frac{b_{1}}{a_{1}}\\sqrt{\\left(x-h_{1}\\right)^{2}-a_{1}^{2}}'],
  ['k_{1}-\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}+\\left(x-h_{1}\\right)^{2}}', 'k_{1}+\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}+\\left(x-h_{1}\\right)^{2}}'],
  ['m_{1}x+b_{1}'],
  []
];

export const xExpressions = [
  ['h_{1}-\\sqrt{r_{1}^{2}-\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\sqrt{r_{1}^{2}-\\left(y-k_{1}\\right)^{2}}'],
  ['h_{1}+\\frac{\\left(y-k_{1}\\right)^{2}}{4c_{1}}'],
  ['h_{1}-\\sqrt{4c_{1}\\left(y-k_{1}\\right)}', 'h_{1}+\\sqrt{4c_{1}\\left(y-k_{1}\\right)}'],
  ['h_{1}-\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}-\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}-\\left(y-k_{1}\\right)^{2}}'],
  ['h_{1}-\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}+\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}+\\left(y-k_{1}\\right)^{2}}'],
  ['h_{1}-\\frac{b_{1}}{a_{1}}\\sqrt{\\left(y-k_{1}\\right)^{2}-a_{1}^{2}}', 'h_{1}+\\frac{b_{1}}{a_{1}}\\sqrt{\\left(y-k_{1}\\right)^{2}-a_{1}^{2}}'],
  ['\\frac{\\left(y-b_{1}\\right)}{m_{1}}'],
  []
];

export const yExpressionsEval = [
  ['k_{1}-\\sqrt{r_{1}^{2}-\\left(x-h_{1}\\right)^{2}}', 'k_{1}+\\sqrt{r_{1}^{2}-\\left(x-h_{1}\\right)^{2}}'],
  ['k_{1}-\\sqrt{4c_{1}\\left(x-h_{1}\\right)}', 'k_{1}+\\sqrt{4c_{1}\\left(x-h_{1}\\right)}'],
  ['k_{1}+\\frac{\\left(x-h_{1}\\right)^{2}}{4c_{1}}'],
  ['k_{1}-\\frac{b_{1}}{a_{1}}\\cdot\\sqrt{a_{1}^{2}-\\left(x-h_{1}\\right)^{2}}', 'k_{1}+\\frac{b_{1}}{a_{1}}\\cdot\\sqrt{a_{1}^{2}-\\left(x-h_{1}\\right)^{2}}'],
  ['k_{1}-\\frac{b_{1}}{a_{1}}\\cdot\\sqrt{\\left(x-h_{1}\\right)^{2}-a_{1}^{2}}', 'k_{1}+\\frac{b_{1}}{a_{1}}\\cdot\\sqrt{\\left(x-h_{1}\\right)^{2}-a_{1}^{2}}'],
  ['k_{1}-\\frac{a_{1}}{b_{1}}\\cdot\\sqrt{b_{1}^{2}+\\left(x-h_{1}\\right)^{2}}', 'k_{1}+\\frac{a_{1}}{b_{1}}\\cdot\\sqrt{b_{1}^{2}+\\left(x-h_{1}\\right)^{2}}'],
  ['m_{1}\\cdot x+b_{1}'],
];

export const xExpressionsEval = [
  ['h_{1}-\\sqrt{r_{1}^{2}-\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\sqrt{r_{1}^{2}-\\left(y-k_{1}\\right)^{2}}'],
  ['h_{1}+\\frac{\\left(y-k_{1}\\right)^{2}}{4c_{1}}'],
  ['h_{1}-\\sqrt{4c_{1}\\left(y-k_{1}\\right)}', 'h_{1}+\\sqrt{4c_{1}\\left(y-k_{1}\\right)}'],
  ['h_{1}-\\frac{a_{1}}{b_{1}}\\cdot\\sqrt{b_{1}^{2}-\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\frac{a_{1}}{b_{1}}\\cdot\\sqrt{b_{1}^{2}-\\left(y-k_{1}\\right)^{2}}'],
  ['h_{1}-\\frac{a_{1}}{b_{1}}\\cdot\\sqrt{b_{1}^{2}+\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\frac{a_{1}}{b_{1}}\\cdot\\sqrt{b_{1}^{2}+\\left(y-k_{1}\\right)^{2}}'],
  ['h_{1}-\\frac{b_{1}}{a_{1}}\\cdot\\sqrt{\\left(y-k_{1}\\right)^{2}-a_{1}^{2}}', 'h_{1}+\\frac{b_{1}}{a_{1}}\\cdot\\sqrt{\\left(y-k_{1}\\right)^{2}-a_{1}^{2}}'],
  ['\\frac{\\left(y-b_{1}\\right)}{m_{1}}'],
];