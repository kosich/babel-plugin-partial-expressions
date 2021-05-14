import { NodePath, PluginObj } from '@babel/core';
import { Identifier, Expression, BinaryExpression, UnaryExpression, Node, parenthesizedExpression, arrowFunctionExpression, assertExpression } from '@babel/types';
import { VisitNode } from '@babel/traverse';


const pipeOperatorSigil: string = '|>';
const placeholderSigil: string = '_';
const markerSigil: string = '~';

export default function BabelPluginPartialExpressions () {
  let config: PluginObj = {
    visitor: {
      UnaryExpression,
      BinaryExpression,
    }
  };

  return config;
}


// Need to traverse pipeline expressions `a |> b`
// before pipeline-proposal plugin does
// because partial expression might have other priority
let BinaryExpression: VisitNode<any, BinaryExpression> = (path) => {
  if (path.node.operator != pipeOperatorSigil) {
    return;
  }

  // here we prioritize partial expression visitors,
  // so that they are prepared before |> pipes are applied
  path.parentPath.traverse({
    UnaryExpression
  });

  path.parentPath.traverse({
    Identifier: createPlaceholderTraverser(path.get('right'))
  });
};

// Overriding bitwise NOT ~ operator (unary expression)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_NOT
// to be a marker of partial expression start, e.g.
// let a = ~ 42 + _;
// equals to
// let a = x => 42 + x;
let UnaryExpression: VisitNode<any, UnaryExpression> = (path: NodePath<UnaryExpression>) => {
  if (path.node.operator !== markerSigil) {
    return;
  }

  // bubble while expression position is equal to current ~ position
  // then turn it into an arrow function
  let replacePath: NodePath<Expression> = path;
  while (hasEqualStartLocation(replacePath, replacePath.parentPath)) {
    replacePath.assertExpression();
    replacePath = replacePath.parentPath as NodePath<Expression>;
  }

  // remove the ~ operation
  path.replaceWith(
    path.node.argument
  );

  // replace the ~ group w/ a function
  replacePath.parentPath.traverse({
    Identifier: createPlaceholderTraverser(replacePath),
    UnaryExpression
  });
}

// Identifier visitor with a defined "root"
// this root marks place where replacement should happen
// TODO: test nested expressions
let createPlaceholderTraverser = (root: NodePath<any>): VisitNode<any, Identifier> => (path: NodePath<Identifier>) => {
  let { scope, node } = path;

  if (node.name != placeholderSigil) {
    return;
  }

  // Here we check if `_` is a regular variable.
  if (scope.hasBinding(placeholderSigil)) {
    return;
  }

  // find the level where we substitute the expression
  let replacePoint: NodePath<Node> = path;
  while (replacePoint && replacePoint !== root && !isPipeRight(replacePoint)) {
    replacePoint = replacePoint.parentPath;
  }

  if (!replacePoint || !replacePoint.isExpression()) {
    throw new Error('_ can be used only after ~, or as a pipe');
  }

  // replacing _ with an identifier
  // that will later be used as function argument
  let tempUid = scope.generateUidIdentifier('part');
  path.replaceWith(tempUid);

  replacePoint.replaceWith(
    parenthesizedExpression(
      arrowFunctionExpression(
        [tempUid],
        parenthesizedExpression(replacePoint.node)
      )
    )
  );
}

function hasEqualStartLocation(a: NodePath<any>, b: NodePath<any>) {
  return a.node.loc?.start.line == b.node.loc?.start.line
      && a.node.loc?.start.column == b.node.loc?.start.column
}

function isPipeRight(path: NodePath<Node>) {
  let parent = path?.parentPath;

  return parent
    && parent.isBinaryExpression()
    && parent.node.operator == pipeOperatorSigil
    && parent.node.right == path.node;
}