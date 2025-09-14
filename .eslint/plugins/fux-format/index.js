/**
 * Local ESLint plugin: fux-format (in .eslint/plugins)
 */

const tripleSpaceRule = {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    docs: { description: 'Require exactly three spaces after { when first property shares the line and line does not end with }' },
    schema: [],
  },
  create(context) {
    const source = context.getSourceCode()
    function check(node) {
      const props = node.properties || []
      if (!props.length) return
      const open = source.getFirstToken(node)
      const first = source.getFirstToken(props[0])
      const close = source.getLastToken(node)
      if (!open || !first) return
      const sameLine = open.loc.end.line === first.loc.start.line
      if (!sameLine) return
      // Only enforce when the closing brace is on a different line
      if (close && close.loc.start.line === open.loc.end.line) return
      const between = source.text.slice(open.range[1], first.range[0])
      if (between !== '   ') {
        context.report({
          node,
          loc: { start: open.loc.end, end: first.loc.start },
          message: "Expected exactly three spaces after '{'",
          fix(fixer) {
            return fixer.replaceTextRange([open.range[1], first.range[0]], '   ')
          },
        })
      }
    }
    return {
      ObjectExpression: check,
      JSONObjectExpression: check,
    }
  },
}

export default {
  rules: {
    'triple-space-after-opening-brace': tripleSpaceRule,
  },
}
