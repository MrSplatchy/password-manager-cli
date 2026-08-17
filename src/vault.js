import { input, password, select } from "@inquirer/prompts";
import sodium from "libsodium-wrappers-sumo";
import fs from "fs";
import { EncryptVault, OpenVault } from "./utils.js";
import clipboard from "clipboardy";

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
  await sodium.ready;

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
      website: "none",
      username: "Example",
      password: "Exemple",
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


export async function NewEntry() {
  if (!fs.existsSync("vault.bin")) {
    console.log("Please init a vault");
    return;
  }

  // Opens the vault
  const result = await OpenVault();
  if (!result) return;
  const [bytestext, key, salt] = result;
  
  // Ask for the new username and password
  const site = await input({ message: "Website:" })
  const name = await input({ message: "Username:" });
  const passwd = await password({ message: "Password:" });

  // Add them as an object in the plaintext
  let vault = JSON.parse(sodium.to_string(bytestext));
  vault.push({website: site, username: name, password: passwd });

  EncryptVault(vault, key, salt)  
}

export async function ListUsernames(params) {

  // Opens the vault
  const result = await OpenVault();
  if (!result) return;
  const [bytestext, key, salt] = result;

  const vault = JSON.parse(sodium.to_string(bytestext));
  for (const item of vault) {
    console.log("-----------")
    console.log("Website:" + item.website);
    console.log("Username:" + item.username)
  }


  EncryptVault(vault, key, salt)

  
}

export async function FindPassword(params) {
  const result = await OpenVault();
  if (!result) return;
  const [bytestext, key, salt] = result;
  const vault = JSON.parse(sodium.to_string(bytestext));


  const password = await select({
    message: "Select a username to get its password:",
    choices: vault.map(item => ({
      name: item.username,
      value: item.password,
    })),
  });

  await clipboard.write(password);
  console.log("Password on the clipboard!");
  
  EncryptVault(vault, key, salt)

}