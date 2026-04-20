import { useCallback, useEffect, useId, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import { DEFAULT_FONTS } from "../monaco";
import { useDropzone } from "react-dropzone";

interface PlainEditorProps {
	model: monaco.editor.ITextModel | null;
	fontSize?: number;
	className?: string;
	readOnly?: boolean;
}

const OVERLAY_BASE_CLASSES = `drop-overlay w-full h-full flex items-center justify-center z-9999 text-white text-center p-4 box-border rounded-lg border border-blue-500/50 transition-opacity duration-150`;
const MESSAGE_BOX_CLASSES = `bg-white/10 p-5 rounded-lg border-2 border-dashed border-white/50 pointer-events-none text-lg`;

export default function PlainEditor({
	model,
	fontSize = 12,
	className = "",
	readOnly = false,
}: PlainEditorProps) {
	const id = useId();
	const [showOverlay, setShowOverlay] = useState(true);
	const containerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const overlayWidgetRef = useRef<monaco.editor.IOverlayWidget | null>(null);
	const overlayDivRef = useRef<HTMLDivElement>(null);
	const overlayMessageBoxRef = useRef<HTMLDivElement>(null);
	const initializedRef = useRef(false);

	const onDrop = useCallback((acceptedFiles: File[]) => {
		// Do something with the files
		console.log(acceptedFiles);
	}, []);
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		noClick: true,
		onDrop,
		onDragEnter: () => setShowOverlay(true),
		onDragLeave: (e) => {
			// Only hide if leaving the root container entirely
			if (
				!getRootProps().ref.current?.contains(e.relatedTarget as Node)
			) {
				setShowOverlay(false);
			}
		},
		onDropAccepted: () => setShowOverlay(false),
		onDropRejected: () => setShowOverlay(false),
	});

	// Create overlay widget
	const createOverlayWidget =
		useCallback((): monaco.editor.IOverlayWidget => {
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
							setShowOverlay(false);
							if (editorRef.current) {
								editorRef.current.focus();
							}
						};

						if (overlayMessageBoxRef.current === null) {
							overlayMessageBoxRef.current = document.createElement("div");
							overlayMessageBoxRef.current.className = MESSAGE_BOX_CLASSES;
							overlayMessageBoxRef.current.textContent = "Start typing to get started. Or drop a file here. Or double click to find a file.";
						}

						overlayDivRef.current.appendChild(overlayMessageBoxRef.current);
					}
					return overlayDivRef.current;
				},
				getPosition: () => null,
			};
		}, [id]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Run once on mount
	useEffect(() => {
		if (containerRef.current === null || initializedRef.current) return;
		initializedRef.current = true;

		const editor = monaco.editor.create(containerRef.current, {
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
		const shouldShowOverlay = showOverlay || isDragActive;
		if (shouldShowOverlay && overlayWidgetRef.current !== null) {
			editor.addOverlayWidget(overlayWidgetRef.current);
			editor.layout();
		}

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

	// Toggle overlay visibility based on drag state and internal showOverlay state
	useEffect(() => {
		const editor = editorRef.current;
		const widget = overlayWidgetRef.current;
		const overlayDiv = overlayDivRef.current;
		const messageBox = overlayMessageBoxRef.current;
		if (editor === null || widget === null || overlayDiv === null || messageBox === null) return;

		const shouldShowOverlay = showOverlay || isDragActive;

		if (shouldShowOverlay) {
			// Update overlay text based on state
			messageBox.textContent = isDragActive
				? "📁 Drop file here to load"
				: "Start typing to get started. Or drop a file here. Or double click to find a file.";
			
			overlayDiv.className = `${OVERLAY_BASE_CLASSES} ${
				isDragActive ? "backdrop-blur-sm bg-black/20" : "backdrop-blur-none bg-grey/50"
			}`;

			// editor.removeOverlayWidget(widget);
			// editor.addOverlayWidget(widget);
			if (overlayDiv.parentNode === null) {
				editor.addOverlayWidget(widget);
			}
		} else {
			editor.removeOverlayWidget(widget);
		}

		editor.layout();
	}, [showOverlay, isDragActive]);

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
		<div
			{...getRootProps()}
			className="relative flex items-center justify-center w-full h-full min-h-100"
		>
			<input {...getInputProps()} />
			<div ref={containerRef} className={`flex size-full ${className}`} />
		</div>
	);
}

export function PlainEditorSkeleton() {
	return (
		<div className="monaco-editor relative flex items-center justify-center w-full h-full min-h-100" />
	);
}
