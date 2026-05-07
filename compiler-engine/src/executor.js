const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Executes code inside a sandboxed Docker container
 * @param {string} language - The language to execute
 * @param {Array} files - Array of { name, content }
 * @param {string} stdin - Optional input for the program
 * @returns {Promise<Object>} - { stdout, stderr, exitCode }
 */
async function executeCode(language, files, stdin = '') {
    const requestId = uuidv4();
    const tempDir = path.join(__dirname, '../temp', requestId);

    try {
        // 1. Create temporary directory and write files
        await fs.ensureDir(tempDir);
        for (const file of files) {
            await fs.writeFile(path.join(tempDir, file.name), file.content);
        }
        if (stdin) {
            await fs.writeFile(path.join(tempDir, 'stdin.txt'), stdin);
        }

        // 2. Determine execution command based on language
        let compileCmd = '';
        let runCmd = '';
        let containerImage = 'compiler-runner:latest';

        switch (language.toLowerCase()) {
            case 'c':
                compileCmd = 'gcc main.c -o solution';
                runCmd = './solution < stdin.txt';
                break;
            case 'cpp':
            case 'c++':
                compileCmd = 'g++ main.cpp -o solution';
                runCmd = './solution < stdin.txt';
                break;
            case 'python':
                runCmd = 'python3 main.py < stdin.txt';
                break;
            case 'java':
                compileCmd = 'javac Main.java';
                runCmd = 'java Main < stdin.txt';
                break;
            case 'javascript':
            case 'nodejs':
                runCmd = 'node main.js < stdin.txt';
                break;
            case 'go':
                runCmd = 'go run main.go < stdin.txt';
                break;
            case 'rust':
                compileCmd = 'rustc main.rs -o solution';
                runCmd = './solution < stdin.txt';
                break;
            default:
                throw new Error(`Unsupported language: ${language}`);
        }

        const fullCmd = compileCmd ? `${compileCmd} && ${runCmd}` : runCmd;

        // 3. Build Docker command with security constraints
        // --network none: No internet access
        // --memory/--cpus: Resource limits
        // --rm: Remove container after exit
        // -v: Mount temp dir as volume
        const dockerCmd = `docker run --rm \
            --network none \
            --memory 128m \
            --cpus 0.5 \
            -v ${tempDir}:/home/runner/workspace \
            -w /home/runner/workspace \
            ${containerImage} \
            bash -c "${fullCmd}"`;

        // 4. Execute and capture output
        return new Promise((resolve) => {
            const timeout = 10000; // 10s execution limit

            const child = exec(dockerCmd, { timeout }, (error, stdout, stderr) => {
                resolve({
                    stdout: stdout || '',
                    stderr: stderr || (error && error.killed ? 'Execution timed out (10s limit).' : (error ? error.message : '')),
                    exitCode: error ? error.code : 0
                });
            });
        });

    } catch (err) {
        return { stdout: '', stderr: err.message, exitCode: 1 };
    } finally {
        // 5. Cleanup temp files (delayed slightly to ensure container is gone)
        setTimeout(() => fs.remove(tempDir).catch(console.error), 5000);
    }
}

module.exports = { executeCode };
