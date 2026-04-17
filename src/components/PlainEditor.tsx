import { useCallback, useEffect, useId, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import { type MonacoTheme, DEFAULT_FONTS } from "../monaco";
import { useDropzone } from "react-dropzone";

// Initialize Monaco workers
if (!self.MonacoEnvironment) {
	self.MonacoEnvironment = {
		getWorker: () => new editorWorker(),
	};
}

interface PlainEditorProps {
	model: monaco.editor.ITextModel | null;
	theme?: MonacoTheme;
	fontSize?: number;
	className?: string;
	readOnly?: boolean;
}

export default function PlainEditor({
	model,
	theme = "vs-dark",
	fontSize = 12,
	className = "",
	readOnly = false,
}: PlainEditorProps) {
	const id = useId();
	const [showOverlay, setShowOverlay] = useState(true);
	const overlayWidgetRef = useRef<monaco.editor.IOverlayWidget | null>(null);
	const overlayDomRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

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

	const getOverlayContent = useCallback(() => {
		const result = document.createElement("div");
		result.textContent = isDragActive
			? "📁 Drop file here to load"
			: "Start typing to get started. Or drop a file here. Or double click to find a file.";
		result.className =
			"bg-white/10 p-5 rounded-lg border-2 border-dashed border-white/50 pointer-events-none text-lg";
		return result.outerHTML;
	}, [isDragActive]);

	// Create overlay widget
	const createOverlayWidget =
		useCallback((): monaco.editor.IOverlayWidget => {
			const height =
				containerRef.current !== null
					? `${containerRef.current.clientHeight}px`
					: "100%";
			return {
				getId: () => `plain-editor-overlay-${id}`,
				getDomNode: () => {
					if (!overlayDomRef.current) {
						overlayDomRef.current = document.createElement("div");
						overlayDomRef.current.className = `drop-overlay w-full h-parent flex items-center justify-center z-9999 text-white text-center p-4 box-border rounded-lg border border-blue-500/50 ${isDragActive ? "backdrop-blur-sm bg-black/20" : "backdrop-blur-none bg-grey/50"}`;
						overlayDomRef.current.style.height = height;
						overlayDomRef.current.innerHTML = getOverlayContent();
						overlayDomRef.current.onclick = () => {
							setShowOverlay(false);
							if (editorRef.current) {
								editorRef.current.focus();
							}
						};
					}
					return overlayDomRef.current;
				},
				getPosition: () => null,
			};
		}, [getOverlayContent, isDragActive, id]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Run once on mount
	useEffect(() => {
		if (!containerRef.current) return;

		const editor = monaco.editor.create(containerRef.current, {
			theme,
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
		if (shouldShowOverlay && overlayWidgetRef.current) {
			editor.addOverlayWidget(overlayWidgetRef.current);
		}

		// Cleanup
		return () => {
			if (overlayWidgetRef.current) {
				editor.removeOverlayWidget(overlayWidgetRef.current);
			}
			editor.dispose();
			editorRef.current = null;
			overlayWidgetRef.current = null;
		};
	}, []);

	// Toggle overlay visibility based on drag state and internal showOverlay state
	useEffect(() => {
		const editor = editorRef.current;
		const widget = overlayWidgetRef.current;
		if (!editor || !widget) return;

		const shouldShowOverlay = showOverlay || isDragActive;

		if (shouldShowOverlay) {
			// Update overlay text based on state
			if (overlayDomRef.current) {
				overlayDomRef.current.innerHTML = getOverlayContent();
			}
			editor.removeOverlayWidget(widget); // Remove first to ensure updated content
			editor.addOverlayWidget(widget);
		} else {
			editor.removeOverlayWidget(widget);
		}

		// Reposition widget after adding/removing
		editor.layout();
	}, [showOverlay, isDragActive, getOverlayContent]);

	// Sync model
	useEffect(() => {
		if (editorRef.current) {
			editorRef.current.setModel(model);
		}
	}, [model]);

	// Sync options
	useEffect(() => {
		if (editorRef.current)
			editorRef.current.updateOptions({
				fontSize,
				readOnly: readOnly,
			});
	}, [fontSize, readOnly]);

	// Sync theme
	useEffect(() => {
		monaco.editor.setTheme(theme);
	}, [theme]);

	return (
		<div
			{...getRootProps()}
			className="relative flex items-center justify-center w-full h-full min-h-100"
		>
			<input {...getInputProps()} />
			<div
				ref={containerRef}
				className={`flex size-full ${className}`}
			/>
		</div>
	);
}
