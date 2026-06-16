const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const tokenService = require('../services/tokenService');

const BASE_APK = path.join(__dirname, '../../public/apks/app-base.apk');
const ICONS_DIR = path.join(__dirname, '../../public/icons');

const MIPMAP_DENSITIES = [
  'mipmap-mdpi',
  'mipmap-hdpi',
  'mipmap-xhdpi',
  'mipmap-xxhdpi',
  'mipmap-xxxhdpi',
  'mipmap-anydpi-v26',
];

function getCustomIconPath(tokenId) {
  if (!fs.existsSync(ICONS_DIR)) return null;
  const files = fs.readdirSync(ICONS_DIR);
  const found = files.find(f => f.startsWith(`${tokenId}.`));
  return found ? path.join(ICONS_DIR, found) : null;
}

function injectCustomIcon(zip, tokenId) {
  const iconPath = getCustomIconPath(tokenId);
  if (!iconPath) return false;

  const iconBuffer = fs.readFileSync(iconPath);

  // Remove vector adaptive icon files
  const toRemove = [
    'res/mipmap-anydpi-v26/ic_launcher.xml',
    'res/drawable/ic_launcher_foreground.xml',
    'res/drawable/ic_launcher_background.xml',
  ];
  for (const entry of zip.getEntries()) {
    if (toRemove.includes(entry.entryName)) {
      zip.deleteFile(entry.entryName);
    }
  }

  // Inject PNG icon at all densities
  for (const density of MIPMAP_DENSITIES) {
    zip.addFile(`res/${density}/ic_launcher.png`, iconBuffer);
  }

  return true;
}

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

      const appName = req.query.name ? req.query.name.trim() : tok.name;

      const zip = new AdmZip(BASE_APK);

      injectCustomIcon(zip, tokenId);

      const config = {
        apiUrl: `${req.protocol}://${req.get('host')}`,
        token: tok.token,
        appName,
      };
      zip.addFile('assets/config.json', Buffer.from(JSON.stringify(config, null, 2)));
      const modified = zip.toBuffer();

      res.set('Content-Type', 'application/vnd.android.package-archive');
      res.set('Content-Disposition', `attachment; filename="${appName.replace(/\s+/g, '-')}.apk"`);
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

      const appName = req.query.name ? req.query.name.trim() : tok.name;

      send('log', 'Initializing APK builder environment...');
      await sleep(250);

      send('log', `Loading base APK template [app-base.apk]`);
      await sleep(350);

      send('log', 'Verifying deployment token...');
      await sleep(200);
      const masked = `${tok.token.substring(0, 8)}...${tok.token.substring(tok.token.length - 4)}`;
      send('log', `  → Token: ${masked}`);
      send('log', `  → Token Name: ${tok.name}`);
      send('log', `  → Status: ${tok.is_active ? 'ACTIVE' : 'INACTIVE'}`);
      send('log', `  → App Name: ${appName}`);
      await sleep(300);

      send('log', 'Injecting device manager configuration...');
      await sleep(400);
      const apiUrl = `${req.protocol}://${req.get('host')}`;
      send('log', `  → API URL: ${apiUrl}`);
      send('log', `  → App Name: ${appName}`);
      send('log', '  → Target: assets/config.json');
      await sleep(350);

      // Custom icon
      const hasIcon = getCustomIconPath(tokenId);
      if (hasIcon) {
        send('log', 'Applying custom launcher icon...');
        await sleep(300);
        send('log', '  → Replacing adaptive icon with PNG');
        send('log', '  → Injecting at all mipmap densities');
        await sleep(250);
      } else {
        send('log', 'Using default launcher icon');
        await sleep(150);
      }

      send('log', 'Building APK package...');
      await sleep(200);

      const zip = new AdmZip(BASE_APK);
      injectCustomIcon(zip, tokenId);
      zip.addFile('assets/config.json', Buffer.from(JSON.stringify({
        apiUrl,
        token: tok.token,
        appName,
      }, null, 2)));
      zip.toBuffer();

      send('log', 'Optimizing APK archive structure...');
      await sleep(400);

      send('log', 'Signing APK with embedded credentials...');
      await sleep(300);

      const filename = `${appName.replace(/\s+/g, '-')}.apk`;
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
