import { useCallback, useEffect, useRef, useState } from "react";
import DiffEditor from "./components/DiffEditor";
import { ActiveEditor, isLanguageID, type MonacoTheme } from "./monaco";
import PlainEditor, { PlainEditorSkeleton } from "./components/PlainEditor";
import { editor, IDisposable, KeyCode, KeyMod, languages } from "monaco-editor";
import type * as React from "react";
import toast, { Toaster, ToastOptions } from "react-hot-toast";
import { FsErrorCode } from "../electron/fs-errors";

const PaletteIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
		<circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
		<circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
		<circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
		<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
	</svg>
);

const SplitViewIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
		<line x1="12" y1="3" x2="12" y2="21"></line>
	</svg>
);

const SingleViewIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
	</svg>
);

// Lucide: file
// const FileIcon = () => (
// 	<svg
// 		xmlns="http://www.w3.org/2000/svg"
// 		width="16"
// 		height="16"
// 		viewBox="0 0 24 24"
// 		fill="none"
// 		stroke="currentColor"
// 		strokeWidth="2"
// 		strokeLinecap="round"
// 		strokeLinejoin="round"

// 		// class="lucide lucide-file-icon lucide-file"
// 	>
// 		<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
// 		<path d="M14 2v5a1 1 0 0 0 1 1h5" />
// 	</svg>
// );

// Lucide: x
const CloseIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		// class="lucide lucide-x-icon lucide-x"
	>
		<path d="M18 6 6 18" />
		<path d="m6 6 12 12" />
	</svg>
);

// Lucide: loader-circle
const LoadingIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		// class="lucide lucide-loader-circle-icon lucide-loader-circle"
	>
		<path d="M21 12a9 9 0 1 1-6.219-8.56" />
	</svg>
);

// Lucide: arrow-left-right
const SwapIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		// class="lucide lucide-arrow-left-right-icon lucide-arrow-left-right"
	>
		<path d="M8 3 4 7l4 4" />
		<path d="M4 7h16" />
		<path d="m16 21 4-4-4-4" />
		<path d="M20 17H4" />
	</svg>
);

const TOGGLE_EDITOR_ENABLED = false;

// const theme = 'vs-dark';
const fontSize = 12;
const originalDefaultText = `function add(a, b) {\n\treturn a - b;\n}`;
const modifiedDefaultText = `function add(a, b) {\n\treturn a + b; // Should've been addition\n}`;

const initialLanguage = "typescript";
const themes = ["vs-dark", "light", "hc-black"] as MonacoTheme[];

type LoadedFile = {
	path: string;
	loadedText: string;
};

const getDefaultPaths = async (): Promise<{ original: string; modified: string }> => {
	try {
		const appFolder = await window.electronAPI.getAppFolder();
		const defaultFilesFolder = await window.electronAPI.joinPaths(appFolder, "default");
		const [defaultOriginalPath, defaultModifiedPath] = await Promise.all([
			window.electronAPI.joinPaths(defaultFilesFolder, "original.ts"),
			window.electronAPI.joinPaths(defaultFilesFolder, "modified.ts"),
		]);
		return { original: defaultOriginalPath, modified: defaultModifiedPath };
	} catch (error) {
		console.error("Failed to get default file paths:", error);
		throw error;
	}
};

