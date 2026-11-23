import { generateServiceUnit } from "./generator.js";
import { writeServiceUnit, DEFAULT_SYSTEMD_DIR } from "./writer.js";
import { basename } from "node:path";

export function printHelp() {
    console.log(`
ubuntu-service-create (usc) — Author and create Ubuntu systemd services for KeshavSoft VPS apps

Usage:
  npx ubuntu-service-create <name> <port> [workingDir] [options]
  npx ubuntu-service-create <port> [options]

Commands:
  (default)            Generate service unit file content to stdout
  --write, -w          Write the service unit file directly to /etc/systemd/system/
  --enable, -e         Write file + run 'systemctl daemon-reload && systemctl enable --now'

Options:
  --dir <path>         Target directory (defaults to /etc/systemd/system)
  --exec <cmd>         Custom ExecStart command
  --user <user>        Service user (defaults to 'root')
  --env <env>          NODE_ENV value (defaults to 'production')
  --json               Output machine-readable JSON
  -h, --help           Show this help message
  -v, --version        Show version number

Examples:
  # Stand in /root/KeshavSoft/appointment-booking and print unit file:
  npx usc 3004

  # Explicit name and port:
  npx usc appointment-booking 3004

  # Write unit file to /etc/systemd/system/appointment-booking.service:
  npx usc appointment-booking 3004 --write

  # Complete 1-shot deployment: write, reload daemon, and start immediately:
  npx usc appointment-booking 3004 --enable
`);
}

export function runCli(argv = process.argv.slice(2)) {
    if (argv.includes("-h") || argv.includes("--help")) {
        printHelp();
        return 0;
    }

    if (argv.includes("-v") || argv.includes("--version")) {
        console.log("1.0.0");
        return 0;
    }

    const isJson = argv.includes("--json");
    const isWrite = argv.includes("-w") || argv.includes("--write");
    const isEnable = argv.includes("-e") || argv.includes("--enable");

    // Extract options
    let customDir = null;
    const dirIdx = argv.indexOf("--dir");
    if (dirIdx !== -1 && argv[dirIdx + 1]) {
        customDir = argv[dirIdx + 1];
    }

    let customExec = null;
    const execIdx = argv.indexOf("--exec");
    if (execIdx !== -1 && argv[execIdx + 1]) {
        customExec = argv[execIdx + 1];
    }

    let customUser = "root";
    const userIdx = argv.indexOf("--user");
    if (userIdx !== -1 && argv[userIdx + 1]) {
        customUser = argv[userIdx + 1];
    }

    let customEnv = "production";
    const envIdx = argv.indexOf("--env");
    if (envIdx !== -1 && argv[envIdx + 1]) {
        customEnv = argv[envIdx + 1];
    }

    // Filter out flags from positional arguments
    const positional = argv.filter((arg, i) => {
        if (["--json", "-h", "--help", "-v", "--version", "-w", "--write", "-e", "--enable"].includes(arg)) return false;
        if (["--dir", "--exec", "--user", "--env"].includes(arg)) return false;
        if (i > 0 && ["--dir", "--exec", "--user", "--env"].includes(argv[i - 1])) return false;
        return true;
    });

    if (positional.length === 0) {
        console.error("Error: Port number is required.");
        console.error("Example: npx usc 3004 or npx usc appointment-booking 3004");
        return 1;
    }

    let serviceName;
    let port;
    let workingDirectory = null;

    // Check if first arg is purely a port number (e.g. `usc 3004`)
    if (/^\d{2,5}$/.test(positional[0]) && positional.length === 1) {
        port = positional[0];
        serviceName = basename(process.cwd());
    } else {
        serviceName = positional[0];
        port = positional[1];
        if (positional[2]) {
            workingDirectory = positional[2];
        }
    }

    if (!port || isNaN(Number(port))) {
        console.error(`Error: A valid port number is required. Received: '${port}'`);
        return 1;
    }

    try {
        const unitContent = generateServiceUnit({
            name: serviceName,
            port,
            workingDirectory,
            execStart: customExec || undefined,
            user: customUser,
            nodeEnv: customEnv
        });

        if (isWrite || isEnable) {
            const writeResult = writeServiceUnit(serviceName, unitContent, {
                dir: customDir,
                enable: isEnable
            });

            if (isJson) {
                console.log(JSON.stringify(writeResult, null, 2));
                return writeResult.success ? 0 : 1;
            }

            console.log(`\n======================================================`);
            console.log(` ✅ Service Unit Created: ${writeResult.unitName}`);
            console.log(` Location: ${writeResult.path}`);
            if (isEnable) {
                console.log(` Status: ${writeResult.simulated ? "Simulated (Non-Linux)" : (writeResult.started ? "Enabled & Active" : "Failed to start")}`);
            }
            console.log(`======================================================\n`);
            return 0;
        }

        // Default: Print to stdout
        if (isJson) {
            console.log(JSON.stringify({
                serviceName,
                port,
                unitContent
            }, null, 2));
            return 0;
        }

        process.stdout.write(unitContent);
        return 0;
    } catch (err) {
        console.error(`Error: ${err.message}`);
        return 1;
    }
}

export default runCli;
