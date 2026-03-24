const http = require('http');

const data = JSON.stringify({
    name: 'System Test',
    email: 'test@example.com',
    phone: '0000',
    isReturn: false,
    pickup: 'Test Start',
    dropoff: 'Test End',
    date: '2026-03-24',
    time: '12:00',
    passengers: '1',
    vehicleClass: 'Saloon'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/book',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.write(data);
req.end();
