import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import type { LanguageID, MonacoTheme, DiffAlgorithm } from "../monaco";
// import { platform } from '@tauri-apps/plugin-os';

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
const DEFAULT_FONTS = getOSFont();

// Initialize Monaco workers
if (!self.MonacoEnvironment) {
	self.MonacoEnvironment = {
		getWorker: () => new editorWorker(),
	};
}

interface DiffEditorProps {
	originalText: string;
	modifiedText: string;
	language?: LanguageID;
	theme?: MonacoTheme;
	editable?: boolean;
	sideBySide?: boolean;
	diffAlgorithm?: DiffAlgorithm;
	fontSize?: number;
	className?: string;
}

export default function DiffEditor({
	originalText,
	modifiedText,
	language = "plaintext",
	theme = "vs-dark",
	editable = true,
	sideBySide = true,
	diffAlgorithm = "advanced",
	fontSize = 12,
	className = "",
}: DiffEditorProps) {
	// console.log(`Language: ${language}, Theme: ${theme}, Editable: ${editable}, SideBySide: ${sideBySide}, DiffAlgorithm: ${diffAlgorithm}, FontSize: ${fontSize}`);

	const containerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
	const originalModelRef = useRef<monaco.editor.ITextModel | null>(null);
	const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to run this once on mount
	useEffect(() => {
		if (!containerRef.current) return;

		const diffEditor = monaco.editor.createDiffEditor(
			containerRef.current,
			{
				theme,

				// no edits allowed
				// readOnly: true,
				// originalEditable: false,

				// edits allowed
				//   readOnly: false,
				//   originalEditable: true,
				readOnly: !editable,
				originalEditable: editable,

				automaticLayout: true,
				renderSideBySide: sideBySide,
				// renderSideBySide: false,
				// minimap: { enabled: false },
				minimap: { enabled: true },
				find: {
					findOnType: true,
					autoFindInSelection: "always",
				},
				scrollBeyondLastLine: false,
				diffWordWrap: "on",
				diffAlgorithm: diffAlgorithm,
				diffCodeLens: true,
				// onlyShowAccessibleDiffEditor: true,
				//   padding: { top: 20 },
				fontSize: fontSize,
				fontFamily: DEFAULT_FONTS,
			},
		);

		const originalModel = monaco.editor.createModel(originalText, language);

		const modifiedModel = monaco.editor.createModel(modifiedText, language);

		diffEditor.setModel({
			original: originalModel,
			modified: modifiedModel,
		});
		editorRef.current = diffEditor;
		originalModelRef.current = originalModel;
		modifiedModelRef.current = modifiedModel;
		// editorRef.current.updateOptions

		// Cleanup
		return () => {
			originalModel.dispose();
			modifiedModel.dispose();
			diffEditor.dispose();
			editorRef.current = null;
			originalModelRef.current = null;
			modifiedModelRef.current = null;
		};
	}, []);

	// Sync content when props change
	useEffect(() => {
		if (originalModelRef.current)
			originalModelRef.current.setValue(originalText);
		if (modifiedModelRef.current)
			modifiedModelRef.current.setValue(modifiedText);
	}, [originalText, modifiedText]);

	// Sync language
	useEffect(() => {
		if (originalModelRef.current)
			monaco.editor.setModelLanguage(originalModelRef.current, language);
		if (modifiedModelRef.current)
			monaco.editor.setModelLanguage(modifiedModelRef.current, language);
	}, [language]);

	// Sync options
	useEffect(() => {
		if (editorRef.current)
			editorRef.current.updateOptions({
				readOnly: !editable,
				originalEditable: editable,
				renderSideBySide: sideBySide,
				diffAlgorithm,
				fontSize,
			});
	}, [editable, sideBySide, diffAlgorithm, fontSize]);

	// Sync theme
	useEffect(() => {
		monaco.editor.setTheme(theme);
	}, [theme]);

	return (
		<div
			ref={containerRef}
			className={className}
			style={{ width: "100vw", height: "100vh", minHeight: "400px" }}
		/>
	);
}
