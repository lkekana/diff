import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./main.css";

import editorWorker from "monaco-editor/esm/vs/editor/editor.worker.js?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker.js?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker.js?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker.js?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker.js?worker";

// Initialize Monaco workers
if (!(window as any).MonacoEnvironment) {
	(window as any).MonacoEnvironment = {
		getWorker: (_workerId: string, label: string) => {
			switch (label) {
				case "json":
					return new jsonWorker();
				case "css":
				case "scss":
				case "less":
					return new cssWorker();
				case "html":
				case "handlebars":
				case "razor":
					return new htmlWorker();
				case "typescript":
				case "javascript":
					return new tsWorker();
				default:
					return new editorWorker();
			}
		},
	};
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
