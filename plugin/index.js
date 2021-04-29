// @ts-check

/** @type {string} */
const pipeOperatorSigil = '|>';

/** @type {string} */
const placeholderSigil = '_';

/** @param { { types: babel.types } } param0 */
function plugin ({ types: t }) {
  /** @type { import('@babel/traverse').VisitNode<any, babel.types.BinaryExpression> }*/
  let BinaryExpression = (path) => {
    if (path.node.operator != pipeOperatorSigil) {
      return;
    }

    // this is needed to compile right part of `a |> b`
    // before pipeline-proposal plugin transpiles it
    path.get('right').traverse({ Identifier });
  };

  /** @type { import('@babel/traverse').VisitNode<any, babel.types.Identifier> }*/
  let Identifier = (path) => {
    let { scope, node } = path;

    if (node.name != placeholderSigil) {
      return;
    }

    let tempUid = scope.generateUidIdentifier();
    path.replaceWith(tempUid);

    /** @type { import('@babel/core').NodePath<any> } */
    let parentPath = path.findParent(path => {
      let parent = path.parentPath;

      return !parent.isExpression()
        || (parent.isBinaryExpression() && parent.node.operator == pipeOperatorSigil)
        || parent.isArrowFunctionExpression()
        || parent.isFunctionExpression()
    });

    parentPath.replaceWith(
      t.parenthesizedExpression(
        t.arrowFunctionExpression([tempUid], parentPath.node)
      )
    );
  }

  /** @type {import('@babel/core').PluginObj} */
  let config = {
    visitor: {
      BinaryExpression,
      // Identifier
    }
  };

  return config;
}

module.exports = plugin;