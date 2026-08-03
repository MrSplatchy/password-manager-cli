import { input, password } from "@inquirer/prompts";
import sodium from "libsodium-wrappers-sumo";
import fs from "fs";

export async function CreateVault() {
  if (fs.existsSync("vault.bin")) {
    console.log("vault already created");
    return;
  }

  // Choose password
  const psw = await password({
    message: "Create a Master Password",
    mask: true,
  });
  sodium.ready;

  // Create salt & key
  const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);

  const key = sodium.crypto_pwhash(
    sodium.crypto_secretbox_KEYBYTES,
    psw,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_MODERATE,
    sodium.crypto_pwhash_MEMLIMIT_MODERATE,
    sodium.crypto_pwhash_ALG_DEFAULT,
  );

  // Create nonce
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

  // Create vault
  const plaintext = JSON.stringify([
    {
      username: "",
      password: "",
    },
  ]);

  const ciphertext = sodium.crypto_secretbox_easy(plaintext, nonce, key);

  // Save as file
  const enc_data = Buffer.concat([
    Buffer.from(salt),
    Buffer.from(nonce),
    Buffer.from(ciphertext),
  ]);

  fs.writeFileSync("vault.bin", enc_data);
}

async function OpenVault(salt, nonce, ciphertext) {
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

  try {
    const plaintext = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  } catch (err) {
    console.log("Wrong!");
    return;
  }

  console.log("OK->");
  return [plaintext, key];
}

export async function NewEntry() {
  // Read file
  const file = fs.readFileSync("vault.bin");
  const salt = file.subarray(0, 16);
  let nonce = file.subarray(16, 40);
  const ciphertext = file.subarray(40);
  sodium.ready;

  // Opens the vault
  const [bytestext, key] = OpenVault(salt, nonce, ciphertext);

  // Ask for the new username and password
  const username = await input({ message: "Username:" });
  const passwd = await password({ message: "Password:" });

  plaintext = sodium.to_string(bytestext);
  vault = JSON.parse(plaintext);
  vault.push({ username: username, password: passwd });

  const new_nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

  const ciphertext = sodium.crypto_secretbox_easy(
    JSON.stringify(vault),
    nonce,
    key,
  );

  const enc_data = Buffer.concat([
    Buffer.from(salt),
    Buffer.from(new_nonce),
    Buffer.from(ciphertext),
  ]);

  fs.writeFileSync("vault.bin", enc_data);
}
