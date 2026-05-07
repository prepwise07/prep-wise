const express = require('express');
const cors = require('cors');
const { Queue } = require('bullmq');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Redis Configuration
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
};

// BullMQ Queue
const executionQueue = new Queue('execution-queue', { connection });

app.get('/health', (req, res) => {
    res.json({ status: 'Compiler Engine is online' });
});

/**
 * Endpoint to submit code for execution
 * Body: { language: string, files: [{name, content}], stdin: string }
 */
app.post('/execute', async (req, res) => {
    const { language, files, stdin } = req.body;

    if (!language || !files || !Array.isArray(files)) {
        return res.status(400).json({ error: 'Invalid request. Language and files array required.' });
    }

    try {
        const jobId = uuidv4();
        const job = await executionQueue.add('compile-run',
            { language, files, stdin },
            { jobId }
        );

        res.json({
            message: 'Job submitted',
            jobId: job.id
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to queue job', details: err.message });
    }
});

/**
 * Endpoint to poll for job result
 */
app.get('/status/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const job = await executionQueue.getJob(jobId);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    const status = await job.getState();
    const result = job.returnvalue;

    res.json({
        status,
        result: result || null,
        progress: job.progress
    });
});

app.listen(PORT, () => {
    console.log(`Compiler Engine listening on port ${PORT}`);
});
