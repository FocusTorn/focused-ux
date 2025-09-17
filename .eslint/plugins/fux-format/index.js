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

const foldingBracketsRule = {
	meta: {
		type: 'layout',
		fixable: 'whitespace',
		docs: { description: 'Enforce consistent bracket folding based on first property position or folding markers' },
		schema: [],
	},
	create(context) {
		const source = context.getSourceCode()
    
		function check(node) {
			const props = node.properties || []

			if (props.length < 2) return // Need at least 2 properties to check consistency
      
			const open = source.getFirstToken(node)
			const close = source.getLastToken(node)

			if (!open || !close) return
      
			// Check for folding marker comment (//>)
			const hasFoldingMarker = source.getCommentsInside(node).some(comment =>
				comment.value.trim() === '>' || comment.value.trim().endsWith('>'))
      
			// Get first property token
			const firstProp = source.getFirstToken(props[0])

			if (!firstProp) return
      
			// Determine if first property is inline with opening brace
			const firstPropInline = open.loc.end.line === firstProp.loc.start.line
      
			// Check if closing brace is inline with last property
			// const lastProp = source.getLastToken(props[props.length - 1])
			// const lastPropInline = lastProp && lastProp.loc.end.line === close.loc.start.line
      
			// Determine target format
			let shouldBeInline = false
      
			if (hasFoldingMarker) {
				// With folding marker, enforce the format indicated by the marker
				// If first property is inline, all should be inline
				shouldBeInline = firstPropInline
			} else {
				// Without folding marker, prefer multi-line format for consistency
				// Only use inline if there's just one property
				if (props.length === 1) {
					shouldBeInline = true
				} else {
					shouldBeInline = false
				}
			}
      
			// Check if current format already matches target format
			const currentIsInline = props.every(prop => {
				const propToken = source.getFirstToken(prop)

				return propToken && propToken.loc.start.line === open.loc.end.line
			})
      
			const currentIsMultiline = props.every(prop => {
				const propToken = source.getFirstToken(prop)

				return propToken && propToken.loc.start.line !== open.loc.end.line
			})
      
			// Only flag if current format doesn't match target format
			if (shouldBeInline && currentIsInline) {
				return // Already inline, no fix needed
			}
      
			if (!shouldBeInline && currentIsMultiline) {
				return // Already multiline, no fix needed
			}
      
			// Check if all properties follow the target format
			let needsFix = false
			const fixes = []
      
			if (shouldBeInline) {
				// All properties should be inline - rebuild the entire object
				const inlineProps = props.map(prop => {
					const propText = source.text.slice(prop.range[0], prop.range[1])

					return propText
				}).join(', ')
        
				// const newText = `{ ${inlineProps} }`
        
				// Replace the entire object content
				fixes.push({
					range: [open.range[1], close.range[0]],
					text: ` ${inlineProps} `
				})
        
				needsFix = true
			} else {
				// All properties should be on separate lines - rebuild the entire object
				const multilineProps = props.map(prop => {
					const propText = source.text.slice(prop.range[0], prop.range[1])

					return `\n    ${propText}`
				}).join(',')
        
				// Replace the entire object content with proper closing brace indentation
				fixes.push({
					range: [open.range[1], close.range[0]],
					text: `${multilineProps},\n            `
				})
        
				needsFix = true
			}
      
			if (needsFix) {
				context.report({
					node,
					message: `Inconsistent bracket folding. ${shouldBeInline ? 'All properties should be inline' : 'All properties should be on separate lines'}`,
					fix(fixer) {
						return fixes.map(fix =>
							fixer.replaceTextRange(fix.range, fix.text))
					},
				})
			}
		}
    
		return {
			ObjectExpression: check,
			ArrayExpression: check,
			JSONObjectExpression: check,
			JSONArrayExpression: check,
		}
	},
}

export default {
	rules: {
		'triple-space-after-opening-brace': tripleSpaceRule,
		'folding-brackets': foldingBracketsRule,
	},
}
