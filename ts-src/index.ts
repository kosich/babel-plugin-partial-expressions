import { NodePath, types, PluginObj } from '@babel/core';
import { Identifier, Expression, BinaryExpression } from '@babel/types';
import { VisitNode } from '@babel/traverse';


const pipeOperatorSigil: string = '|>';
const placeholderSigil: string = '_';

export default function BabelPluginPartialExpressions ({ types: t }: { types: typeof types }) {
  let BinaryExpression: VisitNode<any, BinaryExpression> = (path) => {
    if (path.node.operator != pipeOperatorSigil) {
      return;
    }

    // Need to traverse pipeline expressions `a |> b`
    // before pipeline-proposal plugin does
    // because `_` might change the order
    path.traverse({ Identifier });
  };

  let Identifier: VisitNode<any, Identifier> = (path) => {
    let { scope, node } = path;

    if (node.name != placeholderSigil) {
      return;
    }

    // Here we check if `_` is a regular variable.
    if (scope.hasBinding(placeholderSigil)) {
      return;
    }

    // if `_` is subject of piping, e.g. `_ |> a |> b`                 --> `x => (x |> a |> b)`
    // if `_` is part of pipes, e.g. `42 |> _ + '!' |> console.log`    --> `42 |> (x => x + '!') |> console.log`
    // if `_` is part of an expression, e.g. `let a = 'hi, ' + _`      --> `let a = x => 'hi, ' + x`
    // if `_` is part of a string template, e.g. `let a = `hi, ${_}`;` --> `let a = x => `hi, ${ x }`;` 

    let tempUid = scope.generateUidIdentifier();
    path.replaceWith(tempUid);

    // find the level where we substitute the expression
    // let parent = path.parentPath as NodePath<any>;
    let replacePoint =
        isValidReplacePoint(path)
      ? path
      : findReplacePoint(path)
      ;

    replacePoint.replaceWith(
      t.parenthesizedExpression(
        t.arrowFunctionExpression(
          [tempUid],
          t.parenthesizedExpression(
            replacePoint.node
          )
        )
      )
    );
  }

  let config: PluginObj = {
    visitor: {
      BinaryExpression,
      Identifier
    }
  };

  return config;
}

function findReplacePoint(path: NodePath<Expression>) {
  return path.findParent(isValidReplacePoint) as NodePath<any>
}

function isValidReplacePoint(parent: NodePath<types.Node>): boolean {
  let grandpa = parent.parentPath;
  return (
       !grandpa.isExpression()
    || grandpa.isArrowFunctionExpression()
    || grandpa.isFunctionExpression()
    || (grandpa.isBinaryExpression() && grandpa.node.operator == pipeOperatorSigil && grandpa.get('right') == parent)
  );
}