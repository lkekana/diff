import { useEffect, useId, useRef, useState } from "react";
import { editor, KeyCode, KeyMod } from "monaco-editor";
import { type DiffAlgorithm, DEFAULT_FONTS, DiffActiveEditor, MonacoTheme } from "../monaco";
import EditorDiv from "./EditorDiv";
import { useDropzone } from "@lkekana/dropzone";
import { getDiffOverlayWidget, updateDiffOverlayWidget } from "./MonacoOverlay";

interface DiffEditorProps {
	originalModel: editor.ITextModel | null;
	modifiedModel: editor.ITextModel | null;
	activeTheme: MonacoTheme;
	activeEditor: [DiffActiveEditor, React.Dispatch<React.SetStateAction<DiffActiveEditor>>];
	editable?: boolean;
	sideBySide?: boolean;
	diffAlgorithm?: DiffAlgorithm;
	fontSize?: number;
	onOriginalFileDrop: (files: File[]) => void;
	onModifiedFileDrop: (files: File[]) => void;
	className?: string;
}

export default function DiffEditor({
	originalModel,
	modifiedModel,
	activeTheme,
	activeEditor: [activeEditor, setActiveEditor],
	editable = true,
	sideBySide = true,
	diffAlgorithm = "advanced",
	fontSize = 12,
	onOriginalFileDrop,
	onModifiedFileDrop,
	className = "",
}: DiffEditorProps) {
	const id = useId();
	const containerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
	const initializedRef = useRef(false);
	const [originalOverlayActiveState, setOriginalOverlayActiveState] = useState(false);
	const originalOverlayWidgetRef = useRef<editor.IOverlayWidget | null>(null);
	const originalOverlayDivRef = useRef<HTMLDivElement | null>(null);
	const originalOverlayMessageBoxRef = useRef<HTMLDivElement | null>(null);
	const [modifiedOverlayActiveState, setModifiedOverlayActiveState] = useState(false);
	const modifiedOverlayWidgetRef = useRef<editor.IOverlayWidget | null>(null);
	const modifiedOverlayDivRef = useRef<HTMLDivElement | null>(null);
	const modifiedOverlayMessageBoxRef = useRef<HTMLDivElement | null>(null);

	const { getRootProps, isDragActive, rootRef } = useDropzone({
		disabled: !sideBySide,
		dialogOnClick: false,
		dialogOnDoubleClick: true,
		maxFiles: 1,
		onDrop: (files) => {
			setOriginalOverlayActiveState(false);
			setModifiedOverlayActiveState(false);
			if (activeEditor === "original") {
				onOriginalFileDrop(files);
			}
			if (activeEditor === "modified") {
				onModifiedFileDrop(files);
			}
		},
		onDragEnter: () => {
			if (activeEditor === "original") {
				setOriginalOverlayActiveState(true);
			}
			if (activeEditor === "modified") {
				setModifiedOverlayActiveState(true);
			}
		},
		onDragLeave: (e) => {
			// Only hide if leaving the root container entirely
			if (rootRef.current?.contains(e.relatedTarget as Node)) {
				setOriginalOverlayActiveState(false);
				setModifiedOverlayActiveState(false);
			}
		},
	});

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
			dragAndDrop: false,
		});

		if (originalModel !== null && modifiedModel !== null) {
			diffEditor.setModel({
				original: originalModel,
				modified: modifiedModel,
			});
		}
		const originalEditor = diffEditor.getOriginalEditor();
		originalEditor.onDidFocusEditorWidget(() => {
			clearBlurTimeout();
			setActiveEditor("original");
		});
		originalEditor.onDidFocusEditorText(() => {
			clearBlurTimeout();
			setActiveEditor("original");
		});
		// originalEditor.onDidBlurEditorText(() => {});

		const modifiedEditor = diffEditor.getModifiedEditor();
		modifiedEditor.onDidFocusEditorWidget(() => {
			clearBlurTimeout();
			setActiveEditor("modified");
		});
		modifiedEditor.onDidFocusEditorText(() => {
			clearBlurTimeout();
			setActiveEditor("modified");
		});
		// modifiedEditor.onDidBlurEditorText(() => {});

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

		originalOverlayWidgetRef.current = {
			getId: () => `diff-editor-original-overlay-${id}`,
			getDomNode: () =>
				getDiffOverlayWidget({
					overlayActiveState: [originalOverlayActiveState, setOriginalOverlayActiveState],
					overlayDivRef: originalOverlayDivRef,
					overlayMessageBoxRef: originalOverlayMessageBoxRef,
					editor: originalEditor,
					divProps: getRootProps(),
				}),
			getPosition: () => null,
		} as editor.IOverlayWidget;

		modifiedOverlayWidgetRef.current = {
			getId: () => `diff-editor-modified-overlay-${id}`,
			getDomNode: () =>
				getDiffOverlayWidget({
					overlayActiveState: [modifiedOverlayActiveState, setModifiedOverlayActiveState],
					overlayDivRef: modifiedOverlayDivRef,
					overlayMessageBoxRef: modifiedOverlayMessageBoxRef,
					editor: modifiedEditor,
					divProps: getRootProps(),
				}),
			getPosition: () => null,
		} as editor.IOverlayWidget;

		originalEditor.addOverlayWidget(originalOverlayWidgetRef.current);
		modifiedEditor.addOverlayWidget(modifiedOverlayWidgetRef.current);

		originalEditor.layout();
		modifiedEditor.layout();

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (originalOverlayDivRef.current !== null) {
					originalOverlayDivRef.current.style.height = `${entry.contentRect.height}px`;
				}
				if (modifiedOverlayDivRef.current !== null) {
					modifiedOverlayDivRef.current.style.height = `${entry.contentRect.height}px`;
				}
			}
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

	// Toggle overlay visibility based on drag state and internal overlayActiveState state
	useEffect(() => {
		const editor = editorRef.current;
		if (editor === null) return;

		const originalWidget = originalOverlayWidgetRef.current;
		const originalOverlayDiv = originalOverlayDivRef.current;
		const originalMessageBox = originalOverlayMessageBoxRef.current;
		if (originalWidget !== null && originalOverlayDiv !== null && originalMessageBox !== null) {
			updateDiffOverlayWidget({
				activeEditor,
				widgetParent: "original",
				overlayDiv: originalOverlayDiv,
				messageBox: originalMessageBox,
				activeTheme,
				isDragActive,
			});

			const shouldShowOriginalOverlay =
				originalOverlayActiveState || (isDragActive && activeEditor === "original");
			const originalEditor = editor.getOriginalEditor();
			if (shouldShowOriginalOverlay) {
				if (originalOverlayDiv.parentNode === null) {
					originalEditor.addOverlayWidget(originalWidget);
				}
			} else {
				originalEditor.removeOverlayWidget(originalWidget);
			}
			originalEditor.layout();
		}

		const modifiedWidget = modifiedOverlayWidgetRef.current;
		const modifiedOverlayDiv = modifiedOverlayDivRef.current;
		const modifiedMessageBox = modifiedOverlayMessageBoxRef.current;
		if (modifiedWidget !== null && modifiedOverlayDiv !== null && modifiedMessageBox !== null) {
			updateDiffOverlayWidget({
				activeEditor,
				widgetParent: "modified",
				overlayDiv: modifiedOverlayDiv,
				messageBox: modifiedMessageBox,
				activeTheme,
				isDragActive,
			});

			const shouldShowModifiedOverlay =
				modifiedOverlayActiveState || (isDragActive && activeEditor === "modified");
			const modifiedEditor = editor.getModifiedEditor();
			if (shouldShowModifiedOverlay) {
				if (modifiedOverlayDiv.parentNode === null) {
					modifiedEditor.addOverlayWidget(modifiedWidget);
				}
			} else {
				modifiedEditor.removeOverlayWidget(modifiedWidget);
			}
			modifiedEditor.layout();
		}

		editor.layout();
	}, [originalOverlayActiveState, isDragActive, activeTheme, activeEditor, modifiedOverlayActiveState]);

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
		<div {...getRootProps()} className="flex items-center justify-center w-full h-full min-w-0 flex-1">
			<EditorDiv ref={containerRef} className={`w-full h-full ${className}`} />
		</div>
	);
}
