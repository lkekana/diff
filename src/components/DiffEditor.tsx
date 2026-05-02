import { useEffect, useRef } from "react";
import { editor } from "monaco-editor";
import { type DiffAlgorithm, DEFAULT_FONTS } from "../monaco";
import EditorDiv from "./EditorDiv";

interface DiffEditorProps {
	originalModel: editor.ITextModel | null;
	modifiedModel: editor.ITextModel | null;
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
	const containerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
	const initializedRef = useRef(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to run this once on mount
	useEffect(() => {
		if (containerRef.current === null || initializedRef.current) return;
		initializedRef.current = true;

		const diffEditor = editor.createDiffEditor(containerRef.current, {
			readOnly: !editable,
			originalEditable: editable,

			automaticLayout: true,
			renderSideBySide: sideBySide,
			useInlineViewWhenSpaceIsLimited: false,

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
		});

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
		// <div
		// 	ref={containerRef}
		// 	className={`w-screen h-full min-h-100 ${className}`}
		// />
		<EditorDiv ref={containerRef} className={`w-full h-full ${className}`} />
	);
}
