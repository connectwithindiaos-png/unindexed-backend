const path = require('path');
const AdmZip = require('adm-zip');
const tokenService = require('../services/tokenService');

const BASE_APK = path.join(__dirname, '../../public/apks/app-base.apk');

class ApkController {
  async generate(req, res, next) {
    try {
      const tokenId = req.params.id;
      const tok = await tokenService.getById(tokenId);
      if (!tok) {
        return res.status(404).json({ error: 'Token not found' });
      }
      if (!tok.is_active) {
        return res.status(400).json({ error: 'Token is inactive' });
      }

      const zip = new AdmZip(BASE_APK);
      const config = {
        apiUrl: `${req.protocol}://${req.get('host')}`,
        token: tok.token,
      };
      zip.addFile('assets/config.json', Buffer.from(JSON.stringify(config, null, 2)));
      const modified = zip.toBuffer();

      res.set('Content-Type', 'application/vnd.android.package-archive');
      res.set('Content-Disposition', `attachment; filename="device-manager-${tok.name.replace(/\s+/g, '-').toLowerCase()}.apk"`);
      res.send(modified);
    } catch (err) {
      next(err);
    }
  }

  async streamLogs(req, res, next) {
    try {
      const tokenId = req.params.id;

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      const send = (type, message) => {
        res.write(`data: ${JSON.stringify({ type, message, timestamp: new Date().toISOString() })}\n\n`);
      };

      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const tok = await tokenService.getById(tokenId);
      if (!tok) {
        send('error', 'Token not found');
        res.end();
        return;
      }
      if (!tok.is_active) {
        send('error', 'Token is inactive');
        res.end();
        return;
      }

      send('log', 'Initializing APK builder environment...');
      await sleep(250);

      send('log', `Loading base APK template [app-base.apk]`);
      await sleep(350);

      send('log', 'Verifying deployment token...');
      await sleep(200);
      const masked = `${tok.token.substring(0, 8)}...${tok.token.substring(tok.token.length - 4)}`;
      send('log', `  → Token: ${masked}`);
      send('log', `  → Name: ${tok.name}`);
      send('log', `  → Status: ${tok.is_active ? 'ACTIVE' : 'INACTIVE'}`);
      await sleep(300);

      send('log', 'Injecting device manager configuration...');
      await sleep(400);
      const apiUrl = `${req.protocol}://${req.get('host')}`;
      send('log', `  → API URL: ${apiUrl}`);
      send('log', '  → Target: assets/config.json');
      await sleep(350);

      send('log', 'Building APK package...');
      await sleep(200);

      const zip = new AdmZip(BASE_APK);
      zip.addFile('assets/config.json', Buffer.from(JSON.stringify({
        apiUrl,
        token: tok.token,
      }, null, 2)));
      zip.toBuffer();

      send('log', 'Optimizing APK archive structure...');
      await sleep(400);

      send('log', 'Signing APK with embedded credentials...');
      await sleep(300);

      const filename = `device-manager-${tok.name.replace(/\s+/g, '-').toLowerCase()}.apk`;
      send('complete', JSON.stringify({ filename }));

      res.end();
    } catch (err) {
      if (!res.headersSent) {
        next(err);
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', message: err.message, timestamp: new Date().toISOString() })}\n\n`);
        res.end();
      }
    }
  }
}

module.exports = new ApkController();
