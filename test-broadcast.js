const http = require('http');

const loginData = JSON.stringify({
  email: 'batiyauadminabhay62@gmail.com',
  password: 'adminabhay@62'
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const parsedData = JSON.parse(data);
    const token = parsedData.token;
    
    if (!token) {
      console.log('Login failed:', parsedData);
      return;
    }
    
    console.log('Login successful! Sending broadcast...');
    
    const broadcastData = JSON.stringify({
      title: 'Automated Test Broadcast',
      content: 'This is a system generated test broadcast.',
      category: 'announcement',
      level: 'info',
      target: 'all',
      sendAsChatMessage: true
    });
    
    const broadcastReq = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/broadcast',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': broadcastData.length,
        'Authorization': `Bearer ${token}`
      }
    }, (bRes) => {
      let bData = '';
      bRes.on('data', chunk => bData += chunk);
      bRes.on('end', () => {
        console.log('Broadcast Response:', bRes.statusCode, bData);
      });
    });
    
    broadcastReq.on('error', (e) => console.error('Broadcast request error:', e));
    broadcastReq.write(broadcastData);
    broadcastReq.end();
  });
});

req.on('error', (e) => console.error('Login request error:', e));
req.write(loginData);
req.end();
