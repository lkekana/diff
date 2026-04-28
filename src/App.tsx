import { useEffect, useRef, useState } from "react";
import DiffEditor from "./components/DiffEditor";
import { isLanguageID, type MonacoTheme } from "./monaco";
import PlainEditor, { PlainEditorSkeleton } from "./components/PlainEditor";
import * as monaco from "monaco-editor";
import type * as React from "react";

// const theme = 'vs-dark';
const initialLanguage = "typescript";
const themes = ["vs-dark", "light", "hc-black"] as MonacoTheme[];

type TextState = {
	text: string;
	file: {
		path: string;
		loadedText: string;
	};
};

const fontSize = 12;

function App() {
	// console.log(monaco.languages.getLanguages());
	const [theme, setTheme] = useState<MonacoTheme>("vs-dark");
	const [buttonColors, setButtonColors] = useState("bg-gray-700 hover:bg-gray-600");
	const [modelsReady, setModelsReady] = useState(false);
	const [editorType, setEditorType] = useState<"plain" | "diff">("plain");
	const originalModelRef = useRef<monaco.editor.ITextModel | null>(null);
	const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null);
	const [originalState, setOriginalState] = useState<TextState | null>(null);
	const [modifiedState, setModifiedState] = useState<TextState | null>(null);
	const [language, setLanguage] = useState(initialLanguage);
	const [originalFileOverlayActive, setOriginalFileOverlayActive] = useState(true);
	const [modifiedFileOverlayActive, setModifiedFileOverlayActive] = useState(true);
	const [sideBySide, setSideBySide] = useState(true);

	const onFileDrop = (files: File[], setState: (value: React.SetStateAction<TextState | null>) => void) => {
		// console.log("onFileDrop called with files:", files, "Event:", event);
		const getFileData = async (file: File) => {
			try {
				const path = await window.electronAPI.getFilePath(file);
				console.log("File:", file, "Path:", path);
				const reader = new FileReader();
				reader.onload = () => {
					const loadedText = reader.result as string;
					setState({ text: loadedText, file: { path, loadedText } });
				};
				reader.readAsText(file);

				const detectedLanguage = await window.electronAPI.detectLanguage(path);
				if (detectedLanguage !== null && detectedLanguage !== language) {
					const isLang = isLanguageID(detectedLanguage);
					const monacoHasLang = monaco.languages.getLanguages().some((l) => l.id === detectedLanguage);
					console.log(
						`Detected language: ${detectedLanguage}, isLanguageID: ${isLang}, Monaco supports: ${monacoHasLang}`,
					);
					if (isLang && monacoHasLang) {
						setLanguage(detectedLanguage);
					}
				}
			} catch (error) {
				console.error("Failed to load file:", error);
				throw error;
			}
		};

		if (files.length > 0) {
			const file = files[0];
			getFileData(file);
		}
	};

	// Sync theme with Monaco
	useEffect(() => {
		monaco.editor.setTheme(theme);
		if (theme === ("light" as MonacoTheme)) {
			setButtonColors("bg-gray-300 hover:bg-gray-200");
		} else {
			setButtonColors("bg-gray-700 hover:bg-gray-600");
		}
	}, [theme]);

	useEffect(() => {
		if (originalModelRef.current) {
			if (originalModelRef.current.getLanguageId() !== language) {
				monaco.editor.setModelLanguage(originalModelRef.current, language);
			}
		}
		if (modifiedModelRef.current) {
			if (modifiedModelRef.current.getLanguageId() !== language) {
				monaco.editor.setModelLanguage(modifiedModelRef.current, language);
			}
		}
	}, [language]);

	// Sync models with state (for file loading)
	useEffect(() => {
		if (
			originalModelRef.current &&
			originalState !== null &&
			originalModelRef.current.getValue() !== originalState.text
		) {
			originalModelRef.current.setValue(originalState.text);
		}
	}, [originalState]);

	useEffect(() => {
		if (
			modifiedModelRef.current &&
			modifiedState !== null &&
			modifiedModelRef.current.getValue() !== modifiedState.text
		) {
			modifiedModelRef.current.setValue(modifiedState.text);
		}
	}, [modifiedState]);

	// Setup Monaco models on mount and cleanup on unmount
	useEffect(() => {
		let isMounted = true;

		const setupModels = async () => {
			try {
				const appFolder = await window.electronAPI.getAppFolder();
				console.log("App folder path:", appFolder);

				const tempFolder = await window.electronAPI.getTempFolder();
				console.log("Temp folder path:", tempFolder);

				const defaultOriginalPath = await window.electronAPI.joinPaths(tempFolder, "original.ts");
				const defaultModifiedPath = await window.electronAPI.joinPaths(tempFolder, "modified.ts");

				console.log("Default original path:", defaultOriginalPath);
				console.log("Default modified path:", defaultModifiedPath);

				const [defaultOriginal, defaultModified] = await Promise.all([
					window.electronAPI.readTextFile(defaultOriginalPath),
					window.electronAPI.readTextFile(defaultModifiedPath),
				]);

				if (defaultOriginal.isBinary) {
					console.error(
						`Default original file at ${defaultOriginalPath} is binary. Content cannot be loaded into editor.`,
					);
					throw new Error("Default files cannot be binary");
				}

				if (defaultOriginal.content === undefined) {
					console.error(
						`Default original file at ${defaultOriginalPath} cannot be loaded. No content found.`,
					);
					throw new Error("Default original file content is undefined");
				}

				if (defaultModified.isBinary) {
					console.error(
						`Default modified file at ${defaultModifiedPath} is binary. Content cannot be loaded into editor.`,
					);
					throw new Error("Default files cannot be binary");
				}

				if (defaultModified.content === undefined) {
					console.error(
						`Default modified file at ${defaultModifiedPath} cannot be loaded. No content found.`,
					);
					throw new Error("Default modified file content is undefined");
				}

				const originalModel = monaco.editor.createModel(defaultOriginal.content, initialLanguage);
				const modifiedModel = monaco.editor.createModel(defaultModified.content, initialLanguage);

				originalModelRef.current = originalModel;
				modifiedModelRef.current = modifiedModel;

				if (isMounted) {
					setModelsReady(true);
					setLanguage(initialLanguage);
					setOriginalState({
						text: defaultOriginal.content,
						file: { path: defaultOriginalPath, loadedText: defaultOriginal.content },
					});
					setModifiedState({
						text: defaultModified.content,
						file: { path: defaultModifiedPath, loadedText: defaultModified.content },
					});
				}
			} catch (error) {
				console.error("Failed to setup Monaco models:", error);
				// Optional: handle error state here
			}
		};
		setupModels();

		// Cleanup
		return () => {
			isMounted = false;
			if (originalModelRef.current != null) {
				originalModelRef.current.dispose();
			}
			if (modifiedModelRef.current != null) {
				modifiedModelRef.current.dispose();
			}
			originalModelRef.current = null;
			modifiedModelRef.current = null;
			setModelsReady(false);
		};
	}, []);

	// print window dimensions
	console.log(`Window dimensions: ${window.innerWidth}x${window.innerHeight}`);

	return (
		<div className="monaco-editor flex flex-col h-screen w-screen overflow-hidden p-1 bg-gray-900 text-white">
			{/* <h1 className="text-2xl mb-2">Language: {language}</h1> */}
			<div className="flex-1 min-h-0 w-full relative">
				{!modelsReady ? (
					<div className="w-full h-full">
						<PlainEditorSkeleton />
					</div>
				) : editorType === "diff" ? (
					<div className="w-full h-full">
						<DiffEditor
							originalModel={originalModelRef.current}
							modifiedModel={modifiedModelRef.current}
							editable={false}
							sideBySide={sideBySide}
							diffAlgorithm="advanced"
							fontSize={fontSize}
						/>
					</div>
				) : (
					<div className="flex gap-1 w-full h-full">
						<PlainEditor
							model={originalModelRef.current}
							fontSize={fontSize}
							onDrop={(files) => onFileDrop(files, setOriginalState)}
							overlayActiveState={[originalFileOverlayActive, setOriginalFileOverlayActive]}
							activeTheme={theme}
						/>
						<PlainEditor
							model={modifiedModelRef.current}
							fontSize={fontSize}
							onDrop={(files) => onFileDrop(files, setModifiedState)}
							overlayActiveState={[modifiedFileOverlayActive, setModifiedFileOverlayActive]}
							activeTheme={theme}
						/>
					</div>
				)}
			</div>
			<div
				className={`flex items-center gap-2 p-2 rounded mt-1 shrink-0 ${theme === ("light" as MonacoTheme) ? "bg-gray-200" : "bg-gray-800"}`}
			>
				<button
					onClick={() =>
						setTheme((prev) => {
							const currentIndex = themes.indexOf(prev);
							const nextIndex = (currentIndex + 1) % themes.length;
							return themes[nextIndex];
						})
					}
					type="button"
					className={`px-3 py-1 rounded text-sm ${buttonColors}`}
				>
					Change Theme
				</button>
				<button
					onClick={() => setEditorType((prev) => (prev === "plain" ? "diff" : "plain"))}
					type="button"
					className={`px-3 py-1 rounded text-sm ${buttonColors}`}
				>
					Toggle Plain/Diff
				</button>
				<button
					onClick={() => setSideBySide((prev) => !prev)}
					type="button"
					className={`px-3 py-1 rounded text-sm ${buttonColors}`}
				>
					Toggle Side-by-Side
				</button>
				<select
					value={language}
					onChange={(e) => setLanguage(e.target.value)}
					className={`ml-2 px-2 py-1 rounded text-sm border-none outline-none ${buttonColors}`}
				>
					{monaco.languages.getLanguages().map((lang) => (
						<option key={lang.id} value={lang.id}>
							{lang.aliases && lang.aliases.length > 0 ? lang.aliases[0] : lang.id}
						</option>
					))}
				</select>
			</div>
		</div>
	);
}

export default App;
