/**
 * Systemd unit file generator for KeshavSoft VPS Node.js applications.
 * Zero external dependencies.
 */

export function generateServiceUnit({
    name,
    port,
    workingDirectory,
    execStart = "/root/.nvm/versions/node/v24.13.0/bin/node app.js",
    user = "root",
    nodeEnv = "production",
    restartSec = 5,
    description
}) {
    if (!name) {
        throw new Error("generateServiceUnit requires a service name / domain string.");
    }

    const cleanName = String(name).replace(/\.service$/i, "").trim();
    if (!cleanName) {
        throw new Error("Service name cannot be empty.");
    }

    const serviceDescription = description || `${cleanName} Node Service`;
    const cleanWorkingDir = workingDirectory || `/root/KeshavSoft/${cleanName}`;

    const lines = [
        "[Unit]",
        `Description=${serviceDescription}`,
        "After=network.target",
        "",
        "[Service]",
        "Type=simple",
        `User=${user}`,
        `WorkingDirectory=${cleanWorkingDir}`,
        "",
        `Environment=NODE_ENV=${nodeEnv}`
    ];

    if (port !== undefined && port !== null && port !== "") {
        const numPort = Number(port);
        if (isNaN(numPort) || numPort < 1 || numPort > 65535) {
            throw new Error(`Invalid port number: ${port}. Must be between 1 and 65535.`);
        }
        lines.push(`Environment=PORT=${numPort}`);
    }

    lines.push(
        `EnvironmentFile=${cleanWorkingDir}/.env`,
        "",
        `ExecStart=${execStart}`,
        "",
        "Restart=on-failure",
        `RestartSec=${restartSec}`,
        "",
        "StandardOutput=journal",
        "StandardError=journal",
        "",
        "[Install]",
        "WantedBy=multi-user.target"
    );

    return lines.join("\n") + "\n";
}
