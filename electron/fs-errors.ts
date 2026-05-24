// Node uses POSIX error codes for filesystem operations, which are consistent across platforms
// See: https://www.man7.org/linux/man-pages/man3/errno.3.html
export enum FsErrorCode {
	NOT_FOUND = "ENOENT",
	PERMISSION_DENIED = "EACCES",
	OPERATION_NOT_PERMITTED = "EPERM",
	ALREADY_EXISTS = "EEXIST",
	IS_DIRECTORY = "EISDIR",
	NOT_DIRECTORY = "ENOTDIR",
	NO_SPACE = "ENOSPC",
}

// Extend the base interface to account for Node's ERR_SYSTEM_ERROR wrapper
interface ExtendedErrnoException extends NodeJS.ErrnoException {
	info?: { code?: string; errno?: number; syscall?: string };
}

// Type Guard to safely narrow the `unknown` type in catch blocks
export function isNodeError(error: unknown): error is ExtendedErrnoException {
	return error instanceof Error && ("code" in error || "info" in error);
}

export function getPosixCode(error: ExtendedErrnoException): string | undefined {
	if (error.code === "ERR_SYSTEM_ERROR" && error.info?.code) {
		return error.info.code;
	}
	return error.code;
}

export function handleWriteError(code: string | undefined) {
	switch (code) {
		case FsErrorCode.PERMISSION_DENIED:
		case FsErrorCode.OPERATION_NOT_PERMITTED:
			return "Permission denied";

		case FsErrorCode.NO_SPACE:
			return "Disk full";

		case FsErrorCode.NOT_FOUND:
			return "Directory not found";

		default:
			return `Unhandled FS error: ${code}`;
	}
}
