import { useCallback, useEffect, useId, useRef } from "react";
import { editor as monacoEditor } from "monaco-editor";
import { DEFAULT_FONTS, MESSAGE_BOX_BASE_CLASSES, MESSAGE_BOX_DARK_CLASSES, MESSAGE_BOX_LIGHT_CLASSES, MonacoTheme, OVERLAY_BASE_CLASSES, OVERLAY_DARK_CLASSES, OVERLAY_LIGHT_CLASSES } from "../monaco";
import EditorDiv from "./EditorDiv";
import { useDropzone } from "@lkekana/dropzone";

interface PlainEditorProps {
	model: monacoEditor.ITextModel | null;
	activeTheme: MonacoTheme;
	fontSize?: number;
	className?: string;
	readOnly?: boolean;
	onDrop: (files: File[]) => void;
	overlayActiveState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
}

export default function PlainEditor({
	model,
	activeTheme,
	fontSize = 12,
	className = "",
	readOnly = false,
	onDrop,
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

	// Create overlay widget
	const createOverlayWidget = useCallback((): monacoEditor.IOverlayWidget => {
		return {
			getId: () => `plain-editor-overlay-${id}`,
			getDomNode: () => {
				if (overlayDivRef.current === null) {
					overlayDivRef.current = document.createElement("div");

					// overlayDivRef.current.className = `${OVERLAY_BASE_CLASSES} ${
					// 	isDragActive
					// 		? "backdrop-blur-sm bg-black/20"
					// 		: "backdrop-blur-none bg-grey/50"
					// }`;
					overlayDivRef.current.className = `${OVERLAY_BASE_CLASSES}`;
					overlayDivRef.current.onclick = () => {
						setOverlayActiveState(false);
						if (editorRef.current) {
							editorRef.current.focus();
						}
					};

					if (overlayMessageBoxRef.current === null) {
						overlayMessageBoxRef.current = document.createElement("div");
						// overlayMessageBoxRef.current.className = MESSAGE_BOX_CLASSES;
						overlayMessageBoxRef.current.className = `${MESSAGE_BOX_BASE_CLASSES}`;
						overlayMessageBoxRef.current.textContent =
							"Start typing to get started. Or drop a file here. Or double click to find a file.";
					}

					overlayDivRef.current.appendChild(overlayMessageBoxRef.current);
				}
				return overlayDivRef.current;
			},
			getPosition: () => null,
		};
	}, [id, setOverlayActiveState]);

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

		editor.setModel(model);
		editorRef.current = editor;

		// Create and conditionally add overlay widget
		overlayWidgetRef.current = createOverlayWidget();

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

		const isLightTheme = activeTheme === ("light" as MonacoTheme);

		const shouldShowOverlay = overlayActiveState || isDragActive;

		if (shouldShowOverlay) {
			// Update overlay text based on state
			messageBox.textContent = isDragActive
				? "📁 Drop file here to load"
				: "Start typing to get started. Or drop a file here. Or double click to find a file.";

			const themeOverlayClasses = isLightTheme ? OVERLAY_LIGHT_CLASSES : OVERLAY_DARK_CLASSES;
			const themeMessageClasses = isLightTheme ? MESSAGE_BOX_LIGHT_CLASSES : MESSAGE_BOX_DARK_CLASSES;

			// Determine State Classes (Drag vs Idle)
			// You might want different opacity/blur when actively dragging vs just idle overlay
			const stateClasses = isDragActive ? "backdrop-blur-sm bg-opacity-80" : "backdrop-blur-none bg-opacity-50";

			// overlayDiv.className = `${OVERLAY_BASE_CLASSES} ${
			// 	isDragActive ? "backdrop-blur-sm bg-black/20" : "backdrop-blur-none bg-grey/50"
			// }`;

			overlayDiv.className = `${OVERLAY_BASE_CLASSES} ${themeOverlayClasses} ${stateClasses}`;
			messageBox.className = `${MESSAGE_BOX_BASE_CLASSES} ${themeMessageClasses}`;

			// editor.removeOverlayWidget(widget);
			// editor.addOverlayWidget(widget);
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
