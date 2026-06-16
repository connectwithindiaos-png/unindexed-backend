const path = require('path');
const fs = require('fs');

const ICONS_DIR = path.join(__dirname, '../../public/icons');

class IconController {
  async upload(req, res, next) {
    try {
      const tokenId = req.params.id;
      const { icon } = req.body;

      if (!icon) {
        return res.status(400).json({ error: 'No icon data provided' });
      }

      const matches = icon.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: 'Invalid icon format. Use PNG, JPEG, or WebP base64.' });
      }

      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const buffer = Buffer.from(matches[2], 'base64');

      if (!fs.existsSync(ICONS_DIR)) {
        fs.mkdirSync(ICONS_DIR, { recursive: true });
      }

      const filePath = path.join(ICONS_DIR, `${tokenId}.${ext}`);
      fs.writeFileSync(filePath, buffer);

      res.json({ iconUrl: `/icons/${tokenId}.${ext}` });
    } catch (err) {
      next(err);
    }
  }

  async get(req, res, next) {
    try {
      const tokenId = req.params.id;
      const files = fs.readdirSync(ICONS_DIR);
      const found = files.find(f => f.startsWith(`${tokenId}.`));
      if (!found) {
        return res.status(404).json({ error: 'No icon found for this token' });
      }
      res.sendFile(path.join(ICONS_DIR, found));
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const tokenId = req.params.id;
      const files = fs.readdirSync(ICONS_DIR);
      const found = files.find(f => f.startsWith(`${tokenId}.`));
      if (found) {
        fs.unlinkSync(path.join(ICONS_DIR, found));
      }
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new IconController();
