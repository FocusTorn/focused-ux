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
        },
    },
    create(context) {
        const source = context.getSourceCode();
        function check(node) {
            const props = node.properties || [];
            if (props.length === 0)
                return; // No properties to format
            const open = source.getFirstToken(node);
            const close = source.getLastToken(node);
            if (!open || !close)
                return;
            // Check for folding marker comment (//>)
            const foldingMarkerComment = source.getCommentsInside(node).find((comment) => comment.value.trim() === '>' || comment.value.trim().endsWith('>'));
            const hasFoldingMarker = !!foldingMarkerComment;
            // Get first property token
            const firstProp = source.getFirstToken(props[0]);
            if (!firstProp)
                return;
            // Determine if first property is inline with opening brace
            const firstPropInline = open.loc.end.line === firstProp.loc.start.line;
            // Determine target format based on rules
            let targetFormat = 'standard'; // 'single', 'standard', 'folding'
            if (hasFoldingMarker) {
                // With folding marker: folding block format
                targetFormat = 'folding';
            }
            else if (firstPropInline) {
                // Property on opening line AND no folding marker: single line format
                targetFormat = 'single';
            }
            else {
                // No property on opening line: standard block format
                targetFormat = 'standard';
            }
            // Check current format and determine if fix is needed
            const needsFix = checkCurrentFormat(node, props, open, close, targetFormat, hasFoldingMarker, foldingMarkerComment);
            if (needsFix) {
                const fix = generateFix(node, props, open, close, targetFormat, hasFoldingMarker, foldingMarkerComment);
                context.report({
                    node,
                    messageId: 'incorrectFormat',
                    data: { format: targetFormat },
                    fix(fixer) {
                        return fixer.replaceTextRange(fix.range, fix.text);
                    },
                });
            }
        }
        function checkCurrentFormat(node, props, open, close, targetFormat, hasFoldingMarker, foldingMarkerComment) {
            const firstProp = source.getFirstToken(props[0]);
            const firstPropInline = open.loc.end.line === firstProp.loc.start.line;
            if (targetFormat === 'single') {
                // All properties should be on the same line as opening brace
                return !props.every(prop => {
                    const propToken = source.getFirstToken(prop);
                    return propToken && propToken.loc.start.line === open.loc.end.line;
                });
            }
            else if (targetFormat === 'standard') {
                // All properties should be on separate lines, no folding marker
                if (hasFoldingMarker)
                    return true;
                return !props.every(prop => {
                    const propToken = source.getFirstToken(prop);
                    return propToken && propToken.loc.start.line !== open.loc.end.line;
                });
            }
            else if (targetFormat === 'folding') {
                // First property inline with folding marker, rest on separate lines
                if (!hasFoldingMarker)
                    return true;
                if (!firstPropInline)
                    return true;
                // Check if folding marker is in correct position (after first property)
                const firstPropEnd = source.getLastToken(props[0]);
                if (!firstPropEnd)
                    return true;
                // Check if folding marker is on the same line as first property
                const markerOnFirstLine = foldingMarkerComment
                    && foldingMarkerComment.loc.start.line === firstPropEnd.loc.end.line;
                if (!markerOnFirstLine)
                    return true;
                // Check if there are exactly 3 spaces between opening brace and first property
                const textBetweenOpenAndFirstProp = source.text.slice(open.range[1], firstProp.range[0]);
                if (textBetweenOpenAndFirstProp !== '   ')
                    return true;
                // Check if there's exactly 1 space between first property's comma and folding marker
                const firstPropEndToken = source.getLastToken(props[0]);
                if (!firstPropEndToken)
                    return true;
                const textBetweenCommaAndMarker = source.text.slice(firstPropEndToken.range[1], foldingMarkerComment.range[0]);
                if (textBetweenCommaAndMarker !== ' ')
                    return true;
                // Check if remaining properties are on separate lines
                return !props.slice(1).every(prop => {
                    const propToken = source.getFirstToken(prop);
                    return propToken && propToken.loc.start.line !== open.loc.end.line;
                });
            }
            return false;
        }
        function generateFix(node, props, open, close, targetFormat, hasFoldingMarker, foldingMarkerComment) {
            if (targetFormat === 'single') {
                // Single line: { "key1": "value1", "key2": "value2", "key3": "value3", "key4": "value4" }
                const inlineProps = props.map(prop => {
                    const propText = source.text.slice(prop.range[0], prop.range[1]);
                    return propText;
                }).join(', ');
                return {
                    range: [open.range[1], close.range[0]],
                    text: ` ${inlineProps} `
                };
            }
            else if (targetFormat === 'standard') {
                // Standard block: all properties on separate lines
                const multilineProps = props.map(prop => {
                    const propText = source.text.slice(prop.range[0], prop.range[1]);
                    return `\n    ${propText}`;
                }).join(',');
                return {
                    range: [open.range[1], close.range[0]],
                    text: `${multilineProps},\n`
                };
            }
            else if (targetFormat === 'folding') {
                // Folding block: first property inline with folding marker, rest on separate lines
                // 3 spaces between opening brace and first property
                // 1 space between last property's comma and folding marker
                const firstPropText = source.text.slice(props[0].range[0], props[0].range[1]);
                const restProps = props.slice(1).map(prop => {
                    const propText = source.text.slice(prop.range[0], prop.range[1]);
                    return `\n    ${propText}`;
                }).join(',');
                return {
                    range: [open.range[1], close.range[0]],
                    text: `   ${firstPropText}, //>\n${restProps},\n`
                };
            }
            return { range: [0, 0], text: '' };
        }
        return {
            ObjectExpression: check,
            ArrayExpression: check,
            JSONObjectExpression: check,
            JSONArrayExpression: check,
        };
    },
};
export default rule;
