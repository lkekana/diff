use hyperpolyglot::{self, Detection};
use std::path::Path;
use anyhow::Result;

use serde::{Serialize, Deserialize};

/// LanguageID matches the TypeScript `LanguageID` type exactly.
/// Serde ensures the string representation is identical for JSON/TS interop.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LanguageID {
    #[serde(rename = "plaintext")]
    Plaintext,
    #[serde(rename = "json")]
    Json,
    #[serde(rename = "abap")]
    Abap,
    #[serde(rename = "apex")]
    Apex,
    #[serde(rename = "azcli")]
    Azcli,
    #[serde(rename = "bat")]
    Bat,
    #[serde(rename = "bicep")]
    Bicep,
    #[serde(rename = "cameligo")]
    Cameligo,
    #[serde(rename = "clojure")]
    Clojure,
    #[serde(rename = "coffeescript")]
    Coffeescript,
    #[serde(rename = "c")]
    C,
    #[serde(rename = "cpp")]
    Cpp,
    #[serde(rename = "csharp")]
    Csharp,
    #[serde(rename = "csp")]
    Csp,
    #[serde(rename = "css")]
    Css,
    #[serde(rename = "cypher")]
    Cypher,
    #[serde(rename = "dart")]
    Dart,
    #[serde(rename = "dockerfile")]
    Dockerfile,
    #[serde(rename = "ecl")]
    Ecl,
    #[serde(rename = "elixir")]
    Elixir,
    #[serde(rename = "flow9")]
    Flow9,
    #[serde(rename = "fsharp")]
    Fsharp,
    #[serde(rename = "freemarker2")]
    Freemarker2,
    #[serde(rename = "freemarker2.tag-angle.interpolation-dollar")]
    Freemarker2TagAngleInterpolationDollar,
    #[serde(rename = "freemarker2.tag-bracket.interpolation-dollar")]
    Freemarker2TagBracketInterpolationDollar,
    #[serde(rename = "freemarker2.tag-angle.interpolation-bracket")]
    Freemarker2TagAngleInterpolationBracket,
    #[serde(rename = "freemarker2.tag-bracket.interpolation-bracket")]
    Freemarker2TagBracketInterpolationBracket,
    #[serde(rename = "freemarker2.tag-auto.interpolation-dollar")]
    Freemarker2TagAutoInterpolationDollar,
    #[serde(rename = "freemarker2.tag-auto.interpolation-bracket")]
    Freemarker2TagAutoInterpolationBracket,
    #[serde(rename = "go")]
    Go,
    #[serde(rename = "graphql")]
    Graphql,
    #[serde(rename = "handlebars")]
    Handlebars,
    #[serde(rename = "hcl")]
    Hcl,
    #[serde(rename = "html")]
    Html,
    #[serde(rename = "ini")]
    Ini,
    #[serde(rename = "java")]
    Java,
    #[serde(rename = "javascript")]
    Javascript,
    #[serde(rename = "julia")]
    Julia,
    #[serde(rename = "kotlin")]
    Kotlin,
    #[serde(rename = "less")]
    Less,
    #[serde(rename = "lexon")]
    Lexon,
    #[serde(rename = "lua")]
    Lua,
    #[serde(rename = "liquid")]
    Liquid,
    #[serde(rename = "m3")]
    M3,
    #[serde(rename = "markdown")]
    Markdown,
    #[serde(rename = "mdx")]
    Mdx,
    #[serde(rename = "mips")]
    Mips,
    #[serde(rename = "msdax")]
    Msdax,
    #[serde(rename = "mysql")]
    Mysql,
    #[serde(rename = "objective-c")]
    ObjectiveC,
    #[serde(rename = "pascal")]
    Pascal,
    #[serde(rename = "pascaligo")]
    Pascaligo,
    #[serde(rename = "perl")]
    Perl,
    #[serde(rename = "pgsql")]
    Pgsql,
    #[serde(rename = "php")]
    Php,
    #[serde(rename = "pla")]
    Pla,
    #[serde(rename = "postiats")]
    Postiats,
    #[serde(rename = "powerquery")]
    Powerquery,
    #[serde(rename = "powershell")]
    Powershell,
    #[serde(rename = "proto")]
    Proto,
    #[serde(rename = "pug")]
    Pug,
    #[serde(rename = "python")]
    Python,
    #[serde(rename = "qsharp")]
    Qsharp,
    #[serde(rename = "r")]
    R,
    #[serde(rename = "razor")]
    Razor,
    #[serde(rename = "redis")]
    Redis,
    #[serde(rename = "redshift")]
    Redshift,
    #[serde(rename = "restructuredtext")]
    Restructuredtext,
    #[serde(rename = "ruby")]
    Ruby,
    #[serde(rename = "rust")]
    Rust,
    #[serde(rename = "sb")]
    Sb,
    #[serde(rename = "scala")]
    Scala,
    #[serde(rename = "scheme")]
    Scheme,
    #[serde(rename = "scss")]
    Scss,
    #[serde(rename = "shell")]
    Shell,
    #[serde(rename = "sol")]
    Sol,
    #[serde(rename = "aes")]
    Aes,
    #[serde(rename = "sparql")]
    Sparql,
    #[serde(rename = "sql")]
    Sql,
    #[serde(rename = "st")]
    St,
    #[serde(rename = "swift")]
    Swift,
    #[serde(rename = "systemverilog")]
    Systemverilog,
    #[serde(rename = "verilog")]
    Verilog,
    #[serde(rename = "tcl")]
    Tcl,
    #[serde(rename = "twig")]
    Twig,
    #[serde(rename = "typescript")]
    Typescript,
    #[serde(rename = "typespec")]
    Typespec,
    #[serde(rename = "vb")]
    Vb,
    #[serde(rename = "wgsl")]
    Wgsl,
    #[serde(rename = "xml")]
    Xml,
    #[serde(rename = "yaml")]
    Yaml,
}

