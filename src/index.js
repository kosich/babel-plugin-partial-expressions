"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pipeOperatorSigil = '|>';
const placeholderSigil = '_';
function BabelPluginPartialExpressions({ types: t }) {
    let BinaryExpression = (path) => {
        if (path.node.operator != pipeOperatorSigil) {
            return;
        }
        // Need to traverse pipeline expressions `a |> b`
        // before pipeline-proposal plugin does
        // because `_` might change the order
        path.traverse({ Identifier });
    };
    let Identifier = (path) => {
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
        let parentPath = path.findParent(parentPath => {
            let grandpa = parentPath.parentPath;
            return !grandpa.isExpression()
                || grandpa.isArrowFunctionExpression()
                || grandpa.isFunctionExpression()
                || (grandpa.isBinaryExpression() && grandpa.node.operator == pipeOperatorSigil && grandpa.get('right') == parentPath);
        });
        parentPath.replaceWith(t.parenthesizedExpression(t.arrowFunctionExpression([tempUid], t.parenthesizedExpression(parentPath.node))));
    };
    let config = {
        visitor: {
            BinaryExpression,
            Identifier
        }
    };
    return config;
}
exports.default = BabelPluginPartialExpressions;
