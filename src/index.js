"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pipeOperatorSigil = '|>';
const placeholderSigil = '_';
function BabelPluginPartialExpressions({ types: t }) {
    let BinaryExpression = (path) => {
        if (path.node.operator != pipeOperatorSigil) {
            return;
        }
        // this is needed to compile right part of `a |> b`
        // before pipeline-proposal plugin transpiles it
        path.get('right').traverse({ Identifier });
    };
    let Identifier = (path) => {
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
                || parent.isFunctionExpression();
        });
        parentPath.replaceWith(t.parenthesizedExpression(t.arrowFunctionExpression([tempUid], parentPath.node)));
    };
    let config = {
        visitor: {
            BinaryExpression
        }
    };
    return config;
}
exports.default = BabelPluginPartialExpressions;