impl LanguageID {
    /// Maps a language name from the detection tool's LANGUAGES array
    /// to the corresponding LanguageID. Returns None if no mapping exists.
    /// 
    /// This function handles case-insensitive matching and explicit mappings
    /// for names that don't directly correspond to LanguageID variants.
    pub fn from_language_name(name: &str) -> Option<Self> {
        let normalized = name.trim().to_lowercase();
        
        // Direct mapping table for non-obvious cases
        // Format: detection_name_lowercase -> LanguageID variant
        let mapping = [
            // Plain text variants
            ("text", LanguageID::Plaintext),
            ("plain text", LanguageID::Plaintext),
            
            // C-family languages
            ("c++", LanguageID::Cpp),
            ("c#", LanguageID::Csharp),
            ("objective-c++", LanguageID::ObjectiveC), // Map to Objective-C
            
            // F# variant
            ("f#", LanguageID::Fsharp),
            
            // SQL dialects - map to generic SQL or specific if available
            ("sql", LanguageID::Sql),
            ("plsql", LanguageID::Pgsql), // Common alias
            ("tsql", LanguageID::Pgsql),  // Common alias
            ("mysql", LanguageID::Mysql),
            ("postgresql", LanguageID::Pgsql),
            ("redshift", LanguageID::Redshift),
            ("msdax", LanguageID::Msdax),
            
            // Protocol/Config formats
            ("protocol buffer", LanguageID::Proto),
            ("protobuf", LanguageID::Proto),
            ("dockerfile", LanguageID::Dockerfile),
            ("docker", LanguageID::Dockerfile),
            
            // Markup & templating
            ("markdown", LanguageID::Markdown),
            ("md", LanguageID::Markdown),
            ("mdx", LanguageID::Mdx),
            ("handlebars", LanguageID::Handlebars),
            ("hbs", LanguageID::Handlebars),
            ("pug", LanguageID::Pug),
            ("jade", LanguageID::Pug), // Legacy name
            ("twig", LanguageID::Twig),
            ("razor", LanguageID::Razor),
            ("freemarker", LanguageID::Freemarker2),
            ("freemarker 2", LanguageID::Freemarker2),
            
            // Shell & scripting
            ("shell", LanguageID::Shell),
            ("bash", LanguageID::Shell),
            ("sh", LanguageID::Shell),
            ("zsh", LanguageID::Shell),
            ("powershell", LanguageID::Powershell),
            ("ps1", LanguageID::Powershell),
            ("batch", LanguageID::Bat),
            ("cmd", LanguageID::Bat),
            ("bat", LanguageID::Bat),
            
            // Data formats
            ("json", LanguageID::Json),
            ("jsonc", LanguageID::Json), // JSON with comments
            ("json5", LanguageID::Json),
            ("yaml", LanguageID::Yaml),
            ("yml", LanguageID::Yaml),
            ("xml", LanguageID::Xml),
            ("toml", LanguageID::Ini), // Closest match
            ("ini", LanguageID::Ini),
            ("csv", LanguageID::Plaintext), // No dedicated CSV highlighter
            
            // Query languages
            ("graphql", LanguageID::Graphql),
            ("cypher", LanguageID::Cypher),
            ("sparql", LanguageID::Sparql),
            
            // Smart contract / blockchain
            ("solidity", LanguageID::Sol),
            ("sol", LanguageID::Sol),
            
            // Microsoft/Azure ecosystem
            ("azure cli", LanguageID::Azcli),
            ("azcli", LanguageID::Azcli),
            ("bicep", LanguageID::Bicep),
            ("power query", LanguageID::Powerquery),
            ("powerquery", LanguageID::Powerquery),
            ("dax", LanguageID::Msdax),
            ("q#", LanguageID::Qsharp),
            ("qsharp", LanguageID::Qsharp),
            ("typespec", LanguageID::Typespec),
            
            // WebGPU / graphics
            ("wgsl", LanguageID::Wgsl),
            ("webgpu shading language", LanguageID::Wgsl),
            
            // Assembly / low-level
            ("assembly", LanguageID::Plaintext), // Generic fallback
            ("mips", LanguageID::Mips),
            ("mips assembly", LanguageID::Mips),
            ("systemverilog", LanguageID::Systemverilog),
            ("verilog", LanguageID::Verilog),
            
            // Other specialized languages
            ("aes", LanguageID::Aes),
            ("cameligo", LanguageID::Cameligo),
            ("pascaligo", LanguageID::Pascaligo),
            ("flow9", LanguageID::Flow9),
            ("lexon", LanguageID::Lexon),
            ("m3", LanguageID::M3),
            ("pla", LanguageID::Pla),
            ("postiats", LanguageID::Postiats),
            ("sb", LanguageID::Sb),
            ("st", LanguageID::St), // Smalltalk variant
            ("csp", LanguageID::Csp),
            ("redis", LanguageID::Redis),
            ("redis cli", LanguageID::Redis),
        ];
        
        // First try the explicit mapping table
        if let Some(&(_, lang_id)) = mapping.iter().find(|(key, _)| *key == normalized) {
            return Some(lang_id);
        }
        
        // Then try direct variant name matching (case-insensitive)
        // This handles cases like "python" -> LanguageID::Python
        match normalized.as_str() {
            "abap" => Some(LanguageID::Abap),
            "apex" => Some(LanguageID::Apex),
            "clojure" => Some(LanguageID::Clojure),
            "coffeescript" => Some(LanguageID::Coffeescript),
            "c" => Some(LanguageID::C),
            "css" => Some(LanguageID::Css),
            "dart" => Some(LanguageID::Dart),
            "ecl" => Some(LanguageID::Ecl),
            "elixir" => Some(LanguageID::Elixir),
            "go" => Some(LanguageID::Go),
            "hcl" => Some(LanguageID::Hcl),
            "html" => Some(LanguageID::Html),
            "java" => Some(LanguageID::Java),
            "javascript" => Some(LanguageID::Javascript),
            "julia" => Some(LanguageID::Julia),
            "kotlin" => Some(LanguageID::Kotlin),
            "less" => Some(LanguageID::Less),
            "lua" => Some(LanguageID::Lua),
            "liquid" => Some(LanguageID::Liquid),
            "perl" => Some(LanguageID::Perl),
            "php" => Some(LanguageID::Php),
            "python" => Some(LanguageID::Python),
            "r" => Some(LanguageID::R),
            "ruby" => Some(LanguageID::Ruby),
            "rust" => Some(LanguageID::Rust),
            "scala" => Some(LanguageID::Scala),
            "scheme" => Some(LanguageID::Scheme),
            "scss" => Some(LanguageID::Scss),
            "shell" => Some(LanguageID::Shell),
            "sql" => Some(LanguageID::Sql),
            "swift" => Some(LanguageID::Swift),
            "tcl" => Some(LanguageID::Tcl),
            "typescript" => Some(LanguageID::Typescript),
            "vb" => Some(LanguageID::Vb),
            _ => None,
        }
    }
    
