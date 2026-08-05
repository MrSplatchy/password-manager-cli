import { input, password } from "@inquirer/prompts";
import sodium from "libsodium-wrappers-sumo";
import fs from 'fs'

export async function OpenVault() {
  // Read file
  const file = fs.readFileSync("vault.bin");
  const salt = file.subarray(0, 16);
  let nonce = file.subarray(16, 40);
  const ciphertext = file.subarray(40);
  await sodium.ready;
  
  const psw = await password({
    message: "Enter your master password",
    mask: true,
  });

  const key = sodium.crypto_pwhash(
    sodium.crypto_secretbox_KEYBYTES,
    psw,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_MODERATE,
    sodium.crypto_pwhash_MEMLIMIT_MODERATE,
    sodium.crypto_pwhash_ALG_DEFAULT,
  );

  let plaintext
  try {
    plaintext = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  } catch (err) {
    console.log("Wrong!");
    return;
  }

  console.log("OK->");

  return [plaintext, key, salt];
}


export function EncryptVault(vault, key, salt) {
  // Regenerate nonce
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

  const ciphertext = sodium.crypto_secretbox_easy(
    JSON.stringify(vault),
    nonce,
    key,
  );

  // Rewrite the data
  const enc_data = Buffer.concat([
    Buffer.from(salt),
    Buffer.from(nonce),
    Buffer.from(ciphertext),
  ]);

  fs.writeFileSync("vault.bin", enc_data);
  
}