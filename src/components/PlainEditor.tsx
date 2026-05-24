import { useEffect, useId, useRef } from "react";
import { editor as monacoEditor } from "monaco-editor";
import {
	DEFAULT_FONTS,
	MonacoTheme,
} from "../monaco";
import EditorDiv from "./EditorDiv";
import { useDropzone } from "@lkekana/dropzone";
import { getOverlayWidget, updateOverlayWidget } from "./MonacoOverlay";

interface PlainEditorProps {
	model: monacoEditor.ITextModel | null;
	activeTheme: MonacoTheme;
	fontSize?: number;
	className?: string;
	readOnly?: boolean;
	onDrop: (files: File[]) => void;
	onActive: () => void;
	overlayActiveState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
}

export default function PlainEditor({
	model,
	activeTheme,
	fontSize = 12,
	className = "",
	readOnly = false,
	onDrop,
	onActive,
	overlayActiveState: [overlayActiveState, setOverlayActiveState],
}: PlainEditorProps) {
	const id = useId();
	const containerRef = useRef<HTMLDivElement>(null); // no <T | null> because our usage is readonly
	const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
	const overlayWidgetRef = useRef<monacoEditor.IOverlayWidget | null>(null);
	const overlayDivRef = useRef<HTMLDivElement | null>(null);
	const overlayMessageBoxRef = useRef<HTMLDivElement | null>(null);
	const initializedRef = useRef(false);

	const { getRootProps, getInputProps, isDragActive, rootRef } = useDropzone({
		dialogOnClick: false,
		dialogOnDoubleClick: true,
		maxFiles: 1,
		onDrop: (files) => {
			setOverlayActiveState(false);
			onDrop(files);
		},
		onDragEnter: () => setOverlayActiveState(true),
		onDragLeave: (e) => {
			// Only hide if leaving the root container entirely
			if (rootRef.current?.contains(e.relatedTarget as Node)) {
				setOverlayActiveState(false);
			}
		},
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: Run once on mount
	useEffect(() => {
		if (containerRef.current === null || initializedRef.current) return;
		initializedRef.current = true;

		const editor = monacoEditor.create(containerRef.current, {
			readOnly: readOnly,
			automaticLayout: true,
			minimap: { enabled: true },
			find: {
				findOnType: true,
				autoFindInSelection: "always",
			},
			scrollBeyondLastLine: false,
			fontSize: fontSize,
			fontFamily: DEFAULT_FONTS,
			padding: {
				top: 10,
				bottom: 10,
			},
			dragAndDrop: false,
		});

		editor.onDidFocusEditorWidget(() => {
			onActive();
		});
		editor.onDidFocusEditorText(() => {
			onActive();
		});

		editor.setModel(model);
		editorRef.current = editor;

		// Create and conditionally add overlay widget
		overlayWidgetRef.current = {
			getId: () => `plain-editor-overlay-${id}`,
			getDomNode: () =>
				getOverlayWidget({
					overlayActiveState: [overlayActiveState, setOverlayActiveState],
					overlayDivRef,
					overlayMessageBoxRef,
					editor,
				}),
			getPosition: () => null,
		} as monacoEditor.IOverlayWidget;

		// Show overlay if either internal state or drag state indicates it should be visible
		// const shouldShowOverlay = overlayActiveState || isDragActive;
		// if (shouldShowOverlay && overlayWidgetRef.current !== null) {
		// editor.addOverlayWidget(overlayWidgetRef.current);
		// editor.layout();
		// }

		editor.addOverlayWidget(overlayWidgetRef.current);
		editor.layout();

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (overlayDivRef.current !== null) {
					overlayDivRef.current.style.height = `${entry.contentRect.height}px`;
				}
			}
			editor.layout();
		});
		resizeObserver.observe(containerRef.current);

		// Cleanup
		return () => {
			if (overlayWidgetRef.current) {
				editor.removeOverlayWidget(overlayWidgetRef.current);
			}
			editor.dispose();
			initializedRef.current = false;
			editorRef.current = null;
			overlayWidgetRef.current = null;
			resizeObserver.disconnect();
		};
	}, []);

	// Toggle overlay visibility based on drag state and internal overlayActiveState state
	useEffect(() => {
		const editor = editorRef.current;
		const widget = overlayWidgetRef.current;
		const overlayDiv = overlayDivRef.current;
		const messageBox = overlayMessageBoxRef.current;
		if (editor === null || widget === null || overlayDiv === null || messageBox === null) return;
		updateOverlayWidget({
			overlayDiv,
			messageBox,
			activeTheme,
			isDragActive,
		});

		const shouldShowOverlay = overlayActiveState || isDragActive;
		if (shouldShowOverlay) {
			if (overlayDiv.parentNode === null) {
				editor.addOverlayWidget(widget);
			}
		} else {
			editor.removeOverlayWidget(widget);
		}

		editor.layout();
	}, [overlayActiveState, isDragActive, activeTheme]);

	// Sync model
	useEffect(() => {
		if (editorRef.current) {
			editorRef.current.setModel(model);
		}
	}, [model]);

	// Sync options
	useEffect(() => {
		if (editorRef.current) {
			editorRef.current.updateOptions({
				fontSize,
				readOnly: readOnly,
			});
			editorRef.current.layout();
		}
	}, [fontSize, readOnly]);

	return (
		<div {...getRootProps()} className="flex items-center justify-center w-full h-full min-w-0 flex-1">
			<input {...getInputProps()} />
			<EditorDiv ref={containerRef} className={`${className}`} />
		</div>
	);
}

export function PlainEditorSkeleton() {
	return <div className="monaco-editor w-full h-full min-h-100" />;
}
