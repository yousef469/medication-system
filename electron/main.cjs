const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Force High Performance GPU (Optional, helpful for UI)
app.commandLine.appendSwitch('force_high_performance_gpu');

let mainWindow;
let pythonServer;

// --- Python Backend Management ---
const PY_MODULE = "server.py";

const startPythonServer = () => {
    console.log("🚀 Starting Python AI Backend...");

    // Spawn python process
    // Ensuring cwd is the project root
    const rootDir = path.join(__dirname, '..');

    pythonServer = spawn('python', [PY_MODULE], {
        cwd: rootDir,
        detached: false,
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    pythonServer.stdout.on('data', (data) => {
        console.log(`[Python]: ${data.toString()}`);
    });

    pythonServer.stderr.on('data', (data) => {
        console.error(`[Python Err]: ${data.toString()}`);
    });

    pythonServer.on('close', (code) => {
        console.log(`[Python] exited with code ${code}`);
    });

    pythonServer.on('error', (err) => {
        console.error("Failed to start python process:", err);
    });
};

const killPythonServer = () => {
    if (pythonServer) {
        console.log("🛑 Killing Python Backend...");
        const kill = require('tree-kill'); // Optional but recommended for shells, using basic kill for now
        // On Windows simple kill might not kill subprocesses if shell=true, but let's try standard first.
        pythonServer.kill();
        pythonServer = null;
    }
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        backgroundColor: '#0f172a',
        icon: path.join(__dirname, '../public/vite.svg'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false // sometimes helps with local resource loading dev issues
        },
    });

    const startUrl = !app.isPackaged
        ? 'http://localhost:5174'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    console.log(`Loading URL: ${startUrl}`);

    if (!app.isPackaged) {
        mainWindow.loadURL(startUrl).catch(e => {
            console.error("Failed to load URL, retrying...", e);
            setTimeout(() => mainWindow.loadURL(startUrl), 3000);
        });
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadURL(startUrl);
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

// Disable Autofill to prevent known crash in some versions
app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication');

app.on('ready', () => {
    startPythonServer();
    createWindow();
});

app.on('window-all-closed', function () {
    killPythonServer();
    if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
    killPythonServer();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});
