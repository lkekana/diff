/// <reference types="vite/client" />

import type { Environment } from "monaco-editor";
import type { detectLanguage } from "@lkekana/language-detection";

// used to wrap the return types from Rust in Promise<T>
// because they'll be running on a different thread and will need to be async.

// type PromisifyFn<T extends (...args: any[]) => any> = (
// 	...args: Parameters<T>
//   ) => Promise<ReturnType<T>>;

type PromisifyFn<T extends (...args: unknown[]) => unknown> = (...args: Parameters<T>) => Promise<ReturnType<T>>;

declare global {
	interface Window {
		MonacoEnvironment?: Environment;
		electronAPI: {
			getFilePath: (file: File) => Promise<string>;
			joinPaths: (...paths: string[]) => string;
			getAppFolder: () => Promise<string>;
			getTempFolder: () => Promise<string>;
			readTextFile: (filePath: string) => Promise<{ isBinary: boolean; content?: string }>;
			createDefaultFiles: () => Promise<void>;
			detectLanguage: PromisifyFn<typeof detectLanguage>;
			copyFileToTmp: (originalFile: File) => Promise<string>;
			createTempFile: (fileData: string) => Promise<string>;
			cleanupTempFolder: (excludedFiles?: string[]) => Promise<void>;
		};
	}
}
