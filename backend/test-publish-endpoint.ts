import { spawn } from 'child_process';
import http from 'http';

console.log('Starting backend server...');

const backend = spawn('npm', ['run', 'start:dev'], {
  cwd: 'C:\\Vibe Coding\\contenly\\backend',
  shell: true,
  stdio: 'pipe'
});

let serverReady = false;

backend.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('[Backend]', output.trim());

  if (output.includes('Contently Backend running')) {
    if (!serverReady) {
      serverReady = true;
      console.log('✅ Backend server is ready!');

      setTimeout(() => {
        testPublishEndpoint();
      }, 2000);
    }
  }
});

backend.stderr.on('data', (data) => {
  console.error('[Backend Error]', data.toString());
});

function testPublishEndpoint() {
  console.log('\n🧪 Testing PATCH /api/articles/7d227a4a-7dfd-4f48-9939-c7bc8c87db0b/publish...\n');

  const articleId = '7d227a4a-7dfd-4f48-9939-c7bc8c87db0b';

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/articles/${articleId}/publish`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const req = http.request(options, (res) => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Headers:', JSON.stringify(res.headers, null, 2));

    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      console.log('Response Body:', body);

      if (res.statusCode === 200) {
        console.log('\n✅ SUCCESS! Endpoint is working!');
      } else if (res.statusCode === 404) {
        console.log('\n❌ FAILED! 404 - Route not found');
        console.log('\n⚠️ This means the route is not registered in NestJS.');
        console.log('⚠️ Possible causes:');
        console.log('   1. Controller not properly decorated');
        console.log('   2. Module not imported in app.module');
        console.log('   3. Syntax error in controller file');
        console.log('   4. TypeScript compilation error');
      }

      backend.kill();
      process.exit(res.statusCode === 200 ? 0 : 1);
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request failed:', err.message);
    backend.kill();
    process.exit(1);
  });

  req.end();
}
