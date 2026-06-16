function r16(buf, off) { return buf.readUInt16LE(off); }
function r32(buf, off) { return buf.readUInt32LE(off); }
function w16(buf, off, v) { buf.writeUInt16LE(v, off); }
function w32(buf, off, v) { buf.writeUInt32LE(v, off); }

function getStr(buf, ps, si, offs, ss) {
  if (si < 0 || si >= offs.length) return null;
  const off = ps + ss + offs[si];
  const len = r16(buf, off);
  let s = '';
  for (let i = 0; i < len; i++) s += String.fromCharCode(r16(buf, off + 2 + i * 2));
  return s;
}

function strBytes(s) {
  return 2 + s.length * 2;
}

function patchAndroidLabel(axmlBuf, customName) {
  if (!customName) return Buffer.from(axmlBuf);
  const buf = Buffer.from(axmlBuf);

  const ps = 8;
  const sc = r32(buf, ps + 8);
  const ss = r32(buf, ps + 20);

  const offs = [];
  for (let i = 0; i < sc; i++) offs.push(r32(buf, ps + 28 + i * 4));

  const strMap = {};
  for (let i = 0; i < sc; i++) strMap[i] = getStr(buf, ps, i, offs, ss);

  // Scan for <application> tag and find android:label
  let ox = 8;
  let labelFound = false;

  while (ox < buf.length) {
    const ct = r16(buf, ox);
    const cs = r32(buf, ox + 4);
    if (ct === 0x0102) {
      const hs = r16(buf, ox + 2);
      const nameIdx = r32(buf, ox + 20);
      const tname = strMap[nameIdx];
      if (tname === 'application') {
        const attrCount = r16(buf, ox + 28);
        const attrStart = r16(buf, ox + 24);
        const attrSize = r16(buf, ox + 26);
        for (let a = 0; a < attrCount; a++) {
          // attributeStart is relative to ox + headerSize
          const ao = ox + hs + attrStart + a * attrSize;
          const ans = r32(buf, ao);
          const an = r32(buf, ao + 4);
          if (ans !== 0xFFFFFFFF) {
            const ns = strMap[ans];
            const aname = strMap[an];
            if (ns === 'http://schemas.android.com/apk/res/android' && aname === 'label') {
              labelFound = true;

              // Find end of string data
              let lastEnd = 0;
              for (let i = 0; i < sc; i++) {
                const e = offs[i] + strBytes(strMap[i]);
                if (e > lastEnd) lastEnd = e;
              }
              const oldDataEnd = ps + ss + lastEnd;

              const addSize = 4 + strBytes(customName);
              const newBuf = Buffer.alloc(buf.length + addSize);
              const offsEnd = ps + 28 + sc * 4;

              // Copy up to end of offsets array
              buf.copy(newBuf, 0, 0, offsEnd);
              // Copy string data + everything after, shifted by 4
              buf.copy(newBuf, offsEnd + 4, offsEnd, oldDataEnd);
              // Copy rest of file after string data, shifted by addSize
              buf.copy(newBuf, oldDataEnd + addSize, oldDataEnd);

              // Write new string offset
              w32(newBuf, offsEnd, lastEnd);
              // Write new string data
              const nsp = oldDataEnd + 4;
              w16(newBuf, nsp, customName.length);
              for (let i = 0; i < customName.length; i++) {
                w16(newBuf, nsp + 2 + i * 2, customName.charCodeAt(i));
              }

              // Update pool header
              w32(newBuf, ps + 4, r32(newBuf, ps + 4) + addSize);
              w32(newBuf, ps + 8, sc + 1);
              w32(newBuf, ps + 20, ss + 4);
              // Update file size
              w32(newBuf, 4, buf.length + addSize);

              // Re-scan in new buffer to find label attr and modify it
              const sc2 = r32(newBuf, ps + 8);
              const ss2 = r32(newBuf, ps + 20);
              const offs2 = [];
              for (let i = 0; i < sc2; i++) offs2.push(r32(newBuf, ps + 28 + i * 4));
              const sm2 = {};
              for (let i = 0; i < sc2; i++) sm2[i] = getStr(newBuf, ps, i, offs2, ss2);

              let ox2 = 8;
              let patched = false;
              while (ox2 < newBuf.length) {
                const ct2 = r16(newBuf, ox2);
                const cs2 = r32(newBuf, ox2 + 4);
                if (ct2 === 0x0102) {
                  const hs2 = r16(newBuf, ox2 + 2);
                  const ni2 = r32(newBuf, ox2 + 20);
                  if (sm2[ni2] === 'application') {
                    const ac2 = r16(newBuf, ox2 + 28);
                    const as2 = r16(newBuf, ox2 + 24);
                    const az2 = r16(newBuf, ox2 + 26);
                    for (let a = 0; a < ac2; a++) {
                      const ao2 = ox2 + hs2 + as2 + a * az2;
                      const ans2 = r32(newBuf, ao2);
                      const an2 = r32(newBuf, ao2 + 4);
                      if (ans2 !== 0xFFFFFFFF && sm2[ans2] === 'http://schemas.android.com/apk/res/android' && sm2[an2] === 'label') {
                        newBuf[ao2 + 12] = 8;
                        newBuf[ao2 + 14] = 0;
                        newBuf[ao2 + 15] = 0x03;
                        w32(newBuf, ao2 + 16, sc);
                        w32(newBuf, ao2 + 8, sc);
                        patched = true;
                        break;
                      }
                    }
                    break;
                  }
                }
                ox2 += cs2;
              }

              if (!patched) return buf;
              return newBuf;
            }
          }
        }
        break;
      }
    }
    ox += cs;
  }

  return buf;
}

module.exports = { patchAndroidLabel };
