import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
    generateServiceUnit,
    writeServiceUnit,
    createService,
    isSystemctlAvailable
} from "../src/index.js";
import { runCli } from "../src/cli.js";

describe("ubuntu-service-create", () => {
    describe("generateServiceUnit", () => {
        test("generates standard service unit for KeshavSoft app", () => {
            const unit = generateServiceUnit({
                name: "appointment-booking",
                port: 3004
            });

            assert.ok(unit.includes("[Unit]"));
            assert.ok(unit.includes("Description=appointment-booking Node Service"));
            assert.ok(unit.includes("WorkingDirectory=/root/KeshavSoft/appointment-booking"));
            assert.ok(unit.includes("Environment=NODE_ENV=production"));
            assert.ok(unit.includes("Environment=PORT=3004"));
            assert.ok(unit.includes("EnvironmentFile=/root/KeshavSoft/appointment-booking/.env"));
            assert.ok(unit.includes("ExecStart=/root/.nvm/versions/node/v24.13.0/bin/node app.js"));
            assert.ok(unit.includes("Restart=on-failure"));
            assert.ok(unit.includes("RestartSec=5"));
            assert.ok(unit.includes("WantedBy=multi-user.target"));
        });

        test("strips .service suffix from name", () => {
            const unit = generateServiceUnit({
                name: "appointment-booking.service",
                port: 3004
            });
            assert.ok(unit.includes("Description=appointment-booking Node Service"));
            assert.ok(unit.includes("WorkingDirectory=/root/KeshavSoft/appointment-booking"));
        });

        test("accepts custom workingDirectory and execStart", () => {
            const unit = generateServiceUnit({
                name: "custom-app",
                port: 8080,
                workingDirectory: "/var/www/custom",
                execStart: "/usr/bin/node server.js",
                user: "ubuntu",
                nodeEnv: "staging",
                restartSec: 10
            });

            assert.ok(unit.includes("WorkingDirectory=/var/www/custom"));
            assert.ok(unit.includes("ExecStart=/usr/bin/node server.js"));
            assert.ok(unit.includes("User=ubuntu"));
            assert.ok(unit.includes("Environment=NODE_ENV=staging"));
            assert.ok(unit.includes("RestartSec=10"));
        });

        test("throws error if name is missing", () => {
            assert.throws(() => {
                generateServiceUnit({ port: 3000 });
            }, /requires a service name/);
        });

        test("throws error if port is invalid", () => {
            assert.throws(() => {
                generateServiceUnit({ name: "app", port: 999999 });
            }, /Invalid port number/);
        });
    });

    describe("writeServiceUnit", () => {
        let tempDir;

        test("writes service file to target directory", () => {
            tempDir = mkdtempSync(join(tmpdir(), "usc-test-"));
            const content = generateServiceUnit({ name: "test-svc", port: 3005 });

            const res = writeServiceUnit("test-svc", content, { dir: tempDir });
            assert.equal(res.success, true);
            assert.equal(res.unitName, "test-svc.service");
            assert.ok(existsSync(res.path));

            const readBack = readFileSync(res.path, "utf-8");
            assert.ok(readBack.includes("Environment=PORT=3005"));

            rmSync(tempDir, { recursive: true, force: true });
        });

        test("handles enable flag gracefully on any platform", () => {
            tempDir = mkdtempSync(join(tmpdir(), "usc-test-enable-"));
            const content = generateServiceUnit({ name: "enable-svc", port: 3006 });

            const res = writeServiceUnit("enable-svc", content, {
                dir: tempDir,
                enable: true
            });

            assert.equal(res.success, true);
            if (process.platform !== "linux") {
                assert.equal(res.simulated, true);
            }

            rmSync(tempDir, { recursive: true, force: true });
        });
    });

    describe("createService high-level API", () => {
        test("creates service object without writing by default", () => {
            const res = createService({
                name: "quick-app",
                port: 4000
            });

            assert.equal(res.success, true);
            assert.equal(res.written, false);
            assert.equal(res.unitName, "quick-app.service");
            assert.ok(res.content.includes("PORT=4000"));
        });
    });

    describe("runCli", () => {
        test("prints help on -h", () => {
            const code = runCli(["-h"]);
            assert.equal(code, 0);
        });

        test("prints version on -v", () => {
            const code = runCli(["-v"]);
            assert.equal(code, 0);
        });

        test("returns exit code 1 on missing port", () => {
            const code = runCli([]);
            assert.equal(code, 1);
        });

        test("generates unit with explicit name and port", () => {
            const code = runCli(["demo-app", "3004"]);
            assert.equal(code, 0);
        });
    });
});
