import ipc from "@node-ipc/node-ipc";
import { password  } from '@inquirer/prompts';
import sodium from "libsodium-wrappers-sumo";
import envPaths from "env-paths";
import fs from "fs"

export async function CreateNewServer() {
    const response = await password ({ 
        message: 'Create a Master Password',
        mask: true
    })
    sodium.ready
    ipc.config.id = "vault"
    ipc.serve(() => {
        ipc.server.on("encrypt", (data) =>{
            ipc.log(data)
            derived_key = sodium.crypto_pwhash_str(
                sodium.crypto_pwhash_PASSWD_MIN,
                data,
                sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES),
                sodium.crypto_pwhash_OPSLIMIT_MODERATE,
                sodium.crypto_pwhash_MEMLIMIT_MODERATE,
                sodium.crypto_pwhash_ALG_DEFAULT
            )
        })
    })
    

}

export async function CreateVault() {
    // Choose password
    const psw = await password ({ 
        message: 'Create a Master Password',
        mask: true
    })
    sodium.ready

    // Create salt & key
    const salt = sodium.randombytes_buf(16)

    const key = sodium.crypto_pwhash(
        sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
        psw,
        salt,
        sodium.crypto_pwhash_OPSLIMIT_MODERATE,
        sodium.crypto_pwhash_MEMLIMIT_MODERATE,
        sodium.crypto_pwhash_ALG_DEFAULT
    )

    // Create nonce
    const nonce = sodium.randombytes_buf(
        sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
    )

    // Create vault
    const plaintext = JSON.stringify({
    entries: []
    });

    const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
        plaintext,
        null,  
        null,      
        nonce,
        key
    );

    // Save as file
    const vault = {
        salt: sodium.to_base64(salt),
        nonce: sodium.to_base64(nonce),
        ciphertext: sodium.to_base64(ciphertext),
    };

    fs.writeFileSync("vault.json", JSON.stringify(vault))


    
}