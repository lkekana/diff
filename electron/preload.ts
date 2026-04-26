import { ipcRenderer, contextBridge, webUtils } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
	getFilePath: (file: File): string => webUtils.getPathForFile(file),
	joinPaths: (...paths: string[]): Promise<string> => ipcRenderer.invoke("join-paths", ...paths),
	getAppFolder: (): Promise<string> => ipcRenderer.invoke("get-app-folder"),
	getTempFolder: (): Promise<string> => ipcRenderer.invoke("get-temp-folder"),
	readTextFile: (
		filePath: string,
	): Promise<{
		isBinary: boolean;
		content?: string;
	}> => ipcRenderer.invoke("read-text-file", filePath),
	createDefaultFiles: (): Promise<void> => ipcRenderer.invoke("create-default-files"),
	detectLanguage: (filePath: string): Promise<string | null> => ipcRenderer.invoke("detect-language", filePath),
	copyFileToTmp: (originalFile: File): Promise<string> => ipcRenderer.invoke("copy-file-to-tmp", originalFile),
	createTempFile: (fileData: string): Promise<string> => ipcRenderer.invoke("create-temp-file", fileData),
	cleanupTempFolder: (excludedFiles: string[] = []): Promise<void> =>
		ipcRenderer.invoke("cleanup-temp-folder", excludedFiles),
});

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
	on(...args: Parameters<typeof ipcRenderer.on>) {
		const [channel, listener] = args;
		return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
	},
	off(...args: Parameters<typeof ipcRenderer.off>) {
		const [channel, ...omit] = args;
		return ipcRenderer.off(channel, ...omit);
	},
	send(...args: Parameters<typeof ipcRenderer.send>) {
		const [channel, ...omit] = args;
		return ipcRenderer.send(channel, ...omit);
	},
	invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
		const [channel, ...omit] = args;
		return ipcRenderer.invoke(channel, ...omit);
	},

	// You can expose other APTs you need here.
	// ...
});
