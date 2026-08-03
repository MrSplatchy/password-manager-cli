export async function CreateNewServer() {
  const response = await password({
    message: "Create a Master Password",
    mask: true,
  });
  sodium.ready;
  ipc.config.id = "vault";
  ipc.serve(() => {
    ipc.server.on("encrypt", (data) => {
      ipc.log(data);
      derived_key = sodium.crypto_pwhash_str(
        sodium.crypto_pwhash_PASSWD_MIN,
        data,
        sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES),
        sodium.crypto_pwhash_OPSLIMIT_MODERATE,
        sodium.crypto_pwhash_MEMLIMIT_MODERATE,
        sodium.crypto_pwhash_ALG_DEFAULT,
      );
    });
  });
}
