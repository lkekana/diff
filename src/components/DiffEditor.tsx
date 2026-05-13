import { useEffect, useRef } from "react";
import { editor } from "monaco-editor";
import { type DiffAlgorithm, DEFAULT_FONTS, DiffActiveEditor } from "../monaco";
import EditorDiv from "./EditorDiv";

interface DiffEditorProps {
	originalModel: editor.ITextModel | null;
	modifiedModel: editor.ITextModel | null;
	activeEditor: [DiffActiveEditor, React.Dispatch<React.SetStateAction<DiffActiveEditor>>];
	editable?: boolean;
	sideBySide?: boolean;
	diffAlgorithm?: DiffAlgorithm;
	fontSize?: number;
	className?: string;
}

export default function DiffEditor({
	originalModel,
	modifiedModel,
	activeEditor: [activeEditor, setActiveEditor],
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

		let blurTimeout: ReturnType<typeof setTimeout> | null = null;

		const clearBlurTimeout = () => {
			if (blurTimeout) {
				clearTimeout(blurTimeout);
				blurTimeout = null;
			}
		};

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
		diffEditor.getOriginalEditor().onDidFocusEditorWidget(() => {
			// alert("Focused original editor");
			clearBlurTimeout();
			setActiveEditor("original");
		});
		// diffEditor.getOriginalEditor().onDidBlurEditorText(() => {});
		diffEditor.getModifiedEditor().onDidFocusEditorWidget(() => {
			// alert("Focused modified editor");
			clearBlurTimeout();
			setActiveEditor("modified");
		});
		// diffEditor.getModifiedEditor().onDidBlurEditorText(() => {});

		containerRef.current.onblur = () => {
			// alert("Blurred diff editor");
			setActiveEditor(null);
		};

		// Track blur from the container with a small delay
		// to allow focus events to fire first
		const handleContainerBlur = () => {
			blurTimeout = setTimeout(() => {
				// Check if any editor pane still has focus
				const activeElement = document.activeElement;
				const container = containerRef.current;
				if (container && !container.contains(activeElement)) {
					setActiveEditor(null);
				}
			}, 50); // Small delay to let focus events propagate
		};

		containerRef.current.addEventListener("focusout", handleContainerBlur);
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
