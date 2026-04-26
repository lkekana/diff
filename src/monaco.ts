// import { platform } from '@tauri-apps/plugin-os';

export type DiffAlgorithm = "advanced" | "legacy";
export type MonacoTheme = "vs" | "vs-dark" | "hc-black";
export type LanguageID =
	| "plaintext"
	| "json"
	| "abap"
	| "apex"
	| "azcli"
	| "bat"
	| "bicep"
	| "cameligo"
	| "clojure"
	| "coffeescript"
	| "c"
	| "cpp"
	| "csharp"
	| "csp"
	| "css"
	| "cypher"
	| "dart"
	| "dockerfile"
	| "ecl"
	| "elixir"
	| "flow9"
	| "fsharp"
	| "freemarker2"
	| "freemarker2.tag-angle.interpolation-dollar"
	| "freemarker2.tag-bracket.interpolation-dollar"
	| "freemarker2.tag-angle.interpolation-bracket"
	| "freemarker2.tag-bracket.interpolation-bracket"
	| "freemarker2.tag-auto.interpolation-dollar"
	| "freemarker2.tag-auto.interpolation-bracket"
	| "go"
	| "graphql"
	| "handlebars"
	| "hcl"
	| "html"
	| "ini"
	| "java"
	| "javascript"
	| "julia"
	| "kotlin"
	| "less"
	| "lexon"
	| "lua"
	| "liquid"
	| "m3"
	| "markdown"
	| "mdx"
	| "mips"
	| "msdax"
	| "mysql"
	| "objective-c"
	| "pascal"
	| "pascaligo"
	| "perl"
	| "pgsql"
	| "php"
	| "pla"
	| "postiats"
	| "powerquery"
	| "powershell"
	| "proto"
	| "pug"
	| "python"
	| "qsharp"
	| "r"
	| "razor"
	| "redis"
	| "redshift"
	| "restructuredtext"
	| "ruby"
	| "rust"
	| "sb"
	| "scala"
	| "scheme"
	| "scss"
	| "shell"
	| "sol"
	| "aes"
	| "sparql"
	| "sql"
	| "st"
	| "swift"
	| "systemverilog"
	| "verilog"
	| "tcl"
	| "twig"
	| "typescript"
	| "typespec"
	| "vb"
	| "wgsl"
	| "xml"
	| "yaml"
	| "json"
	| "abap"
	| "apex"
	| "azcli"
	| "bat"
	| "bicep"
	| "cameligo"
	| "clojure"
	| "coffeescript"
	| "c"
	| "cpp"
	| "csharp"
	| "csp"
	| "css"
	| "cypher"
	| "dart"
	| "dockerfile"
	| "ecl"
	| "elixir"
	| "flow9"
	| "fsharp"
	| "freemarker2"
	| "freemarker2.tag-angle.interpolation-dollar"
	| "freemarker2.tag-bracket.interpolation-dollar"
	| "freemarker2.tag-angle.interpolation-bracket"
	| "freemarker2.tag-bracket.interpolation-bracket"
	| "freemarker2.tag-auto.interpolation-dollar"
	| "freemarker2.tag-auto.interpolation-bracket"
	| "go"
	| "graphql"
	| "handlebars"
	| "hcl"
	| "html"
	| "ini"
	| "java"
	| "javascript"
	| "julia"
	| "kotlin"
	| "less"
	| "lexon"
	| "lua"
	| "liquid"
	| "m3"
	| "markdown"
	| "mdx"
	| "mips"
	| "msdax"
	| "mysql"
	| "objective-c"
	| "pascal"
	| "pascaligo"
	| "perl"
	| "pgsql"
	| "php"
	| "pla"
	| "postiats"
	| "powerquery"
	| "powershell"
	| "proto"
	| "pug"
	| "python"
	| "qsharp"
	| "r"
	| "razor"
	| "redis"
	| "redshift"
	| "restructuredtext"
	| "ruby"
	| "rust"
	| "sb"
	| "scala"
	| "scheme"
	| "scss"
	| "shell"
	| "sol"
	| "aes"
	| "sparql"
	| "sql"
	| "st"
	| "swift"
	| "systemverilog"
	| "verilog"
	| "tcl"
	| "twig"
	| "typescript"
	| "typespec"
	| "vb"
	| "wgsl"
	| "xml"
	| "yaml";

