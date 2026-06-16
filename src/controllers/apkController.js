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
}

module.exports = new ApkController();
