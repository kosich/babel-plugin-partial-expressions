import { NodePath, types, PluginObj } from '@babel/core';
import { Identifier, BinaryExpression } from '@babel/types';
import { VisitNode } from '@babel/traverse';


const pipeOperatorSigil: string = '|>';
const placeholderSigil: string = '_';

export default function BabelPluginPartialExpressions ({ types: t }: { types: typeof types }) {
  let BinaryExpression: VisitNode<any, BinaryExpression> = (path) => {
    if (path.node.operator != pipeOperatorSigil) {
      return;
    }

    // this is needed to compile right part of `a |> b`
    // before pipeline-proposal plugin transpiles it
    path.get('right').traverse({ Identifier });
  };

  let Identifier: VisitNode<any, Identifier> = (path) => {
    let { scope, node } = path;

    if (node.name != placeholderSigil) {
      return;
    }

    let tempUid = scope.generateUidIdentifier();
    path.replaceWith(tempUid);

    let parentPath = path.findParent(path => {
      let parent = path.parentPath;

      return !parent.isExpression()
        || (parent.isBinaryExpression() && parent.node.operator == pipeOperatorSigil)
        || parent.isArrowFunctionExpression()
        || parent.isFunctionExpression()
    }) as NodePath<any>;

    parentPath.replaceWith(
      t.parenthesizedExpression(
        t.arrowFunctionExpression([tempUid], parentPath.node)
      )
    );
  }

  let config: PluginObj = {
    visitor: {
      BinaryExpression
    }
  };

  return config;
}