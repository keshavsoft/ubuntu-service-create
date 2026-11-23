import { generateServiceUnit } from "./generator.js";
import { writeServiceUnit, isSystemctlAvailable, DEFAULT_SYSTEMD_DIR } from "./writer.js";
import { basename } from "node:path";

export { generateServiceUnit } from "./generator.js";
export { writeServiceUnit, isSystemctlAvailable, DEFAULT_SYSTEMD_DIR } from "./writer.js";

/**
 * High-level service creator. Combines generation and optional writing / enabling.
 */
export function createService(options = {}) {
    const cwdName = basename(process.cwd());
    const name = options.name || cwdName;
    const port = options.port;
    const workingDirectory = options.workingDirectory || (process.platform === "linux" ? `/root/KeshavSoft/${name}` : process.cwd());

    const unitContent = generateServiceUnit({
        name,
        port,
        workingDirectory,
        execStart: options.execStart,
        user: options.user,
        nodeEnv: options.nodeEnv,
        restartSec: options.restartSec,
        description: options.description
    });

    if (options.write || options.enable) {
        const writeResult = writeServiceUnit(name, unitContent, {
            dir: options.dir,
            enable: options.enable
        });
        return {
            ...writeResult,
            content: unitContent
        };
    }

    return {
        success: true,
        unitName: `${String(name).replace(/\.service$/i, "")}.service`,
        content: unitContent,
        written: false
    };
}

export default {
    generateServiceUnit,
    writeServiceUnit,
    createService,
    isSystemctlAvailable,
    DEFAULT_SYSTEMD_DIR
};
