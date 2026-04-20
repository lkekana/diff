import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { type DiffAlgorithm, DEFAULT_FONTS } from "../monaco";

interface DiffEditorProps {
	originalModel: monaco.editor.ITextModel | null;
	modifiedModel: monaco.editor.ITextModel | null;
	editable?: boolean;
	sideBySide?: boolean;
	diffAlgorithm?: DiffAlgorithm;
	fontSize?: number;
	className?: string;
}

export default function DiffEditor({
	originalModel,
	modifiedModel,
	editable = true,
	sideBySide = true,
	diffAlgorithm = "advanced",
	fontSize = 12,
	className = "",
}: DiffEditorProps) {
	// console.log(`Theme: ${theme}, Editable: ${editable}, SideBySide: ${sideBySide}, DiffAlgorithm: ${diffAlgorithm}, FontSize: ${fontSize}`);

	const containerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
	const initializedRef = useRef(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to run this once on mount
	useEffect(() => {
		if (containerRef.current === null || initializedRef.current) return;
		initializedRef.current = true;

		const diffEditor = monaco.editor.createDiffEditor(
			containerRef.current,
			{
				readOnly: !editable,
				originalEditable: editable,

				automaticLayout: true,
				renderSideBySide: sideBySide,
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

		const resizeObserver = new ResizeObserver(() => {
			diffEditor.layout();
		});
		resizeObserver.observe(containerRef.current);

		// Cleanup
		return () => {
			resizeObserver.disconnect();
			diffEditor.dispose();
			initializedRef.current = false;
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
		if (editorRef.current) {
			editorRef.current.updateOptions({
				readOnly: !editable,
				originalEditable: editable,
				renderSideBySide: sideBySide,
				diffAlgorithm,
				fontSize,
			});
			editorRef.current.layout();
		}
	}, [editable, sideBySide, diffAlgorithm, fontSize]);

	return (
		<div
			ref={containerRef}
			className={`w-screen h-full min-h-100 ${className}`}
		/>
	);
}
