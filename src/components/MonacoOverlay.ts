import { editor as monacoEditor } from "monaco-editor";
import { ActiveEditor, MonacoTheme } from "../monaco";

export const OVERLAY_BASE_CLASSES = `drop-overlay w-full h-full flex items-center justify-center z-9998 text-center p-4 box-border rounded-lg border border-blue-500/50 transition-opacity duration-150`;
export const OVERLAY_DARK_CLASSES = `bg-black/20 border-blue-500/50 text-white`;
export const OVERLAY_LIGHT_CLASSES = `bg-white/60 border-gray-300 text-gray-800`;

export const MESSAGE_BOX_BASE_CLASSES = `p-5 rounded-lg border-2 border-dashed pointer-events-none text-lg`;
export const MESSAGE_BOX_DARK_CLASSES = `bg-white/10 border-white/50 text-white`;
export const MESSAGE_BOX_LIGHT_CLASSES = `bg-black/5 border-gray-400/50 text-gray-800`;

interface CreateOverlayWidgetProps {
	overlayActiveState?: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
	overlayDivRef: React.MutableRefObject<HTMLDivElement | null>;
	overlayMessageBoxRef: React.MutableRefObject<HTMLDivElement | null>;
	editor: monacoEditor.IStandaloneCodeEditor;
	divProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const getOverlayWidget = ({
	overlayActiveState: [, setOverlayActiveState] = [false, () => {}],
	overlayDivRef,
	overlayMessageBoxRef,
	editor,
}: CreateOverlayWidgetProps): HTMLDivElement => {
	if (overlayDivRef.current === null) {
		overlayDivRef.current = document.createElement("div");
		overlayDivRef.current.className = `${OVERLAY_BASE_CLASSES}`;
		overlayDivRef.current.onclick = () => {
			setOverlayActiveState(false);
			if (editor !== null) {
				editor.focus();
			}
		};

		if (overlayMessageBoxRef.current === null) {
			overlayMessageBoxRef.current = document.createElement("div");
			overlayMessageBoxRef.current.className = `${MESSAGE_BOX_BASE_CLASSES}`;
			overlayMessageBoxRef.current.textContent =
				"Start typing to get started. Or drop a file here. Or double click to find a file.";
		}

		overlayDivRef.current.appendChild(overlayMessageBoxRef.current);
	}
	return overlayDivRef.current;
};

interface UpdateOverlayWidgetProps {
	overlayDiv: HTMLDivElement;
	messageBox: HTMLDivElement;
	activeTheme: MonacoTheme;
	isDragActive: boolean;
}

export const updateOverlayWidget = ({
	overlayDiv,
	messageBox,
	activeTheme,
	isDragActive,
}: UpdateOverlayWidgetProps) => {
	const isLightTheme = activeTheme === ("light" as MonacoTheme);

	// Update overlay text based on state
	messageBox.textContent = isDragActive
		? "📁 Drop file here to load"
		: "Start typing to get started. Or drop a file here. Or double click to find a file.";

	const themeOverlayClasses = isLightTheme ? OVERLAY_LIGHT_CLASSES : OVERLAY_DARK_CLASSES;
	const themeMessageClasses = isLightTheme ? MESSAGE_BOX_LIGHT_CLASSES : MESSAGE_BOX_DARK_CLASSES;

	// Determine State Classes (Drag vs Idle)
	// You might want different opacity/blur when actively dragging vs just idle overlay
	const stateClasses = isDragActive ? "backdrop-blur-sm" : "backdrop-blur-none";

	overlayDiv.className = `${OVERLAY_BASE_CLASSES} ${themeOverlayClasses} ${stateClasses}`;
	messageBox.className = `${MESSAGE_BOX_BASE_CLASSES} ${themeMessageClasses}`;
};

export const getDiffOverlayWidget = ({
	overlayActiveState: [, setOverlayActiveState] = [false, () => {}],
	overlayDivRef,
	overlayMessageBoxRef,
	editor,
}: CreateOverlayWidgetProps): HTMLDivElement => {
	if (overlayDivRef.current === null) {
		overlayDivRef.current = document.createElement("div");

		overlayDivRef.current.className = `${OVERLAY_BASE_CLASSES}`;
		overlayDivRef.current.onclick = () => {
			setOverlayActiveState(false);
			if (editor !== null) {
				editor.focus();
			}
		};

		if (overlayMessageBoxRef.current === null) {
			overlayMessageBoxRef.current = document.createElement("div");
			overlayMessageBoxRef.current.className = `${MESSAGE_BOX_BASE_CLASSES}`;
		}

		overlayDivRef.current.appendChild(overlayMessageBoxRef.current);
	}
	return overlayDivRef.current;
};

interface UpdateDiffOverlayWidgetProps {
	activeEditor: ActiveEditor;
	widgetParent: ActiveEditor;
	overlayDiv: HTMLDivElement;
	messageBox: HTMLDivElement;
	activeTheme: MonacoTheme;
	isDragActive: boolean;
}

export const updateDiffOverlayWidget = ({
	activeEditor,
	widgetParent,
	overlayDiv,
	messageBox,
	activeTheme,
	isDragActive,
}: UpdateDiffOverlayWidgetProps) => {
	if (activeEditor === null || widgetParent === null) {
		return;
	}
	const isLightTheme = activeTheme === ("light" as MonacoTheme);

	// Update overlay text based on state
	messageBox.textContent = isDragActive ? "📁 Drop file here to load\n(active)" : null;

	const themeOverlayClasses = isLightTheme ? OVERLAY_LIGHT_CLASSES : OVERLAY_DARK_CLASSES;
	const themeMessageClasses = isLightTheme ? MESSAGE_BOX_LIGHT_CLASSES : MESSAGE_BOX_DARK_CLASSES;
	const stateClasses = isDragActive ? "backdrop-blur-sm" : "backdrop-blur-none";

	overlayDiv.className = `${OVERLAY_BASE_CLASSES} ${themeOverlayClasses} ${stateClasses}`;
	messageBox.className = `${MESSAGE_BOX_BASE_CLASSES} ${themeMessageClasses}`;
};
