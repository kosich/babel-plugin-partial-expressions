"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("@babel/types");
var pipeOperatorSigil = '|>';
var placeholderSigil = '_';
var markerSigil = '~';
function BabelPluginPartialExpressions() {
    var config = {
        visitor: {
            UnaryExpression: UnaryExpression,
            BinaryExpression: BinaryExpression,
        }
    };
    return config;
}
exports.default = BabelPluginPartialExpressions;
// Need to traverse pipeline expressions `a |> b`
// before pipeline-proposal plugin does
// because partial expression might have other priority
var BinaryExpression = function (path) {
    if (path.node.operator != pipeOperatorSigil) {
        return;
    }
    // here we prioritize partial expression visitors,
    // so that they are prepared before |> pipes are applied
    path.parentPath.traverse({
        UnaryExpression: UnaryExpression
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
var UnaryExpression = function (path) {
    if (path.node.operator !== markerSigil) {
        return;
    }
    // bubble while expression position is equal to current ~ position
    // then turn it into an arrow function
    var replacePath = path;
    while (hasEqualStartLocation(replacePath, replacePath.parentPath)) {
        replacePath.assertExpression();
        replacePath = replacePath.parentPath;
    }
    // remove the ~ operation
    path.replaceWith(path.node.argument);
    // replace the ~ group w/ a function
    replacePath.parentPath.traverse({
        Identifier: createPlaceholderTraverser(replacePath),
        UnaryExpression: UnaryExpression
    });
};
// Identifier visitor with a defined "root"
// this root marks place where replacement should happen
// TODO: test nested expressions
var createPlaceholderTraverser = function (root) { return function (path) {
    var scope = path.scope, node = path.node;
    if (node.name != placeholderSigil) {
        return;
    }
    // Here we check if `_` is a regular variable.
    if (scope.hasBinding(placeholderSigil)) {
        return;
    }
    // find the level where we substitute the expression
    var replacePoint = path;
    while (replacePoint && replacePoint !== root && !isPipeRight(replacePoint)) {
        replacePoint = replacePoint.parentPath;
    }
    if (!replacePoint || !replacePoint.isExpression()) {
        throw new Error('_ can be used only after ~, or as a pipe');
    }
    // replacing _ with an identifier
    // that will later be used as function argument
    var tempUid = scope.generateUidIdentifier('part');
    path.replaceWith(tempUid);
    replacePoint.replaceWith(types_1.parenthesizedExpression(types_1.arrowFunctionExpression([tempUid], types_1.parenthesizedExpression(replacePoint.node))));
}; };
function hasEqualStartLocation(a, b) {
    var _a, _b, _c, _d;
    return ((_a = a.node.loc) === null || _a === void 0 ? void 0 : _a.start.line) == ((_b = b.node.loc) === null || _b === void 0 ? void 0 : _b.start.line)
        && ((_c = a.node.loc) === null || _c === void 0 ? void 0 : _c.start.column) == ((_d = b.node.loc) === null || _d === void 0 ? void 0 : _d.start.column);
}
function isPipeRight(path) {
    var parent = path === null || path === void 0 ? void 0 : path.parentPath;
    return parent
        && parent.isBinaryExpression()
        && parent.node.operator == pipeOperatorSigil
        && parent.node.right == path.node;
}