    /// Returns the exact string representation that matches TypeScript
    pub fn as_ts_string(&self) -> &'static str {
        match self {
            LanguageID::Plaintext => "plaintext",
            LanguageID::Json => "json",
            LanguageID::Abap => "abap",
            LanguageID::Apex => "apex",
            LanguageID::Azcli => "azcli",
            LanguageID::Bat => "bat",
            LanguageID::Bicep => "bicep",
            LanguageID::Cameligo => "cameligo",
            LanguageID::Clojure => "clojure",
            LanguageID::Coffeescript => "coffeescript",
            LanguageID::C => "c",
            LanguageID::Cpp => "cpp",
            LanguageID::Csharp => "csharp",
            LanguageID::Csp => "csp",
            LanguageID::Css => "css",
            LanguageID::Cypher => "cypher",
            LanguageID::Dart => "dart",
            LanguageID::Dockerfile => "dockerfile",
            LanguageID::Ecl => "ecl",
            LanguageID::Elixir => "elixir",
            LanguageID::Flow9 => "flow9",
            LanguageID::Fsharp => "fsharp",
            LanguageID::Freemarker2 => "freemarker2",
            LanguageID::Freemarker2TagAngleInterpolationDollar => "freemarker2.tag-angle.interpolation-dollar",
            LanguageID::Freemarker2TagBracketInterpolationDollar => "freemarker2.tag-bracket.interpolation-dollar",
            LanguageID::Freemarker2TagAngleInterpolationBracket => "freemarker2.tag-angle.interpolation-bracket",
            LanguageID::Freemarker2TagBracketInterpolationBracket => "freemarker2.tag-bracket.interpolation-bracket",
            LanguageID::Freemarker2TagAutoInterpolationDollar => "freemarker2.tag-auto.interpolation-dollar",
            LanguageID::Freemarker2TagAutoInterpolationBracket => "freemarker2.tag-auto.interpolation-bracket",
            LanguageID::Go => "go",
            LanguageID::Graphql => "graphql",
            LanguageID::Handlebars => "handlebars",
            LanguageID::Hcl => "hcl",
            LanguageID::Html => "html",
            LanguageID::Ini => "ini",
            LanguageID::Java => "java",
            LanguageID::Javascript => "javascript",
            LanguageID::Julia => "julia",
            LanguageID::Kotlin => "kotlin",
            LanguageID::Less => "less",
            LanguageID::Lexon => "lexon",
            LanguageID::Lua => "lua",
            LanguageID::Liquid => "liquid",
            LanguageID::M3 => "m3",
            LanguageID::Markdown => "markdown",
            LanguageID::Mdx => "mdx",
            LanguageID::Mips => "mips",
            LanguageID::Msdax => "msdax",
            LanguageID::Mysql => "mysql",
            LanguageID::ObjectiveC => "objective-c",
            LanguageID::Pascal => "pascal",
            LanguageID::Pascaligo => "pascaligo",
            LanguageID::Perl => "perl",
            LanguageID::Pgsql => "pgsql",
            LanguageID::Php => "php",
            LanguageID::Pla => "pla",
            LanguageID::Postiats => "postiats",
            LanguageID::Powerquery => "powerquery",
            LanguageID::Powershell => "powershell",
            LanguageID::Proto => "proto",
            LanguageID::Pug => "pug",
            LanguageID::Python => "python",
            LanguageID::Qsharp => "qsharp",
            LanguageID::R => "r",
            LanguageID::Razor => "razor",
            LanguageID::Redis => "redis",
            LanguageID::Redshift => "redshift",
            LanguageID::Restructuredtext => "restructuredtext",
            LanguageID::Ruby => "ruby",
            LanguageID::Rust => "rust",
            LanguageID::Sb => "sb",
            LanguageID::Scala => "scala",
            LanguageID::Scheme => "scheme",
            LanguageID::Scss => "scss",
            LanguageID::Shell => "shell",
            LanguageID::Sol => "sol",
            LanguageID::Aes => "aes",
            LanguageID::Sparql => "sparql",
            LanguageID::Sql => "sql",
            LanguageID::St => "st",
            LanguageID::Swift => "swift",
            LanguageID::Systemverilog => "systemverilog",
            LanguageID::Verilog => "verilog",
            LanguageID::Tcl => "tcl",
            LanguageID::Twig => "twig",
            LanguageID::Typescript => "typescript",
            LanguageID::Typespec => "typespec",
            LanguageID::Vb => "vb",
            LanguageID::Wgsl => "wgsl",
            LanguageID::Xml => "xml",
            LanguageID::Yaml => "yaml",
        }
    }
}

