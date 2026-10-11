const nodemailer = require('nodemailer');

const EMAIL = 'hello@us-executivetravel.com';
const PASS  = 'Thegodfathers082713!';

const configs = [
  { host: 'smtp.ionos.co.uk', port: 587, secure: false },
  { host: 'smtp.ionos.co.uk', port: 465, secure: true  },
  { host: 'smtp.ionos.com',   port: 587, secure: false },
  { host: 'smtp.ionos.com',   port: 465, secure: true  },
  { host: 'mail.us-executivetravel.com', port: 587, secure: false },
  { host: 'mail.us-executivetravel.com', port: 465, secure: true  },
];

async function test(cfg) {
  const t = nodemailer.createTransport({
    ...cfg,
    auth: { user: EMAIL, pass: PASS },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 8000
  });
  return new Promise(resolve => {
    t.verify((err) => {
      if (err) {
        resolve('FAIL ' + cfg.host + ':' + cfg.port + ' -> ' + err.message);
      } else {
        resolve('OK   ' + cfg.host + ':' + cfg.port + ' -> Connected!');
      }
    });
  });
}

(async () => {
  for (const cfg of configs) {
    const result = await test(cfg);
    console.log(result);
  }
})();
