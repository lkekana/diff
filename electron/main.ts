import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fsAsync from "node:fs/promises";
import fs from "node:fs";
import { randomUUID } from "crypto";
import { isBinaryFile } from "isbinaryfile";

const appID = "com.lesedikekana.diff";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
const languageDetection = require("@lkekana/language-detection");
import { plus100, detectLanguage } from "@lkekana/language-detection";

export const appFolder = path.join(app.getPath("appData"), appID);
export const tempFolder = path.join(app.getPath("appData"), appID, "tmp");
// console.log("Temp folder path:", tempFolder);

// create default files
async function createDefaultFiles() {
	const originalText = `function add(a, b) {\n\treturn a - b;\n}`;
	const modifiedText = `function add(a, b) {\n\treturn a + b; // Should've been addition\n}`;
	await fsAsync.mkdir(tempFolder, { recursive: true });
	await Promise.all([
		fsAsync.writeFile(path.join(tempFolder, "original.ts"), originalText, "utf-8"),
		fsAsync.writeFile(path.join(tempFolder, "modified.ts"), modifiedText, "utf-8"),
	]);
}
createDefaultFiles().catch((error) => {
	console.error("Failed to create default files:", error);
});

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
	win = new BrowserWindow({
		icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			contextIsolation: true,
			nodeIntegration: false,
		},
		width: 900,
		height: 675,
		minWidth: 800,
		minHeight: 600,
	});

	// Test active push message to Renderer-process.
	win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", new Date().toLocaleString());
	});

	if (VITE_DEV_SERVER_URL) {
		win.loadURL(VITE_DEV_SERVER_URL);
	} else {
		// win.loadFile('dist/index.html')
		win.loadFile(path.join(RENDERER_DIST, "index.html"));
	}
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
		win = null;
	}
});

app.on("activate", () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

ipcMain.handle("join-paths", (_event, ...paths: string[]): string => {
	return path.join(...paths);
});

ipcMain.handle("get-app-folder", async (): Promise<string> => {
	try {
		await fsAsync.mkdir(appFolder, { recursive: true });
		return appFolder;
	} catch (error) {
		console.error("Failed to get or create app folder:", error);
		return Promise.reject(error);
	}
});

ipcMain.handle("get-temp-folder", async (): Promise<string> => {
	try {
		await fsAsync.mkdir(tempFolder, { recursive: true });
		return tempFolder;
	} catch (error) {
		console.error("Failed to get or create app folder:", error);
		return Promise.reject(error);
	}
});

ipcMain.handle(
	"read-text-file",
	async (
		_event,
		filePath: string,
	): Promise<{
		isBinary: boolean;
		content?: string;
	}> => {
		try {
			const absolutePath = path.resolve(filePath);
			console.log(`Attempting to read file at path: ${absolutePath}`);
			const isBinary = await isBinaryFile(absolutePath);
			console.log(`File at path ${absolutePath} is ${isBinary ? "binary" : "text"}`);
			if (isBinary) {
				return { isBinary: true };
			}
			const content = await fsAsync.readFile(filePath, "utf-8");
			return { isBinary: false, content };
		} catch (error) {
			console.error(`Failed to read file at path ${filePath}:`, error);
			return Promise.reject(error);
		}
	},
);

ipcMain.handle("create-default-files", async (): Promise<void> => {
	try {
		await createDefaultFiles();
		return;
	} catch (error) {
		console.error("Failed to create default files:", error);
		return Promise.reject(error);
	}
});

ipcMain.handle("detect-language", async (_event, filePath: string): Promise<string | null> => {
	try {
		console.log(`ipcMain received detect-language request for file: ${filePath}`);
		// return await detectLanguage(filePath);
		return await languageDetection.detectLanguage(filePath);
	} catch (error) {
		console.error("Language detection failed:", error);
		throw error;
	}
});

ipcMain.handle("copy-file-to-tmp", async (_event, originalFile: File): Promise<string> => {
	console.log("copy-file-to-tmp called with file:", originalFile);
	try {
		await fsAsync.mkdir(tempFolder, { recursive: true });
		const fileName = path.basename(originalFile.name);
		let tempFilePath = path.join(tempFolder, `${randomUUID()}_${fileName}`);
		while (await fileExists(tempFilePath)) {
			tempFilePath = path.join(tempFolder, `${randomUUID()}_${fileName}`);
		}
		const writer = fs.createWriteStream(tempFilePath);
		const reader = originalFile.stream().getReader();
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				writer.write(value);
			}
			await new Promise((resolve, reject) => {
				writer.end(resolve);
				writer.on("error", reject);
			});
			return tempFilePath;
		} catch (err) {
			writer.close();
			// Clean up partial file on error
			fs.unlink(tempFilePath, () => {});
			throw err;
		}
	} catch (error) {
		console.error("Failed to copy file to temp:", error);
		throw error;
	}
});

const fileExists = async (filePath: string): Promise<boolean> => {
	try {
		await fsAsync.access(filePath);
		return true;
	} catch {
		return false;
	}
};

ipcMain.handle("create-temp-file", async (_event, fileData: string): Promise<string> => {
	try {
		await fsAsync.mkdir(tempFolder, { recursive: true });
		let tempFilePath = path.join(tempFolder, `${randomUUID()}.tmp`);
		while (await fileExists(tempFilePath)) {
			tempFilePath = path.join(tempFolder, `${randomUUID()}.tmp`);
		}
		await fsAsync.writeFile(tempFilePath, fileData, "utf-8");
		console.log(`Created temp file at path: ${tempFilePath}`);
		return tempFilePath;
	} catch (error) {
		console.error("Failed to create temp file:", error);
		throw error;
	}
});

ipcMain.handle("cleanup-temp-folder", async (_event, excludedFiles: string[] = []): Promise<void> => {
	try {
		console.log(`Cleaning up temp folder: ${tempFolder}, excluding files: ${excludedFiles.join(", ")}`);
		const files = await fsAsync.readdir(tempFolder);
		for (const file of files) {
			const filePath = path.join(tempFolder, file);
			if (!excludedFiles.includes(filePath)) {
				await fsAsync.unlink(filePath);
				console.log(`Deleted temp file: ${filePath}`);
			}
		}
	} catch (error) {
		console.error("Failed to cleanup temp folder:", error);
		throw error;
	}
});

app.whenReady().then(createWindow);
