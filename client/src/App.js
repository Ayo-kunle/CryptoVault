import "./App.css";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import Modal from "./Modal.js";
import logo from "./logo.png";

import cryptoVaultArtifact from "./artifacts/contracts/CryptoVault.sol/CryptoVault.json";
import maticArtifact from "./artifacts/contracts/Matic.sol/Matic.json";
import shibArtifact from "./artifacts/contracts/Shib.sol/Shib.json";
import usdtArtifact from "./artifacts/contracts/Usdt.sol/Usdt.json";
import ayuxArtifact from "./artifacts/contracts/Ayux.sol/Ayux.json";

function App() {
  const [provider, setProvider] = useState(undefined);
  const [signer, setSigner] = useState(undefined);
  const [signerAddress, setSignerAddress] = useState(undefined);
  const [cryptoVaultContract, setCryptoVaultContract] = useState(undefined);
  const [tokenContracts, setTokenContracts] = useState({});
  const [tokenBalances, setTokenBalances] = useState({});
  const [tokenSymbols, setTokenSymbols] = useState([]);

  const [amount, setAmount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(undefined);
  const [isDeposit, setIsDeposit] = useState(true);

  const toBytes32 = (text) => ethers.utils.formatBytes32String(text);
  const toString = (bytes32) => ethers.utils.parseBytes32String(bytes32);
  const toWei = (ether) => ethers.utils.parseEther(ether);
  const toEther = (wei) => ethers.utils.formatEther(wei).toString();
  const toRound = (num) => Number(num).toFixed(2);

  useEffect(() => {
    const init = async () => {
      const provider = await new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      const cryptoVaultContract = await new ethers.Contract(
        "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        cryptoVaultArtifact.abi
      );
      setCryptoVaultContract(cryptoVaultContract);

      cryptoVaultContract
        .connect(provider)
        .getWhitelistedSymbols()
        .then((result) => {
          const symbols = result.map((s) => toString(s));
          setTokenSymbols(symbols);
          getTokenContracts(symbols, cryptoVaultContract, provider);
        });
    };
    init();
  }, []);

  const getTokenContract = async (symbol, cryptoVaultContract, provider) => {
    const address = await cryptoVaultContract
      .connect(provider)
      .getWhitelistedTokenAddress(toBytes32(symbol));
    const abi =
      symbol === "Matic"
        ? maticArtifact.abi
        : symbol === "Shib"
        ? shibArtifact.abi
        : symbol === "Usdt"
        ? usdtArtifact.abi
        : ayuxArtifact.abi;
    const tokenContract = new ethers.Contract(address, abi);
    return tokenContract;
  };

  const getTokenContracts = async (symbols, cryptoVaultContract, provider) => {
    symbols.map(async (symbol) => {
      const contract = await getTokenContract(
        symbol,
        cryptoVaultContract,
        provider
      );
      setTokenContracts((prev) => ({ ...prev, [symbol]: contract }));
    });
  };

  const isConnected = () => signer !== undefined;

  const getSigner = async (provider) => {
    provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();

    signer.getAddress().then((address) => {
      setSignerAddress(address);
    });

    return signer;
  };

  const connect = () => {
    getSigner(provider).then((signer) => {
      setSigner(signer);
      getTokenBalances(signer);
    });
  };

  const getTokenBalance = async (symbol, signer) => {
    const balance = await cryptoVaultContract
      .connect(signer)
      .getTokenBalance(toBytes32(symbol));
    return toEther(balance);
  };

  const getTokenBalances = (signer) => {
    tokenSymbols.map(async (symbol) => {
      const balance = await getTokenBalance(symbol, signer);
      setTokenBalances((prev) => ({ ...prev, [symbol]: balance.toString() }));
    });
  };

  const displayModal = (symbol) => {
    setSelectedSymbol(symbol);
    setShowModal(true);
  };

  const depositTokens = (wei, symbol) => {
    if (symbol === "Eth") {
      signer.sendTransaction({
        to: cryptoVaultContract.address,
        value: wei,
      });
    } else {
      const tokenContract = tokenContracts[symbol];
      tokenContract
        .connect(signer)
        .approve(cryptoVaultContract.address, wei)
        .then(() => {
          cryptoVaultContract
            .connect(signer)
            .depositTokens(wei, toBytes32(symbol));
        });
    }
  };

  const withdrawTokens = (wei, symbol) => {
    if (symbol === "Eth") {
      cryptoVaultContract.connect(signer).withdrawEther(wei);
    } else {
      cryptoVaultContract
        .connect(signer)
        .withdrawTokens(wei, toBytes32(symbol));
    }
  };

  const depositOrWithdraw = (e, symbol) => {
    e.preventDefault();
    const wei = toWei(amount);

    if (isDeposit) {
      depositTokens(wei, symbol);
    } else {
      withdrawTokens(wei, symbol);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        {isConnected() ? (
          <div>
            <h1 className="task">CryptoVault</h1>
            <div>
              <img
                className="logo-app"
                src={logo}
                alt="CryptoVault Logo"
                width="45px"
                height="45px"
              />
            </div>
            <p>Welcome {signerAddress?.substring(0, 10)}...</p>
            <div>
              <div className="list-group">
                <div className="list-group-item">
                  {Object.keys(tokenBalances).map((symbol, idx) => (
                    <div className=" row d-flex py-3" key={idx}>
                      <div className="col-md-3">
                        <div>{symbol.toUpperCase()}</div>
                      </div>

                      <div className="d-flex gap-4 col-md-3">
                        <small className="opacity-50 text-nowrap">
                          {toRound(tokenBalances[symbol])}
                        </small>
                      </div>

                      <div className="d-flex gap-4 col-md-6">
                        <div className="text-center">
                          <button
                            onClick={() => displayModal(symbol)}
                            className="btn btn-primary"
                          >
                            Deposit/Withdraw
                          </button>
                        </div>
                        <Modal
                          show={showModal}
                          onClose={() => setShowModal(false)}
                          symbol={selectedSymbol}
                          depositOrWithdraw={depositOrWithdraw}
                          isDeposit={isDeposit}
                          setIsDeposit={setIsDeposit}
                          setAmount={setAmount}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="vcolor">CryptoVault</h1>
            <div>
              <img
                src={logo}
                alt="CryptoVault Logo"
                width="100px"
                height="100px"
              />
            </div>
            <p className="element">
              Crypto vaults impose deliberate friction on withdrawals to make
              the storage of assets safer. They're great for investors who want
              to store their crypto assets and don't need to withdraw them at
              short notice. There is also the benefit of receiving a
              notification that a withdrawal has been requested.
            </p>
            <p>You are not connected</p>
            <div className="biggy">
              <button
                style={{ width: "200px", height: "50px" }}
                onClick={connect}
                className="btn btn-success"
              >
                Connect Metamask
              </button>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
