const rule = {
    meta: {
        type: 'layout',
        fixable: 'whitespace',
        docs: {
            description: 'Enforce folding bracket formatting with specific rules for single line, standard block, and folding block formats',
            recommended: false
        },
        schema: [],
        messages: {
            incorrectFormat: 'Incorrect bracket folding format. Expected {{format}} format.',
            missingFoldingMarkers: 'Missing folding markers (//> and //<) for multi-line blocks.',
        },
    },
    create(context) {

        const source = context.getSourceCode()

        function check(node) {

            // Skip if no properties/elements/body
            if ((node.properties && node.properties.length === 0)
                || (node.elements && node.elements.length === 0)
                || (node.body && node.body.length === 0)) {

                return
            
            }

            // Skip nested objects/arrays - only check top-level ones
            if (node.type === 'ObjectExpression' || node.type === 'ArrayExpression') {

                const parent = node.parent

                if (parent && (
                    parent.type === 'ObjectExpression'
                    || parent.type === 'ArrayExpression'
                    || parent.type === 'Property'
                )) {

                    return
                
                }
            
            }

            const open = source.getFirstToken(node)
            const close = source.getLastToken(node)

            if (!open || !close) {

                return
            
            }

            // Check if it's a multi-line block
            const isMultiLine = close.loc.start.line > open.loc.start.line

            // For single-line blocks, always allow (no folding markers needed)
            if (!isMultiLine) {

                return
            
            }

            // For multi-line blocks, check for folding markers
            const fullText = source.getText()
            
            // Get the line with the opening brace
            const openingLine = source.getText().split('\n')[open.loc.start.line - 1]
            const hasOpeningMarker = openingLine.includes('//>')
            
            // Get the line with the closing brace
            const closingLine = source.getText().split('\n')[close.loc.start.line - 1]
            const hasClosingMarker = closingLine.includes('//<')

            // For multi-line blocks without folding markers, report error
            if (!hasOpeningMarker || !hasClosingMarker) {

                context.report({
                    node,
                    messageId: 'missingFoldingMarkers',
                })
            
            }
        
        }

        return {
            ObjectExpression: check,
            ArrayExpression: check,
            BlockStatement(node) {

                // Skip block statements that are children of other statements we're already checking
                const parent = node.parent

                if (parent && (
                    parent.type === 'IfStatement'
                    || parent.type === 'FunctionDeclaration'
                    || parent.type === 'FunctionExpression'
                    || parent.type === 'ArrowFunctionExpression'
                )) {

                    return
                
                }
                check(node)
            
            },
            IfStatement(node) {

                // Skip if statements that are children of other statements we're already checking
                const parent = node.parent

                if (parent && (
                    parent.type === 'FunctionDeclaration'
                    || parent.type === 'FunctionExpression'
                    || parent.type === 'ArrowFunctionExpression'
                    || parent.type === 'BlockStatement'
                )) {

                    return
                
                }
                check(node)
            
            },
            FunctionDeclaration: check,
            FunctionExpression: check,
            ArrowFunctionExpression: check,
        }
    
    },
}

export default rule
