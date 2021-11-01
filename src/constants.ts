import { LatexExpression } from './lib'

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
];

export const xExpressions = [
  ['h_{1}-\\sqrt{r_{1}^{2}-\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\sqrt{r_{1}^{2}-\\left(y-k_{1}\\right)^{2}}'],
  ['h_{1}+\\frac{\\left(y-k_{1}\\right)^{2}}{4c_{1}}'],
  ['h_{1}-\\sqrt{4c_{1}\\left(y-k_{1}\\right)}', 'h_{1}+\\sqrt{4c_{1}\\left(y-k_{1}\\right)}'],
  ['h_{1}-\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}-\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}-\\left(y-k_{1}\\right)^{2}}'],
  ['h_{1}-\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}+\\left(y-k_{1}\\right)^{2}}', 'h_{1}+\\frac{a_{1}}{b_{1}}\\sqrt{b_{1}^{2}+\\left(y-k_{1}\\right)^{2}}'],
  ['h_{1}-\\frac{b_{1}}{a_{1}}\\sqrt{\\left(y-k_{1}\\right)^{2}-a_{1}^{2}}', 'h_{1}+\\frac{b_{1}}{a_{1}}\\sqrt{\\left(y-k_{1}\\right)^{2}-a_{1}^{2}}'],
  ['\\frac{\\left(y-b_{1}\\right)}{m_{1}}'],
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

export const expressionFormat = [
  [ // Circle (x or y)
    { latex: '\\left(x-h_{1}\\right)^{2}+\\left(y-k_{1}\\right)^{2}=r_{1}^{2}', types: ['graph'], name: 'graph' },
    { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(h_{1}+a_{1},k_{1}+b_{1}\\right)', types: ['point', 'hide'] },
    { latex: 'r_{1}=\\sqrt{a_{1}^{2}+b_{1}^{2}}', types: ['helper_var'], name: 'r' },
    { latex: 'h_{1}=0', types: ['var'], name: 'h' },
    { latex: 'k_{1}=0', types: ['var'], name: 'k' },
    { latex: 'a_{1}=1', types: ['var'], name: 'a' },
    { latex: 'b_{1}=0', types: ['var'], name: 'b' },
    ...defaultExpressionFormat,
    ...yExpressions[0].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
    ...xExpressions[0].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
  ],
  [ // Horizontal Parabola (x)
    { latex: '\\left(y-k_{1}\\right)^{2}=4c_{1}\\left(x-h_{1}\\right)', types: ['graph'] },
    { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(h_{1}+d_{1},k_{1}+q_{1}\\right)', types: ['point', 'hide'] },
    { latex: 'k_{1}=0', types: ['var'], name: 'k' },
    { latex: 'h_{1}=0', types: ['var'], name: 'h' },
    { latex: 'q_{1}=1', types: ['var'], name: 'e' },
    { latex: 'd_{1}=1', types: ['var'], name: 'd' },
    { latex: 'c_{1}=\\frac{q_{1}^{2}}{4d_{1}}', types: ['helper_var'], name: 'c' },
    ...defaultExpressionFormat,
    ...yExpressions[1].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
    ...xExpressions[1].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
  ],
  [ // Vertical Parabola (y)
    { latex: '\\left(x-h_{1}\\right)^{2}=4c_{1}\\left(y-k_{1}\\right)', types: ['graph'] },
    { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(h_{1}+q_{1},k_{1}+d_{1}\\right)', types: ['point', 'hide'] },
    { latex: 'k_{1}=0', types: ['var'], name: 'k' },
    { latex: 'h_{1}=0', types: ['var'], name: 'h' },
    { latex: 'q_{1}=1', types: ['var'], name: 'e' },
    { latex: 'd_{1}=1', types: ['var'], name: 'd' },
    { latex: 'c_{1}=\\frac{q_{1}^{2}}{4d_{1}}', types: ['helper_var'], name: 'c' },
    ...defaultExpressionFormat,
    ...yExpressions[2].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
    ...xExpressions[2].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
  ],
  [ // Ellipse (x or y)
    { latex: '\\frac{\\left(x-h_{1}\\right)^{2}}{a_{1}^{2}}+\\frac{\\left(y-k_{1}\\right)^{2}}{b_{1}^{2}}=1', types: ['graph'] },
    { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(h_{1}+a_{1},k_{1}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(h_{1},k_{1}+b_{1}\\right)', types: ['point', 'hide'] },
    { latex: 'k_{1}=0', types: ['var'], name: 'h' },
    { latex: 'h_{1}=0', types: ['var'], name: 'k' },
    { latex: 'a_{1}=1', types: ['var'], name: 'a' },
    { latex: 'b_{1}=1', types: ['var'], name: 'b' },
    ...defaultExpressionFormat,
    ...yExpressions[3].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
    ...xExpressions[3].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
  ],
  [ // Horizontal Hyperbola (x)
    { latex: '\\frac{\\left(x-h_{1}\\right)^{2}}{a_{1}^{2}}-\\frac{\\left(y-k_{1}\\right)^{2}}{b_{1}^{2}}=1', types: ['graph'] },
    { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(h_{1}+a_{1},k_{1}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(h_{1}+\\sqrt{2}a_{1},k_{1}+b_{1}\\right)', types: ['point', 'hide'] },
    { latex: 'k_{1}=0', types: ['var'], name: 'k' },
    { latex: 'h_{1}=0', types: ['var'], name: 'h' },
    { latex: 'a_{1}=1', types: ['var'], name: 'a' },
    { latex: 'b_{1}=1', types: ['var'], name: 'b' },
    ...defaultExpressionFormat,
    ...yExpressions[4].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
    ...xExpressions[4].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
  ],
  [ // Vertical Hyperbola (y)
    { latex: '\\frac{\\left(y-k_{1}\\right)^{2}}{a_{1}^{2}}-\\frac{\\left(x-h_{1}\\right)^{2}}{b_{1}^{2}}=1', types: ['graph'] },
    { latex: '\\left(h_{1},k_{1}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(h_{1},k_{1}+a_{1}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(h_{1}+b_{1},k_{1}+\\sqrt{2}a_{1}\\right)', types: ['point', 'hide'] },
    { latex: 'k_{1}=0', types: ['var'], name: 'k' },
    { latex: 'h_{1}=0', types: ['var'], name: 'h' },
    { latex: 'a_{1}=1', types: ['var'], name: 'a' },
    { latex: 'b_{1}=1', types: ['var'], name: 'b' },
    ...defaultExpressionFormat,
    ...yExpressions[5].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
    ...xExpressions[5].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
  ], // min to ca, max to cb
  [ // Line Segment (x or y)
    { latex: 'y=m_{1}x+b_{1}\\left\\{x_{1ca}<x<x_{1cb}\\right\\}', types: ['graph'] },
    { latex: '\\left(x_{1a},y_{1a}\\right)', types: ['point', 'hide'] },
    { latex: '\\left(x_{1b},y_{1b}\\right)', types: ['point', 'hide'] },
    { latex: 'x_{1ca}=\\min\\left(x_{1a},x_{1b}\\right)', types: ['helper_var'] },
    { latex: 'x_{1cb}=\\max\\left(x_{1a},x_{1b}\\right)', types: ['helper_var'] },
    { latex: 'm_{1}=\\frac{\\left(y_{1b}-y_{1a}\\right)}{\\left(x_{1b}-x_{1a}\\right)}', types: ['helper_var'] },
    { latex: 'b_{1}=y_{1a}-\\frac{\\left(y_{1b}-y_{1a}\\right)x_{1a}}{\\left(x_{1b}-x_{1a}\\right)}', types: ['helper_var'] },
    { latex: 'y_{1a}=0', types: ['var'], name: 'ya' },
    { latex: 'y_{1b}=1', types: ['var'], name: 'yb' },
    { latex: 'x_{1a}=0', types: ['var'], name: 'xa' },
    { latex: 'x_{1b}=1', types: ['var'], name: 'xb' },
    ...yExpressions[6].map((yExpression, c) => ({ latex: `f_{1y${String.fromCharCode(97 + c)}}(x)=${yExpression}`, types: ['y_expression'], name: `f_{1y${String.fromCharCode(97 + c)}}` })),
    ...xExpressions[6].map((xExpression, c) => ({ latex: `f_{1x${String.fromCharCode(97 + c)}}(y)=${xExpression}`, types: ['x_expression'], name: `f_{1x${String.fromCharCode(97 + c)}}` })),
    { latex: 'y_{1ca}=m_{1}x_{1ca}+b_{1}', types: ['helper_var'] },
    { latex: 'y_{1cb}=m_{1}x_{1cb}+b_{1}', types: ['helper_var'] },
  ],
];

export const expressionNames = expressionFormat.map((expressionList) => {
  const x: {[key: string]: number} = {};
  expressionList.forEach((latexExpression, expressionId) => {
    if (latexExpression.name) {
      x[latexExpression.name] = expressionId;
    }
  });
  return x;
});

export const baseExpressionFormat: string[] = [];
for (let i = 0; i < expressionFormat.length; i++) {
  const expression = expressionFormat[i];
  baseExpressionFormat.push(expression[0].latex);
}