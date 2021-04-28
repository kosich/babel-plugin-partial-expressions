module.exports = function ({ types: t }) {
  return {
    visitor: {
      Identifier(path) {
        let { scope, node } = path;

        if (node.name != '_') {
          return;
        }

        let tempUid = scope.generateUidIdentifier();
        path.replaceWith(tempUid);

        let parentPath = path.findParent(path => 
            !path.parentPath.isExpression()
          || path.parentPath.isArrowFunctionExpression()
          || path.parentPath.isFunctionExpression()
        );

        parentPath.replaceWith(
          t.arrowFunctionExpression([tempUid], parentPath.node)
        );
      }

    }
  };
}