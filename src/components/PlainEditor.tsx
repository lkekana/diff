import { useCallback, useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import { type LanguageID, type MonacoTheme, DEFAULT_FONTS } from "../monaco";
import { useDropzone } from "react-dropzone";

// Initialize Monaco workers
if (!self.MonacoEnvironment) {
	self.MonacoEnvironment = {
		getWorker: () => new editorWorker(),
	};
}

interface PlainEditorProps {
	text: string;
	language?: LanguageID;
	theme?: MonacoTheme;
	fontSize?: number;
	className?: string;
	readOnly?: boolean;
}

export default function PlainEditor({
	text,
	language = "plaintext",
	theme = "vs-dark",
	fontSize = 12,
	className = "",
	readOnly = false,
}: PlainEditorProps) {
	const [showOverlay, setShowOverlay] = useState(true);
	const overlayWidgetRef = useRef<monaco.editor.IOverlayWidget | null>(null);
	const overlayDomRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null);

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
			: "Start typing to get started. Or drop a file here. Or double check to find a file.";
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
				getId: () => "drop-overlay-widget",
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
		}, [getOverlayContent, isDragActive]);

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

		const modifiedModel = monaco.editor.createModel(text, language);
		editor.setModel(modifiedModel);
		editorRef.current = editor;
		modifiedModelRef.current = modifiedModel;

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
			modifiedModel.dispose();
			editor.dispose();
			editorRef.current = null;
			modifiedModelRef.current = null;
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
			editor.addOverlayWidget(widget);
		} else {
			editor.removeOverlayWidget(widget);
		}

		// Reposition widget after adding/removing
		editor.layout();
	}, [showOverlay, isDragActive, getOverlayContent]);

	// Sync content when props change
	useEffect(() => {
		if (modifiedModelRef.current) modifiedModelRef.current.setValue(text);
	}, [text]);

	// Sync language
	useEffect(() => {
		if (modifiedModelRef.current)
			monaco.editor.setModelLanguage(modifiedModelRef.current, language);
	}, [language]);

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
			className="relative flex items-center justify-center w-full h-dvh min-h-100"
		>
			<input {...getInputProps()} />
			<div
				ref={containerRef}
				className={`flex size-full ${className}`}
			/>
		</div>
	);
}
