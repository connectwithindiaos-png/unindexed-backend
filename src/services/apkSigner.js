const forge = require('node-forge');
const AdmZip = require('adm-zip');
const crypto = require('crypto');

function generateCert() {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
  const attrs = [{ name: 'commonName', value: 'APK Signer' }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([{ name: 'basicConstraints', cA: true }]);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  return { cert, privateKey: keys.privateKey };
}

function createManifest(zip) {
  const entries = zip.getEntries().filter(e => !e.isDirectory);
  let mf = 'Manifest-Version: 1.0\r\nCreated-By: APK Signer\r\n\r\n';
  for (const entry of entries) {
    const data = entry.getData();
    const digest = crypto.createHash('sha256').update(data).digest('base64');
    const name = entry.entryName.replace(/\r?\n/, ' ');
    mf += `Name: ${name}\r\nSHA-256-Digest: ${digest}\r\n\r\n`;
  }
  return mf;
}

function createSf(manifestDigest) {
  return `Signature-Version: 1.0\r\nCreated-By: APK Signer\r\nSHA-256-Digest-Manifest: ${manifestDigest}\r\n\r\n`;
}

function createPkcs7(cert, privateKey, sfDigest) {
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(sfDigest);
  p7.addCertificate(cert);
  p7.addSigner({
    key: privateKey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest, value: sfDigest },
      { type: forge.pki.oids.signingTime, value: new Date().toISOString() },
    ],
  });
  p7.sign({ detached: true });
  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  return Buffer.from(der, 'binary');
}

function signApk(apkBuffer) {
  const zip = new AdmZip(apkBuffer);

  // Remove any existing signature files
  const toRemove = [];
  for (const entry of zip.getEntries()) {
    if (entry.entryName === 'META-INF/MANIFEST.MF' ||
        entry.entryName.endsWith('.SF') ||
        entry.entryName.endsWith('.RSA') ||
        entry.entryName.endsWith('.DSA') ||
        entry.entryName.endsWith('.EC')) {
      toRemove.push(entry.entryName);
    }
  }
  for (const name of toRemove) {
    zip.deleteFile(name);
  }

  // Generate cert
  const { cert, privateKey } = generateCert();

  // Create MANIFEST.MF
  const manifestContent = createManifest(zip);
  const manifestDigest = crypto.createHash('sha256').update(manifestContent).digest('base64');

  // Create CERT.SF
  const sfContent = createSf(manifestDigest);
  const sfDigest = crypto.createHash('sha256').update(sfContent).digest('base64');

  // Create CERT.RSA (PKCS7)
  const rsaData = createPkcs7(cert, privateKey, sfDigest);

  // Add signature files back
  zip.addFile('META-INF/MANIFEST.MF', Buffer.from(manifestContent, 'utf8'));
  zip.addFile('META-INF/CERT.SF', Buffer.from(sfContent, 'utf8'));
  zip.addFile('META-INF/CERT.RSA', rsaData);

  return zip.toBuffer();
}

module.exports = { signApk };
