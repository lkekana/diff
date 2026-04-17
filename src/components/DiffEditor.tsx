import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import {
	type LanguageID,
	type MonacoTheme,
	type DiffAlgorithm,
	DEFAULT_FONTS,
} from "../monaco";

// Initialize Monaco workers
if (!self.MonacoEnvironment) {
	self.MonacoEnvironment = {
		getWorker: () => new editorWorker(),
	};
}

interface DiffEditorProps {
	originalModel: monaco.editor.ITextModel | null;
	modifiedModel: monaco.editor.ITextModel | null;
	theme?: MonacoTheme;
	editable?: boolean;
	sideBySide?: boolean;
	diffAlgorithm?: DiffAlgorithm;
	fontSize?: number;
	className?: string;
}

export default function DiffEditor({
	originalModel,
	modifiedModel,
	theme = "vs-dark",
	editable = true,
	sideBySide = true,
	diffAlgorithm = "advanced",
	fontSize = 12,
	className = "",
}: DiffEditorProps) {
	// console.log(`Theme: ${theme}, Editable: ${editable}, SideBySide: ${sideBySide}, DiffAlgorithm: ${diffAlgorithm}, FontSize: ${fontSize}`);

	const containerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);

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

		if (originalModel !== null && modifiedModel !== null) {
			diffEditor.setModel({
				original: originalModel,
				modified: modifiedModel,
			});
		}
		editorRef.current = diffEditor;
		// editorRef.current.updateOptions

		// Cleanup
		return () => {
			diffEditor.dispose();
			editorRef.current = null;
		};
	}, []);

	// Sync models
	useEffect(() => {
		if (editorRef.current) {
			if (originalModel !== null && modifiedModel !== null) {
				editorRef.current.setModel({
					original: originalModel,
					modified: modifiedModel,
				});
			} else {
				editorRef.current.setModel(null);
			}
		}
	}, [originalModel, modifiedModel]);

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
			className={`w-screen h-full min-h-100 ${className}`}
		/>
	);
}