// Utility function to check if a string is a valid LanguageID
export function isLanguageID(value: string): value is LanguageID {
	const validLanguages: LanguageID[] = [
		"plaintext",
		"json",
		"abap",
		"apex",
		"azcli",
		"bat",
		"bicep",
		"cameligo",
		"clojure",
		"coffeescript",
		"c",
		"cpp",
		"csharp",
		"csp",
		"css",
		"cypher",
		"dart",
		"dockerfile",
		"ecl",
		"elixir",
		"flow9",
		"fsharp",
		"freemarker2",
		"freemarker2.tag-angle.interpolation-dollar",
		"freemarker2.tag-bracket.interpolation-dollar",
		"freemarker2.tag-angle.interpolation-bracket",
		"freemarker2.tag-bracket.interpolation-bracket",
		"freemarker2.tag-auto.interpolation-dollar",
		"freemarker2.tag-auto.interpolation-bracket",
		"go",
		"graphql",
		"handlebars",
		"hcl",
		"html",
		"ini",
		"java",
		"javascript",
		"julia",
		"kotlin",
		"less",
		"lexon",
		"lua",
		"liquid",
		"m3",
		"markdown",
		"mdx",
		"mips",
		"msdax",
		"mysql",
		"objective-c",
		"pascal",
		"pascaligo",
		"perl",
		"pgsql",
		"php",
		"pla",
		"postiats",
		"powerquery",
		"powershell",
		"proto",
		"pug",
		"python",
		"qsharp",
		"r",
		"razor",
		"redis",
		"redshift",
		"restructuredtext",
		"ruby",
		"rust",
		"sb",
		"scala",
		"scheme",
		"scss",
		"shell",
		"sol",
		"aes",
		"sparql",
		"sql",
		"st",
		"swift",
		"systemverilog",
		"verilog",
		"tcl",
		"twig",
		"typescript",
		"typespec",
		"vb",
		"wgsl",
		"xml",
		"yaml",
		"json",
		"abap",
		"apex",
		"azcli",
		"bat",
		"bicep",
		"cameligo",
		"clojure",
		"coffeescript",
		"c",
		"cpp",
		"csharp",
		"csp",
		"css",
		"cypher",
		"dart",
		"dockerfile",
		"ecl",
		"elixir",
		"flow9",
		"fsharp",
		"freemarker2",
		"freemarker2.tag-angle.interpolation-dollar",
		"freemarker2.tag-bracket.interpolation-dollar",
		"freemarker2.tag-angle.interpolation-bracket",
		"freemarker2.tag-bracket.interpolation-bracket",
		"freemarker2.tag-auto.interpolation-dollar",
		"freemarker2.tag-auto.interpolation-bracket",
		"go",
		"graphql",
		"handlebars",
		"hcl",
		"html",
		"ini",
		"java",
		"javascript",
		"julia",
		"kotlin",
		"less",
		"lexon",
		"lua",
		"liquid",
		"m3",
		"markdown",
		"mdx",
		"mips",
		"msdax",
		"mysql",
		"objective-c",
		"pascal",
		"pascaligo",
		"perl",
		"pgsql",
		"php",
		"pla",
		"postiats",
		"powerquery",
		"powershell",
		"proto",
		"pug",
		"python",
		"qsharp",
		"r",
		"razor",
		"redis",
		"redshift",
		"restructuredtext",
		"ruby",
		"rust",
		"sb",
		"scala",
		"scheme",
		"scss",
		"shell",
		"sol",
		"aes",
		"sparql",
		"sql",
		"st",
		"swift",
		"systemverilog",
		"verilog",
		"tcl",
		"twig",
		"typescript",
		"typespec",
		"vb",
		"wgsl",
		"xml",
		"yaml",
	];
	return validLanguages.includes(value as LanguageID);
}

const platform = () => {
	return "macos";
};

const getOSFont = () => {
	const os = platform();
	console.log(`Detected OS: ${os}`);
	switch (os) {
		case "windows":
			return 'Consolas, "Courier New", monospace';
		case "macos":
		case "ios":
			return 'Menlo, Monaco, "Courier New", monospace';
		case "linux":
		case "freebsd":
		case "dragonfly":
		case "netbsd":
		case "openbsd":
		case "solaris":
		case "android":
			return '"DejaVu Sans Mono", "Liberation Mono", Consolas, "Courier New", monospace';
		default:
			return "monospace";
	}
};
export const DEFAULT_FONTS = getOSFont();
