import { useEffect, useRef, useState } from "react";
import DiffEditor from "./components/DiffEditor";
import { isLanguageID, type MonacoTheme } from "./monaco";
import PlainEditor, { PlainEditorSkeleton } from "./components/PlainEditor";
import * as monaco from "monaco-editor";
import type * as React from "react";

// const theme = 'vs-dark';
const initialLanguage = "typescript";
const themes = ["vs-dark", "light", "hc-black"] as MonacoTheme[];
const editorDivClasses = "h-[60vh] p-1";

type TextState = {
	text: string;
	file: {
		path: string;
		loadedText: string;
	};
};

function App() {
	// console.log(monaco.languages.getLanguages());
	const [theme, setTheme] = useState<MonacoTheme>("vs-dark");
	const [modelsReady, setModelsReady] = useState(false);
	const [editorType, setEditorType] = useState<"plain" | "diff">("plain");
	const originalModelRef = useRef<monaco.editor.ITextModel | null>(null);
	const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null);
	const [originalState, setOriginalState] = useState<TextState | null>(null);
	const [modifiedState, setModifiedState] = useState<TextState | null>(null);
	const [language, setLanguage] = useState(initialLanguage);
	const [originalFileOverlayActive, setOriginalFileOverlayActive] = useState(false);
	const [modifiedFileOverlayActive, setModifiedFileOverlayActive] = useState(false);

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
	}, [theme]);

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

	if (!modelsReady) {
		return (
			<>
				<div className={`flex gap-1 ${editorDivClasses}`}>
					<PlainEditorSkeleton />
					<PlainEditorSkeleton />
				</div>
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
				<button onClick={() => setEditorType((prev) => (prev === "plain" ? "diff" : "plain"))} type="button">
					Toggle Plain/Diff
				</button>
			</>
		);
	}
	return (
		<div className="monaco-editor size-full p-1">
			<h1 className="text-2xl mb-2">Language: {language}</h1>
			{editorType === "diff" ? (
				<div className={`${editorDivClasses}`}>
					<DiffEditor
						originalModel={originalModelRef.current}
						modifiedModel={modifiedModelRef.current}
						editable={false}
						sideBySide={true}
						diffAlgorithm="advanced"
						fontSize={14}
					/>
				</div>
			) : (
				<div className={`flex gap-1 w-screen ${editorDivClasses}`}>
					<PlainEditor
						model={originalModelRef.current}
						fontSize={14}
						onDrop={(files) => onFileDrop(files, setOriginalState)}
						overlayActiveState={[originalFileOverlayActive, setOriginalFileOverlayActive]}
					/>
					<PlainEditor
						model={modifiedModelRef.current}
						fontSize={14}
						onDrop={(files) => onFileDrop(files, setModifiedState)}
						overlayActiveState={[modifiedFileOverlayActive, setModifiedFileOverlayActive]}
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
			<button onClick={() => setEditorType((prev) => (prev === "plain" ? "diff" : "plain"))} type="button">
				Toggle Plain/Diff
			</button>
			<select value={language} onChange={(e) => setLanguage(e.target.value)} className="ml-2">
				{monaco.languages.getLanguages().map((lang) => (
					<option key={lang.id} value={lang.id}>
						{lang.aliases && lang.aliases.length > 0 ? lang.aliases[0] : lang.id}
					</option>
				))}
			</select>
		</div>
	);
}

export default App;
