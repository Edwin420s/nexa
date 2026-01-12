import axios, { AxiosInstance } from 'axios';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const API_VERSION = 'v1';

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    duration?: number;
}

class BackendTester {
    private client: AxiosInstance;
    private results: TestResult[] = [];
    private token: string = '';

    constructor() {
        this.client = axios.create({
            baseURL: `${BASE_URL}/api/${API_VERSION}`,
            timeout: 5000,
            validateStatus: () => true // Don't throw on any status
        });
    }

    private async test(name: string, testFn: () => Promise<void>): Promise<void> {
        const start = Date.now();
        try {
            await testFn();
            const duration = Date.now() - start;
            this.results.push({ name, passed: true, duration });
            console.log(`✓ ${name} (${duration}ms)`);
        } catch (error: any) {
            const duration = Date.now() - start;
            this.results.push({
                name,
                passed: false,
                error: error.message,
                duration
            });
            console.log(`✗ ${name} - ${error.message}`);
        }
    }

    async testHealthEndpoint(): Promise<void> {
        await this.test('Health Endpoint', async () => {
            const response = await axios.get(`${BASE_URL}/health`);
            if (response.status !== 200) {
                throw new Error(`Expected 200, got ${response.status}`);
            }
            if (!response.data.status) {
                throw new Error('Missing status field in response');
            }
        });
    }

    async testRootEndpoint(): Promise<void> {
        await this.test('Root Endpoint', async () => {
            const response = await axios.get(BASE_URL);
            if (response.status !== 200) {
                throw new Error(`Expected 200, got ${response.status}`);
            }
            if (!response.data.message) {
                throw new Error('Missing message field in response');
            }
        });
    }

    async testUserRegistration(): Promise<void> {
        await this.test('User Registration', async () => {
            const response = await this.client.post('/auth/register', {
                email: `test${Date.now()}@nexa.ai`,
                password: 'testpass123',
                name: 'Test User'
            });

            if (response.status !== 200 && response.status !== 201) {
                throw new Error(`Expected 200/201, got ${response.status}`);
            }

            if (!response.data.data?.token) {
                throw new Error('No token in registration response');
            }
        });
    }

    async testUserLogin(): Promise<void> {
        await this.test('User Login', async () => {
            const response = await this.client.post('/auth/login', {
                email: 'test@nexa.ai',
                password: 'testpass123'
            });

            if (response.status !== 200) {
                throw new Error(`Expected 200, got ${response.status}`);
            }

            if (response.data.data?.token) {
                this.token = response.data.data.token;
            }
        });
    }

    async testListProjects(): Promise<void> {
        await this.test('List Projects', async () => {
            const response = await this.client.get('/projects', {
                headers: this.token ? { Authorization: `Bearer ${this.token}` } : {}
            });

            if (response.status !== 200) {
                throw new Error(`Expected 200, got ${response.status}`);
            }

            if (!response.data.data?.projects) {
                throw new Error('No projects array in response');
            }
        });
    }

    async testCreateProject(): Promise<void> {
        await this.test('Create Project', async () => {
            const response = await this.client.post('/projects', {
                title: 'Test Project',
                description: 'Testing project creation',
                goal: 'Build a sample API',
                agents: [
                    { name: 'researcher', model: 'gemini-2.5-flash' },
                    { name: 'code-builder', model: 'gemini-2.5-pro' }
                ]
            }, {
                headers: this.token ? { Authorization: `Bearer ${this.token}` } : {}
            });

            if (response.status !== 200 && response.status !== 201) {
                throw new Error(`Expected 200/201, got ${response.status}`);
            }

            if (!response.data.data?.project) {
                throw new Error('No project in response');
            }
        });
    }

    async test404Response(): Promise<void> {
        await this.test('404 Error Handling', async () => {
            const response = await this.client.get('/nonexistent-route');

            if (response.status !== 404) {
                throw new Error(`Expected 404, got ${response.status}`);
            }
        });
    }

    async testCORS(): Promise<void> {
        await this.test('CORS Headers', async () => {
            const response = await axios.get(`${BASE_URL}/health`);

            const corsHeader = response.headers['access-control-allow-origin'];
            if (!corsHeader) {
                throw new Error('Missing CORS headers');
            }
        });
    }

    async testResponseTime(): Promise<void> {
        await this.test('Response Time < 500ms', async () => {
            const start = Date.now();
            await axios.get(`${BASE_URL}/health`);
            const duration = Date.now() - start;

            if (duration > 500) {
                throw new Error(`Response time ${duration}ms exceeds 500ms threshold`);
            }
        });
    }

    async testConcurrentRequests(): Promise<void> {
        await this.test('10 Concurrent Requests', async () => {
            const promises = Array(10).fill(null).map(() =>
                axios.get(`${BASE_URL}/health`)
            );

            const responses = await Promise.all(promises);
            const allSuccessful = responses.every(r => r.status === 200);

            if (!allSuccessful) {
                throw new Error('Not all concurrent requests succeeded');
            }
        });
    }

    printSummary(): void {
        console.log('\n' + '='.repeat(60));
        console.log('TEST SUMMARY');
        console.log('='.repeat(60));

        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const total = this.results.length;

        console.log(`Total:  ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);

        if (failed > 0) {
            console.log('\nFailed Tests:');
            this.results
                .filter(r => !r.passed)
                .forEach(r => {
                    console.log(`  ✗ ${r.name}: ${r.error}`);
                });
        }

        const avgDuration = this.results.reduce((sum, r) => sum + (r.duration || 0), 0) / total;
        console.log(`\nAverage Response Time: ${avgDuration.toFixed(2)}ms`);

        console.log('\n' + (failed === 0 ? '✓ All tests passed!' : '✗ Some tests failed'));
        console.log('='.repeat(60));
    }

    async runAll(): Promise<void> {
        console.log('Starting Nexa Backend Tests...\n');

        // Health checks
        await this.testHealthEndpoint();
        await this.testRootEndpoint();

        // Authentication
        await this.testUserRegistration();
        await this.testUserLogin();

        // Projects
        await this.testListProjects();
        await this.testCreateProject();

        // Error handling
        await this.test404Response();

        // Additional checks
        await this.testCORS();
        await this.testResponseTime();
        await this.testConcurrentRequests();

        this.printSummary();

        // Exit with appropriate code
        const failed = this.results.filter(r => !r.passed).length;
        process.exit(failed > 0 ? 1 : 0);
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tester = new BackendTester();
    tester.runAll().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

export default BackendTester;