pub fn detect_language(file_path: &Path) -> Result<Option<String>> {
    let detection = match hyperpolyglot::detect(file_path) {
        Ok(d) => d,
        Err(e) => {
            eprintln!("Error detecting language: {}", e);
            return Err(e.into());
        }
    };

    return match detection {
        Some(Detection::Classifier(lang)) => {
            println!("Classifier detected language: {}", lang);
            match LanguageID::from_language_name(lang) {
                Some(lang_id) => {
                    println!("Mapped to LanguageID: {:?}", lang_id);
                    return Ok(Some(lang_id.as_ts_string().to_string()));
                },
                None => {
                    eprintln!("No mapping found for detected language: {}", lang);
                    return Ok(None);
                }
            }
        },
        Some(Detection::Extension(lang)) => {
            println!("Extension detected language: {}", lang);
            match LanguageID::from_language_name(lang) {
                Some(lang_id) => {
                    println!("Mapped to LanguageID: {:?}", lang_id);
                    return Ok(Some(lang_id.as_ts_string().to_string()));
                },
                None => {
                    eprintln!("No mapping found for detected language: {}", lang);
                    return Ok(None);
                }
            }

        }
        Some(Detection::Filename(lang)) => {
            println!("Filename detected language: {}", lang);
            match LanguageID::from_language_name(lang) {
                Some(lang_id) => {
                    println!("Mapped to LanguageID: {:?}", lang_id);
                    return Ok(Some(lang_id.as_ts_string().to_string()));
                },
                None => {
                    eprintln!("No mapping found for detected language: {}", lang);
                    return Ok(None);
                }
            }

        }
        Some(Detection::Heuristics(lang)) => {
            println!("Heuristics detected language: {}", lang);
            match LanguageID::from_language_name(lang) {
                Some(lang_id) => {
                    println!("Mapped to LanguageID: {:?}", lang_id);
                    return Ok(Some(lang_id.as_ts_string().to_string()));
                },
                None => {
                    eprintln!("No mapping found for detected language: {}", lang);
                    return Ok(None);
                }
            }

        }
        Some(Detection::Shebang(lang)) => {
            println!("Shebang detected language: {}", lang);
            match LanguageID::from_language_name(lang) {
                Some(lang_id) => {
                    println!("Mapped to LanguageID: {:?}", lang_id);
                    return Ok(Some(lang_id.as_ts_string().to_string()));
                },
                None => {
                    eprintln!("No mapping found for detected language: {}", lang);
                    return Ok(None);
                }
            }

        }
        None => Err(anyhow::anyhow!("Could not detect language")),
    };
}
