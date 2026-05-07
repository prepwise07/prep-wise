const { Worker } = require('bullmq');
const { executeCode } = require('./executor');
require('dotenv').config();

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
};

const worker = new Worker('execution-queue', async (job) => {
    console.log(`Processing Job: ${job.id} for ${job.data.language}`);

    try {
        const result = await executeCode(
            job.data.language,
            job.data.files,
            job.data.stdin
        );

        return result;
    } catch (err) {
        console.error(`Error in Worker for Job ${job.id}:`, err);
        throw err;
    }
}, { connection });

worker.on('completed', job => {
    console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} has failed with ${err.message}`);
});

console.log('Execution Worker started...');
