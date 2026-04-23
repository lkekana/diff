/// <reference types="vite/client" />

import type { Environment } from "monaco-editor";
import type { plus100 } from "@lkekana/language-detection";

// used to wrap the return types from Rust in Promise<T>
// because they'll be running on a different thread and will need to be async. 

// type PromisifyFn<T extends (...args: any[]) => any> = (
// 	...args: Parameters<T>
//   ) => Promise<ReturnType<T>>;

type PromisifyFn<T extends (...args: unknown[]) => unknown> = (
	...args: Parameters<T>
  ) => Promise<ReturnType<T>>;

declare global {
	interface Window {
		MonacoEnvironment?: Environment;
		electronAPI: {
			plus100: PromisifyFn<typeof plus100>;
		  };
	}
}