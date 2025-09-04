/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
//  */
const config = {
	semi: false,
	trailingComma: 'es5',
	printWidth: 100,
    
	experimentalTernaries: true,
	// requireConfig: true,
    
	useTabs: false,
	tabWidth: 4,
	singleQuote: true,
    
    markdown: {
        codeFences: "~~~",
        useTabs: false,
	    tabWidth: 4,
    },
    
	// plugins: ['./.prettier/plugin.cjs'],
    
	// proseWrap: 'preserve', // Options: "always", "never", "preserve"
}
  
// export default config
module.exports = config;