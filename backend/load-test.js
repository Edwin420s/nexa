const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TOTAL_REQUESTS = 100;
const CONCURRENT_USERS = 10;

async function loadTest() {
    console.log('🔥 Load Testing Nexa Backend');
    console.log('================================');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Total Requests: ${TOTAL_REQUESTS}`);
    console.log(`Concurrent Users: ${CONCURRENT_USERS}\n`);

    const results = {
        total: 0,
        successful: 0,
        failed: 0,
        times: []
    };

    // Warmup
    console.log('Warming up...');
    await axios.get(`${BASE_URL}/health`);

    console.log('Starting load test...\n');
    const startTime = Date.now();

    // Create batches of concurrent requests
    const batches = Math.ceil(TOTAL_REQUESTS / CONCURRENT_USERS);

    for (let batch = 0; batch < batches; batch++) {
        const promises = [];

        for (let i = 0; i < CONCURRENT_USERS; i++) {
            if (results.total >= TOTAL_REQUESTS) break;

            results.total++;
            const requestStart = Date.now();

            const promise = axios.get(`${BASE_URL}/health`)
                .then(response => {
                    const duration = Date.now() - requestStart;
                    results.times.push(duration);
                    results.successful++;
                    return { success: true, duration };
                })
                .catch(error => {
                    results.failed++;
                    return { success: false, error: error.message };
                });

            promises.push(promise);
        }

        await Promise.all(promises);

        // Progress indicator
        if ((batch + 1) % 10 === 0) {
            console.log(`Progress: ${results.total}/${TOTAL_REQUESTS} requests completed`);
        }
    }

    const totalTime = Date.now() - startTime;

    // Calculate statistics
    const sortedTimes = results.times.sort((a, b) => a - b);
    const avgTime = sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length;
    const minTime = sortedTimes[0];
    const maxTime = sortedTimes[sortedTimes.length - 1];
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    const requestsPerSecond = (results.total / (totalTime / 1000)).toFixed(2);

    // Print results
    console.log('\n================================');
    console.log('📊 Load Test Results');
    console.log('================================');
    console.log(`Total Time:        ${totalTime}ms`);
    console.log(`Total Requests:    ${results.total}`);
    console.log(`Successful:        ${results.successful}`);
    console.log(`Failed:            ${results.failed}`);
    console.log(`Success Rate:      ${((results.successful / results.total) * 100).toFixed(2)}%`);
    console.log(`Requests/Second:   ${requestsPerSecond}`);
    console.log('\nResponse Times:');
    console.log(`  Min:             ${minTime}ms`);
    console.log(`  Average:         ${avgTime.toFixed(2)}ms`);
    console.log(`  Median (P50):    ${p50}ms`);
    console.log(`  P95:             ${p95}ms`);
    console.log(`  P99:             ${p99}ms`);
    console.log(`  Max:             ${maxTime}ms`);
    console.log('================================\n');

    // Health assessment
    if (avgTime < 50) {
        console.log('✓ Excellent performance! 🚀');
    } else if (avgTime < 100) {
        console.log('✓ Good performance! 👍');
    } else if (avgTime < 200) {
        console.log('⚠ Acceptable performance');
    } else {
        console.log('⚠ Performance needs improvement');
    }

    if (results.failed === 0) {
        console.log('✓ No failed requests! 💯');
    } else {
        console.log(`⚠ ${results.failed} requests failed`);
    }
}

// Run if executed directly
if (require.main === module) {
    loadTest().catch(error => {
        console.error('Load test failed:', error);
        process.exit(1);
    });
}

module.exports = loadTest;
