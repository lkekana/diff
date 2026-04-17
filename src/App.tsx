import { useEffect, useRef, useState } from "react";
import "./App.css";
import DiffEditor from "./components/DiffEditor";
import type { MonacoTheme } from "./monaco";
import PlainEditor from "./components/PlainEditor";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

// const theme = 'vs-dark';
const originalText = `function add(a, b) {
  return a - b;
}`;
const modifiedText = `function add(a, b) {
  return a + b; // Should've been addition
}`;
const language = "javascript";
const themes = ["vs-dark", "light", "hc-black"] as MonacoTheme[];
const editorDivClasses = "h-[95vh] p-1";

// Initialize Monaco workers
if (!self.MonacoEnvironment) {
	self.MonacoEnvironment = {
		getWorker: () => new editorWorker(),
	};
}

function App() {
	// console.log(monaco.languages.getLanguages());
	const [theme, setTheme] = useState<MonacoTheme>("vs-dark");
	const [modelsReady, setModelsReady] = useState(false);
	const [editorType, setEditorType] = useState<"plain" | "diff">("plain");
	const originalModelRef = useRef<monaco.editor.ITextModel | null>(null);
	const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null);

	// async function greet() {
	//   // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
	//   // setGreetMsg(await invoke("greet", { name }));
	// }

	useEffect(() => {
		const originalModel = monaco.editor.createModel(originalText, language);
		const modifiedModel = monaco.editor.createModel(modifiedText, language);

		originalModelRef.current = originalModel;
		modifiedModelRef.current = modifiedModel;
		setModelsReady(true);

		// Cleanup
		return () => {
			originalModel.dispose();
			modifiedModel.dispose();
			originalModelRef.current = null;
			modifiedModelRef.current = null;
			setModelsReady(false);
		};
	}, []);

	if (!modelsReady) {
		return <div>Loading editor...</div>;
	}

	return (
		<>
			{editorType === "diff" ? (
				<div className={`${editorDivClasses}`}>
					<DiffEditor
						originalModel={originalModelRef.current}
						modifiedModel={modifiedModelRef.current}
						theme={theme}
						editable={false}
						sideBySide={true}
						diffAlgorithm="advanced"
						fontSize={14}
					/>
				</div>
			) : (
				<div className={`flex gap-1 ${editorDivClasses}`}>
					<PlainEditor
						model={originalModelRef.current}
						theme={theme}
						fontSize={14}
					/>
					<PlainEditor
						model={modifiedModelRef.current}
						theme={theme}
						fontSize={14}
					/>
				</div>
			)}
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
			<button
				onClick={() =>
					setEditorType((prev) =>
						prev === "plain" ? "diff" : "plain",
					)
				}
				type="button"
			>
				Toggle Plain/Diff
			</button>
		</>
	);
}

export default App;