function App() {
	// console.log(languages.getLanguages());
	const [theme, setTheme] = useState<MonacoTheme>("vs-dark");
	const [buttonColors, setButtonColors] = useState("bg-gray-700 hover:bg-gray-600");
	const [toastOptions, setToastOptions] = useState<ToastOptions>({
		style: {
			borderRadius: "8px",
			background: "#323232",
			color: "#fff",
			fontSize: "14px",
			zIndex: 9999,
		},
		className: `monaco-editor`,
	} as ToastOptions);
	const [modelsReady, setModelsReady] = useState(false);
	const [editorType, setEditorType] = useState<"plain" | "diff">("plain");

	const originalModelRef = useRef<editor.ITextModel | null>(null);
	const originalModelContentChangeListenerRef = useRef<IDisposable | null>(null);
	const modifiedModelRef = useRef<editor.ITextModel | null>(null);
	const modifiedModelContentChangeListenerRef = useRef<IDisposable | null>(null);
	const originalLoadedTextRef = useRef<string | null>(null);
	const modifiedLoadedTextRef = useRef<string | null>(null);

	const [originalState, setOriginalState] = useState<LoadedFile | null>(null);
	const [modifiedState, setModifiedState] = useState<LoadedFile | null>(null);
	const [language, setLanguage] = useState(initialLanguage);
	const [originalFileOverlayActive, setOriginalFileOverlayActive] = useState(true);
	const [modifiedFileOverlayActive, setModifiedFileOverlayActive] = useState(true);
	const [sideBySide, setSideBySide] = useState(true);
	const isMountedRef = useRef(true);
	const [isLoadingFiles, setIsLoadingFiles] = useState(false);
	const [originalIsDirty, setOriginalIsDirty] = useState(false);
	const [modifiedIsDirty, setModifiedIsDirty] = useState(false);
	const [activeEditor, setActiveEditor] = useState<ActiveEditor>(null);

	const anyFileLoaded = !originalFileOverlayActive || !modifiedFileOverlayActive;

	const setupModels = useCallback(async () => {
		let originalTextContent = originalDefaultText;
		let defaultOriginalPath: string | undefined = undefined;
		let modifiedTextContent = modifiedDefaultText;
		let defaultModifiedPath: string | undefined = undefined;
		try {
			const { original, modified } = await getDefaultPaths();
			defaultOriginalPath = original;
			defaultModifiedPath = modified;

			const [defaultOriginal, defaultModified] = await Promise.all([
				window.electronAPI.readTextFile(original),
				window.electronAPI.readTextFile(modified),
			]);

			if (defaultOriginal.isBinary || defaultOriginal.content === undefined) {
				console.error(
					`Default original file at ${defaultOriginalPath} is invalid. ${defaultOriginal.isBinary ? "File is binary." : "No content found."} Content cannot be loaded into editor.`,
				);
			} else {
				originalTextContent = defaultOriginal.content;
			}

			if (defaultModified.isBinary || defaultModified.content === undefined) {
				console.error(
					`Default modified file at ${defaultModifiedPath} is invalid. ${defaultModified.isBinary ? "File is binary." : "No content found."} Content cannot be loaded into editor.`,
				);
			} else {
				modifiedTextContent = defaultModified.content;
			}
		} catch (error) {
			console.error("Failed to setup Monaco models:", error);
		}

		const originalModel = editor.createModel(originalTextContent, initialLanguage);
		const originalChangeEvent = originalModel.onDidChangeContent(() => {
			setActiveEditor("original");
			const currentText = originalModel.getValue();
			console.log("Original model content changed. Current text length:", currentText.length);
			const loadedText = originalLoadedTextRef.current;
			if (loadedText !== null && currentText !== loadedText) {
				setOriginalIsDirty(true);
			} else {
				setOriginalIsDirty(false);
			}
		});
		const modifiedModel = editor.createModel(modifiedTextContent, initialLanguage);
		const modifiedChangeEvent = modifiedModel.onDidChangeContent(() => {
			setActiveEditor("modified");
			const currentText = modifiedModel.getValue();
			console.log("Modified model content changed. Current text length:", currentText.length);
			const loadedText = modifiedLoadedTextRef.current;
			if (loadedText !== null && currentText !== loadedText) {
				setModifiedIsDirty(true);
			} else {
				setModifiedIsDirty(false);
			}
		});

		originalModelRef.current = originalModel;
		originalModelContentChangeListenerRef.current = originalChangeEvent;
		modifiedModelRef.current = modifiedModel;
		modifiedModelContentChangeListenerRef.current = modifiedChangeEvent;

		if (isMountedRef.current) {
			setModelsReady(true);
			setLanguage(initialLanguage);
		}
	}, []);

	const reloadDefaultModels = useCallback(async () => {
		const oldOriginalModel = originalModelRef.current;
		const oldModifiedModel = modifiedModelRef.current;
		const oldOriginalChangeListener = originalModelContentChangeListenerRef.current;
		const oldModifiedChangeListener = modifiedModelContentChangeListenerRef.current;
		setIsLoadingFiles(true);

		// Reset state
		setModelsReady(false);
		setEditorType("plain");
		setOriginalState(null);
		setModifiedState(null);
		setOriginalFileOverlayActive(true);
		setModifiedFileOverlayActive(true);
		setSideBySide(true);
		setOriginalIsDirty(false);
		setModifiedIsDirty(false);

		setTimeout(() => {
			if (oldOriginalModel !== null) {
				oldOriginalModel.dispose();
				originalModelRef.current = null;
			}
			if (oldModifiedModel !== null) {
				oldModifiedModel.dispose();
				modifiedModelRef.current = null;
			}
			if (oldOriginalChangeListener !== null) {
				oldOriginalChangeListener.dispose();
				originalModelContentChangeListenerRef.current = null;
			}
			if (oldModifiedChangeListener !== null) {
				oldModifiedChangeListener.dispose();
				modifiedModelContentChangeListenerRef.current = null;
			}
			if (originalLoadedTextRef.current !== null) {
				originalLoadedTextRef.current = null;
			}
			if (modifiedLoadedTextRef.current !== null) {
				modifiedLoadedTextRef.current = null;
			}
		}, 0); // Run timeout at the end of the event loop to allow state to reset before creating new models

		try {
			await setupModels();
		} catch (error) {
			console.error("Failed to reload default models:", error);
		} finally {
			setIsLoadingFiles(false);
		}
	}, [setupModels]);

	const swapModels = useCallback(() => {
		if (originalModelRef.current !== null && modifiedModelRef.current !== null) {
			const tempModel = originalModelRef.current;
			originalModelRef.current = modifiedModelRef.current;
			modifiedModelRef.current = tempModel;

			const originalOverlayWasActive = originalFileOverlayActive;
			const modifiedOverlayWasActive = modifiedFileOverlayActive;
			console.log(
				"Overlay states before swap - Original:",
				originalOverlayWasActive,
				"Modified:",
				modifiedOverlayWasActive,
			);
			setOriginalFileOverlayActive(modifiedOverlayWasActive);
			setModifiedFileOverlayActive(originalOverlayWasActive);

			// Force editor to update models
			setModelsReady(false);
			setTimeout(() => setModelsReady(true), 0);

			// Swap states to keep file info and overlays in sync
			const tempOriginalState = originalState;
			const tempModifiedState = modifiedState;
			setOriginalState(tempModifiedState);
			setModifiedState(tempOriginalState);
		}
	}, [modifiedFileOverlayActive, originalFileOverlayActive, modifiedState, originalState]);

	const onFileDrop = useCallback(
		(
			files: File[],
			setState: (value: React.SetStateAction<LoadedFile | null>) => void,
			targetModelRef: React.MutableRefObject<editor.ITextModel | null>,
		) => {
			// console.log("onFileDrop called with files:", files, "Event:", event);
			if (files.length === 0) return;
			const file = files[0];
			const getFileData = async () => {
				try {
					const path = await window.electronAPI.getFilePath(file);
					console.log("File:", file, "Path:", path);
					const reader = new FileReader();
					reader.onload = () => {
						const loadedText = reader.result as string;

						const model = targetModelRef.current;
						if (model !== null) {
							model.setValue(loadedText);
						}

						console.log(`Loaded file content (first 100 chars): ${loadedText.slice(0, 100)}`);
						setState({ path, loadedText });
					};
					reader.readAsText(file);

					const detectedLanguage = await window.electronAPI.detectLanguage(path);
					if (detectedLanguage !== null && detectedLanguage !== language) {
						const isLang = isLanguageID(detectedLanguage);
						const monacoHasLang = languages.getLanguages().some((l) => l.id === detectedLanguage);
						console.log(
							`Detected language: ${detectedLanguage}, isLanguageID: ${isLang}, Monaco supports: ${monacoHasLang}`,
						);
						if (isLang && monacoHasLang) {
							setLanguage(detectedLanguage);
						}
					}
				} catch (error) {
					console.error("Failed to load file:", error);
				}
			};

			getFileData();
		},
		[language],
	);

	const saveFile = useCallback(
		async (target: "original" | "modified") => {
			const isOriginal = target === "original";

			const model = isOriginal ? originalModelRef.current : modifiedModelRef.current;
			const state = isOriginal ? originalState : modifiedState;
			const setState = isOriginal ? setOriginalState : setModifiedState;
			const setIsDirty = isOriginal ? setOriginalIsDirty : setModifiedIsDirty;

			if (model === null) {
				console.warn(`No model found for ${target}. Save action aborted.`);
				return;
			}

			const currentText = model.getValue();
			const isDirty = state === null || currentText !== state.loadedText;
			if (!isDirty) {
				console.log("Original model has no changes to save.");
				return;
			}

			// get default extension for language
			const extension = languages.getLanguages().find((l) => l.id === language)?.extensions?.[0] ?? ".txt";

			try {
				const result = await (state !== null && state.path
					? window.electronAPI.saveFileSilently(state.path, currentText)
					: window.electronAPI.saveFileWithDialog(
							`${target}-${Date.now()}${extension}`,
							target,
							currentText,
						));
				console.log("Save result:", result);

				if (result.path) {
					console.log(`File saved successfully at ${result.path}`);

					toast.success(`${target.charAt(0).toUpperCase() + target.slice(1)} file saved!`, toastOptions);

					setState({ path: result.path, loadedText: currentText });
					setIsDirty(false);
				} else if (result.otherError) {
					toast.error(
						`Could not save ${target} file. Error: ${result.otherError}`,
						toastOptions,
					);
				} else if (result.posixErrorCode) {
					switch (result.posixErrorCode) {
						case FsErrorCode.PERMISSION_DENIED:
						case FsErrorCode.OPERATION_NOT_PERMITTED:
							toast.error(
								`Permission denied when saving ${target} file. Cannot write to the specified location.`,
								toastOptions,
							);
							break;

						case FsErrorCode.NO_SPACE:
							toast.error(`Disk is full. Could not save ${target} file.`, toastOptions);
							break;

						case FsErrorCode.NOT_FOUND:
							toast.error(`Directory not found. Could not save ${target} file.`, toastOptions);
							break;

						default:
							toast.error(
								`Could not save ${target} file. Error code: ${result.posixErrorCode}`,
								toastOptions,
							);
							break;
					}
				}
			} catch (error) {
				console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
				toast.error(error instanceof Error ? error.message : `Could not save ${target} file.`, toastOptions);
				console.error(error);
			}
		},
		[originalState, modifiedState, language, toastOptions],
	);

	const saveFileRef = useRef(saveFile);
	useEffect(() => {
		saveFileRef.current = saveFile;
	}, [saveFile]);

	useEffect(() => {
		editor.addEditorAction({
			id: "save-file",
			label: "Save Active File",
			keybindings: [KeyMod.CtrlCmd | KeyCode.KeyS],
			run: (activeMonacoEditor) => {
				if (originalModelRef.current === null && modifiedModelRef.current === null) {
					console.warn("No models are currently loaded. Save action aborted.");
					return;
				}

				const activeModel = activeMonacoEditor.getModel();
				if (activeModel === null) {
					console.warn("Active editor has no model somehow? Save action aborted.");
					return;
				}

				if (activeModel.id === originalModelRef.current?.id) {
					console.log("Active model is original. Triggering save for original.");
					saveFileRef.current?.("original");
				} else if (activeModel === modifiedModelRef.current) {
					console.log("Active model is modified. Triggering save for modified.");
					saveFileRef.current?.("modified");
				}
			},
		});
	}, []);

	useEffect(() => {
		originalLoadedTextRef.current = originalState?.loadedText ?? null;
	}, [originalState?.loadedText]);

	useEffect(() => {
		modifiedLoadedTextRef.current = modifiedState?.loadedText ?? null;
	}, [modifiedState?.loadedText]);

	// Sync theme with Monaco
	useEffect(() => {
		editor.setTheme(theme);
		if (theme === ("light" as MonacoTheme)) {
			setButtonColors("bg-gray-300 hover:bg-gray-200");
			setToastOptions({
				style: {
					borderRadius: "8px",
					background: "#d1d5dc",
					color: "#101828",
					fontSize: "14px",
					zIndex: 9999,
				},
				className: `monaco-editor`,
			} as ToastOptions);
		} else {
			setButtonColors("bg-gray-700 hover:bg-gray-600");
			setToastOptions({
				style: {
					borderRadius: "8px",
					background: "#323232",
					color: "#fff",
					fontSize: "14px",
					zIndex: 9999,
				},
				className: `monaco-editor`,
			} as ToastOptions);
		}
	}, [theme]);

	// Sync language changes with Monaco models
	useEffect(() => {
		if (originalModelRef.current && originalModelRef.current.getLanguageId() !== language) {
			editor.setModelLanguage(originalModelRef.current, language);
		}
		if (modifiedModelRef.current && modifiedModelRef.current.getLanguageId() !== language) {
			editor.setModelLanguage(modifiedModelRef.current, language);
		}
	}, [language]);

	useEffect(() => {
		if (!originalFileOverlayActive && !modifiedFileOverlayActive) {
			if (editorType !== "diff") setEditorType("diff");
		} else {
			if (editorType !== "plain") setEditorType("plain");
		}
	}, [originalFileOverlayActive, modifiedFileOverlayActive, editorType]);

	useEffect(() => {
		console.log("Active editor changed:", activeEditor);
	}, [activeEditor]);

	// Setup Monaco models on mount and cleanup on unmount
	// biome-ignore lint/correctness/useExhaustiveDependencies: setupModels is memoized and won't change, and we only want to run this on mount/unmount
	useEffect(() => {
		isMountedRef.current = true;
		setupModels();

		// Cleanup
		return () => {
			isMountedRef.current = false;
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

	const anyChanges = originalIsDirty || modifiedIsDirty;

	// print window dimensions
	console.log(`Window dimensions: ${window.innerWidth}x${window.innerHeight}`);

	return (
		<div className="monaco-editor flex flex-col h-screen w-screen overflow-hidden p-1 bg-gray-900 text-white">
			<Toaster position="bottom-center" />

			{/* <h1 className="text-2xl mb-2">Language: {language}</h1> */}

			{/* Editor(s) */}
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
							activeTheme={theme}
							activeEditor={[activeEditor, setActiveEditor]}
							editable={true}
							sideBySide={sideBySide}
							diffAlgorithm="advanced"
							fontSize={fontSize}
							// originalOverlayActiveState={[true, setOriginalFileOverlayActive]}
							// modifiedOverlayActiveState={[true, setModifiedFileOverlayActive]}
							onOriginalFileDrop={(files) => onFileDrop(files, setOriginalState, originalModelRef)}
							onModifiedFileDrop={(files) => onFileDrop(files, setModifiedState, modifiedModelRef)}
						/>
					</div>
				) : (
					<div className="flex gap-1 w-full h-full">
						<PlainEditor
							model={originalModelRef.current}
							fontSize={fontSize}
							onDrop={(files) => onFileDrop(files, setOriginalState, originalModelRef)}
							overlayActiveState={[originalFileOverlayActive, setOriginalFileOverlayActive]}
							activeTheme={theme}
							onActive={() => setActiveEditor("original")}
						/>
						<PlainEditor
							model={modifiedModelRef.current}
							fontSize={fontSize}
							onDrop={(files) => onFileDrop(files, setModifiedState, modifiedModelRef)}
							overlayActiveState={[modifiedFileOverlayActive, setModifiedFileOverlayActive]}
							activeTheme={theme}
							onActive={() => setActiveEditor("modified")}
						/>
					</div>
				)}
			</div>

			{/* File Changes Status Bar */}
			{anyChanges && (
				<div className="flex w-full mt-1">
					<div className="w-1/2 flex justify-center items-center px-1">
						{originalIsDirty && (
							<span className="text-xs text-orange-400 font-medium animate-pulse flex items-center gap-1">
								<span className="w-2 h-2 bg-orange-500 rounded-full inline-block"></span>
								Original Unsaved
							</span>
						)}
					</div>
					<div className="w-1/2 flex justify-center items-center px-1">
						{modifiedIsDirty && (
							<span className="text-xs text-orange-400 font-medium animate-pulse flex items-center gap-1">
								<span className="w-2 h-2 bg-orange-500 rounded-full inline-block"></span>
								Modified Unsaved
							</span>
						)}
					</div>
				</div>
			)}

			{/* Footer */}
			<div
				className={`flex items-center justify-between gap-2 p-2 rounded mt-1 shrink-0 ${theme === ("light" as MonacoTheme) ? "bg-gray-200" : "bg-gray-800"}`}
			>
				{/* LHS Buttons */}
				<div className="flex items-center gap-2">
					<button
						onClick={() =>
							setTheme((prev) => {
								const currentIndex = themes.indexOf(prev);
								const nextIndex = (currentIndex + 1) % themes.length;
								return themes[nextIndex];
							})
						}
						type="button"
						className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${buttonColors}`}
						title={`Toggle Theme (Active: ${theme})`}
					>
						<PaletteIcon />
						<span className="hidden sm:inline">Theme</span>
					</button>

					{TOGGLE_EDITOR_ENABLED && (
						<button
							onClick={() => setEditorType((prev) => (prev === "plain" ? "diff" : "plain"))}
							type="button"
							className={`px-3 py-1 rounded text-sm ${buttonColors}`}
						>
							Toggle Plain/Diff
						</button>
					)}
					{editorType === "diff" && (
						<button
							onClick={() => setSideBySide((prev) => !prev)}
							type="button"
							className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${buttonColors}`}
							title={sideBySide ? "Switch to Unified View" : "Switch to Side-by-Side View"}
						>
							{sideBySide ? <SplitViewIcon /> : <SingleViewIcon />}
							<span className="hidden sm:inline">{sideBySide ? "Split" : "Unified"}</span>
						</button>
					)}
				</div>

				{/* RHS Buttons */}
				<div className="flex items-center gap-2">
					<select
						value={language}
						onChange={(e) => setLanguage(e.target.value)}
						className={`ml-2 px-2 py-1 rounded text-sm border-none outline-none ${buttonColors}`}
					>
						{languages.getLanguages().map((lang) => (
							<option key={lang.id} value={lang.id}>
								{lang.aliases && lang.aliases.length > 0 ? lang.aliases[0] : lang.id}
							</option>
						))}
					</select>
					<button
						onClick={reloadDefaultModels}
						disabled={isLoadingFiles || !anyFileLoaded}
						type="button"
						className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${isLoadingFiles || !anyFileLoaded ? "opacity-50" : ""} ${isLoadingFiles ? "cursor-wait" : ""} ${buttonColors}`}
						title={isLoadingFiles ? "Reloading..." : "Close Files"}
					>
						{isLoadingFiles ? (
							<span className="animate-spin">
								<LoadingIcon />
							</span>
						) : (
							<CloseIcon />
						)}
					</button>
					<button
						onClick={swapModels}
						disabled={isLoadingFiles || !anyFileLoaded}
						type="button"
						className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${isLoadingFiles || !anyFileLoaded ? "opacity-50" : ""} ${buttonColors}`}
						title={"Swap Original and Modified"}
					>
						<SwapIcon />
					</button>
				</div>
			</div>
		</div>
	);
}

export default App;
