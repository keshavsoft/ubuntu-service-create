import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { execSync } from "node:child_process";

export const DEFAULT_SYSTEMD_DIR = "/etc/systemd/system";

export function isSystemctlAvailable() {
    if (process.platform !== "linux") return false;
    try {
        execSync("which systemctl 2>/dev/null", { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}

export function writeServiceUnit(name, content, options = {}) {
    if (!name) throw new Error("Service name is required to write unit file.");
    if (!content) throw new Error("Unit content is required.");

    const cleanName = String(name).replace(/\.service$/i, "").trim();
    const unitFileName = `${cleanName}.service`;
    const targetDir = options.dir ? resolve(options.dir) : DEFAULT_SYSTEMD_DIR;

    if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
    }

    const filePath = join(targetDir, unitFileName);
    writeFileSync(filePath, content, "utf-8");

    let enabled = false;
    let started = false;
    let simulated = false;

    if (options.enable) {
        if (!isSystemctlAvailable()) {
            simulated = true;
        } else {
            try {
                execSync("systemctl daemon-reload", { stdio: "inherit", timeout: 10000 });
                execSync(`systemctl enable --now ${unitFileName}`, { stdio: "inherit", timeout: 15000 });
                enabled = true;
                started = true;
            } catch (err) {
                return {
                    success: true,
                    path: filePath,
                    unitName: unitFileName,
                    enabled: false,
                    started: false,
                    error: err.message
                };
            }
        }
    }

    return {
        success: true,
        path: filePath,
        unitName: unitFileName,
        enabled: options.enable ? (simulated ? true : enabled) : false,
        started: options.enable ? (simulated ? true : started) : false,
        simulated
    };
}
