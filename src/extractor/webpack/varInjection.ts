import { statement } from '@babel/template';
import { Statement } from '@babel/types';
import * as m from '@codemod/matchers';
import { constMemberExpression } from '../../utils/matcher';
import { Module } from '../module';

/**
 * ```js
 * (function(global) {
 *   // ...
 * }.call(exports, require(7)))
 * ```
 * ->
 * ```js
 * var global = require(7);
 * // ...
 * ```
 */
export function inlineVarInjections(module: Module) {
  const { program } = module.ast;
  const newBody: Statement[] = [];

  for (const node of program.body) {
    if (matcher.match(node)) {
      const vars = params.current!.map((param, i) =>
        statement`var ${param} = ${args.current![i + 1]};`()
      );
      newBody.push(...vars);
      newBody.push(...body.current!.body);
      // We can skip replacing uses of `this` because it always refers to the exports
    } else {
      newBody.push(node);
    }
  }
  program.body = newBody;
}

const body = m.capture(m.blockStatement());
const params = m.capture(m.arrayOf(m.identifier()));
const args = m.capture(
  m.anyList(m.or(m.thisExpression(), m.identifier('exports')), m.oneOrMore())
);
const matcher = m.expressionStatement(
  m.callExpression(
    constMemberExpression(
      m.functionExpression(undefined, params, body),
      'call'
    ),
    args
  )
);
