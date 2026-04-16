import { useState } from "react";
import "./App.css";
import DiffEditor from "./components/DiffEditor";
import type { MonacoTheme } from "./monaco";

// const theme = 'vs-dark';
const originalText = `function add(a, b) {
  return a - b;
}`;
const modifiedText = `function add(a, b) {
  return a + b; // Should've been addition
}`;
const language = "javascript";
const themes = ["vs-dark", "light", "hc-black"] as MonacoTheme[];

function App() {
	// console.log(monaco.languages.getLanguages());
	const [theme, setTheme] = useState<MonacoTheme>("vs-dark");

	// async function greet() {
	//   // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
	//   // setGreetMsg(await invoke("greet", { name }));
	// }

	return (
		<>
			<DiffEditor
				originalText={originalText}
				modifiedText={modifiedText}
				language={language}
				theme={theme}
				editable={false}
				sideBySide={true}
				diffAlgorithm="advanced"
				fontSize={14}
			/>
			<button
				onClick={() =>
					setTheme((prev) => {
						const currentIndex = themes.indexOf(prev);
						const nextIndex = (currentIndex + 1) % themes.length;
						return themes[nextIndex];
					})
				}
				type="button"
			>
				Change Theme
			</button>
		</>
	);
}

export default App;
