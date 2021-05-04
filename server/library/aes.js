const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";
const BLOCK_SIZE = 16;

exports.decrypt = (key, cipherText) => {
  const contents = Buffer.from(cipherText, 'hex');
  const iv = contents.slice(0, BLOCK_SIZE);
  const textBytes = contents.slice(BLOCK_SIZE);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(textBytes, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

exports.encrypt = (key, plainText) => {
  const iv = crypto.randomBytes(BLOCK_SIZE);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let cipherText;
  try {
    cipherText = cipher.update(plainText, 'utf8', 'hex');
    cipherText += cipher.final('hex');
    cipherText = iv.toString('hex') + cipherText
  } catch (e) {
    cipherText = null;
  }
  return cipherText;
}