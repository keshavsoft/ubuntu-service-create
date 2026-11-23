# ubuntu-service-create

[![npm version](https://img.shields.io/badge/npm-v1.0.0-orange.svg)](https://www.npmjs.com/package/ubuntu-service-create)
[![License: ISC](https://img.shields.io/badge/License-ISC-green.svg)](https://opensource.org/licenses/ISC)
[![Docs Hub](https://img.shields.io/badge/docs-ubuntu--service--docs-sky.svg)](https://keshavsoft.github.io/ubuntu-service-docs/)
[![Organization](https://img.shields.io/badge/org-KeshavSoft-purple.svg)](https://github.com/keshavsoft)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

> **Author, validate, and write standard Ubuntu systemd service unit files matching KeshavSoft VPS conventions.**  
> The creation & birth engine of the `ubuntu-service` single-service family.

---

## 🎯 Purpose in the Service Lifecycle

When deploying an application on an Ubuntu VPS, the lifecycle consists of four decoupled steps:

```
1. CREATE  ➔  ubuntu-service-create  (Birth of .service file on VPS)
2. DETECT  ➔  ubuntu-service-detect  (Locates service belonging to cwd)
3. RESTART ➔  ubuntu-service-restart (Safely executes systemctl restart & poll)
4. NETWORK ➔  ubuntu-service-port    (Maps and verifies active port assignments)
```

`ubuntu-service-create` is responsible for **Step 1**: generating valid systemd unit files conforming to KeshavSoft conventions (`EnvironmentFile=.env`, `ExecStart=node app.js`, `Restart=on-failure`, `PORT=<port>`), and optionally writing them directly to `/etc/systemd/system/` and activating them.

---

## ⚡ Quick Start (CLI)

Run directly via `npx` with zero installation:

```bash
# 1. Inside your app directory (/root/KeshavSoft/appointment-booking):
npx ubuntu-service-create 3004

# 2. Or using the shortcut binary 'usc':
npx usc appointment-booking 3004

# 3. Write directly to /etc/systemd/system/appointment-booking.service:
npx usc appointment-booking 3004 --write

# 4. Complete 1-shot deployment: write + reload daemon + enable & start now:
npx usc appointment-booking 3004 --enable
```

---

## 📋 CLI Usage & Options

```text
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
```

---

## 💻 Programmatic API

```bash
npm install ubuntu-service-create
```

```javascript
import { generateServiceUnit, writeServiceUnit, createService } from "ubuntu-service-create";

// 1. Pure text generation (zero side-effects)
const unitContent = generateServiceUnit({
  name: "appointment-booking",
  port: 3004,
  workingDirectory: "/root/KeshavSoft/appointment-booking"
});

console.log(unitContent);

// 2. High-level creator with direct write
const result = createService({
  name: "appointment-booking",
  port: 3004,
  write: true,
  enable: true // Reloads daemon and starts service
});

console.log(result.path); // /etc/systemd/system/appointment-booking.service
```

---

## 📄 Output Unit Standard

```ini
[Unit]
Description=appointment-booking Node Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/KeshavSoft/appointment-booking

Environment=NODE_ENV=production
Environment=PORT=3004
EnvironmentFile=/root/KeshavSoft/appointment-booking/.env

ExecStart=/root/.nvm/versions/node/v24.13.0/bin/node app.js

Restart=on-failure
RestartSec=5

StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

---

## 🧪 Testing

Run the native Node.js test suite:

```bash
npm test
```

---

## 📄 License

ISC License (c) 2026 KeshavSoft
