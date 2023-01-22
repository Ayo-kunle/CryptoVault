async function main() {
  [signer1, signer2] = await ethers.getSigners();

  const CryptoVault = await ethers.getContractFactory("CryptoVault", signer1);
  const cryptoVaultContract = await CryptoVault.deploy();

  const Matic = await ethers.getContractFactory("Matic", signer2);
  const matic = await Matic.deploy();
  const Shib = await ethers.getContractFactory("Shib", signer2);
  const shib = await Shib.deploy();
  const Usdt = await ethers.getContractFactory("Usdt", signer2);
  const usdt = await Usdt.deploy();
  const Ayux = await ethers.getContractFactory("Ayux", signer2);
  const ayux = await Ayux.deploy();

  await cryptoVaultContract.whitelistToken(
    ethers.utils.formatBytes32String("Matic"),
    matic.address
  );
  await cryptoVaultContract.whitelistToken(
    ethers.utils.formatBytes32String("Shib"),
    shib.address
  );
  await cryptoVaultContract.whitelistToken(
    ethers.utils.formatBytes32String("Usdt"),
    usdt.address
  );
  await cryptoVaultContract.whitelistToken(
    ethers.utils.formatBytes32String("Ayux"),
    ayux.address
  );
  await cryptoVaultContract.whitelistToken(
    ethers.utils.formatBytes32String("Eth"),
    "0xb86348FCb2118E7Eef7d06f5668434d60d379ad6"
  );

  console.log(
    "CryptoVault deployed to:",
    cryptoVaultContract.address,
    "by",
    signer1.address
  );
  console.log("Matic deployed to:", matic.address, "by", signer2.address);
  console.log("Shib deployed to:", shib.address, "by", signer2.address);
  console.log("Tether deployed to:", usdt.address, "by", signer2.address);
  console.log("Ayux deployed to:", ayux.address, "by", signer2.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
