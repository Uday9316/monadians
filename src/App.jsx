import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { useSpring, animated } from 'react-spring';
import reactLogo from './assets/react.svg';
import mainImage from './assets/main.jpg';
import './App.css';
import abi from '../contracts/ABI.json'; // Import the ABI JSON file
import { ToastContainer, toast } from 'react-toastify'; // Import ToastContainer and toast
import 'react-toastify/dist/ReactToastify.css'; // Import the CSS for Toastify

const nativeTokens = {
  1: 'ETH',      // Mainnet
  3: 'ETH',      // Ropsten
  4: 'ETH',      // Rinkeby
  5: 'ETH',      // Goerli
  42: 'ETH',     // Kovan
  20143: 'MON',  // Monad Devnet
  // Add other networks as needed
};

function App() {
  const [count, setCount] = useState(0); // Initialize count to 0
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState(null);
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [celebrate, setCelebrate] = useState(false); // State to trigger celebration

  // Spring animation for smooth scrolling
  const props = useSpring({
    to: { opacity: 1, transform: 'translateY(0)' },
    from: { opacity: 0, transform: 'translateY(50px)' },
    config: { tension: 200, friction: 20 },
  });

  // Abbreviate wallet address for display (e.g., 0x123...abcd)
  const abbreviateAddress = (address) => {
    return `${address.slice(0, 5)}...${address.slice(-4)}`;
  };

  // Fetch total supply when the component mounts
  useEffect(() => {
    const fetchTotalSupply = async () => {
      const web3 = new Web3(window.ethereum);
      const contractAddress = "0x4e91E495E7Bf60d8BE97ccFd74097f24faC3422E"; // Ensure this is your correct contract address
      const contract = new web3.eth.Contract(abi, contractAddress); // Use the imported ABI

      try {
        const totalMinted = await contract.methods.totalSupply().call(); // Use totalSupply to get the total minted count
        setCount(parseInt(totalMinted)); // Update count with the value from the contract
      } catch (error) {
        console.error('Error fetching total supply:', error);
      }
    };

    fetchTotalSupply();
  }, []); // Empty dependency array to run only once on mount

  // Function to handle wallet connection
  const handleConnectWallet = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Get the current network
        const networkId = await web3.eth.net.getId();
        // Set the current network based on the network ID
        setCurrentNetwork(networkId === 20143 ? 'Monad Devnet' : 'MONAD');

        // Detect network change
        window.ethereum.on('chainChanged', async () => {
          const newNetworkId = await web3.eth.net.getId();
          setCurrentNetwork(newNetworkId === 20143 ? 'Monad Devnet' : 'MONAD');
        });

        // Get the connected account
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        setWalletAddress(account);

        // Get wallet balance
        const balance = await web3.eth.getBalance(account);
        setWalletBalance(parseFloat(web3.utils.fromWei(balance, 'ether')).toFixed(2)); // Format balance to 2 decimal places

        // Fetch total supply from the contract
        const contractAddress = "0x4e91E495E7Bf60d8BE97ccFd74097f24faC3422E"; // Ensure this is your correct contract address
        const contract = new web3.eth.Contract(abi, contractAddress); // Use the imported ABI
        const totalMinted = await contract.methods.totalSupply().call(); // Use totalSupply to get the total minted count
        setCount(parseInt(totalMinted)); // Update count with the value from the contract

        setIsConnected(true);
      } catch (error) {
        console.error('Error connecting to wallet:', error);
        alert('Connection failed, please try again.');
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  // Mint NFT function (only allow minting 1 NFT per transaction to the connected wallet)
  const handleMint = async () => {
    if (isMinting) return;
    setIsMinting(true);
    setMintError(null); // Reset any previous error

    try {
      const web3 = new Web3(window.ethereum);
      const contractAddress = "0x4e91E495E7Bf60d8BE97ccFd74097f24faC3422E"; // Ensure this is your correct contract address
      const contract = new web3.eth.Contract(abi, contractAddress); // Use the imported ABI

      const mintRecipient = walletAddress; // Only the connected wallet can mint

      toast.info(`Attempting to mint NFT to ${mintRecipient}`); // Use toast for logging
      const result = await contract.methods.mint(1).send({ from: walletAddress, gas: 300000 }); // Call the mint function with the number of tokens to mint
      toast.success('Mint Successful! 🎉'); // Success notification

      setCount(count + 1); // Update mint count
      setCelebrate(true); // Trigger celebration
    } catch (error) {
      console.error('Minting error:', error);
      toast.error('Failed to mint NFT. Please try again.'); // Error notification
      setMintError('Failed to mint NFT. Please try again.');
    } finally {
      setIsMinting(false); // Reset minting state
    }
  };

  const handleLogOut = () => {
    setIsConnected(false);
    setWalletAddress('');
    setWalletBalance(0);
    setDropdownVisible(false);
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  // Celebration animation
  const celebrationProps = useSpring({
    opacity: celebrate ? 1 : 0,
    transform: celebrate ? 'scale(1.2)' : 'scale(1)',
    config: { tension: 200, friction: 10 },
    onRest: () => {
      if (celebrate) {
        setCelebrate(false); // Reset celebration state after animation
      }
    },
  });

  return (
    <animated.div className="nft-mint-container" style={props}>
      {/* Celebration Element */}
      <animated.div style={celebrationProps} className="celebration">
        🎉 Congratulations! You minted an NFT! 🎉
      </animated.div>

      <div className="floating-background"></div>
      <img src={mainImage} className="main-image" alt="Main NFT" />
      <h1 className="title">Mint Your NFT</h1>

      <div className="wallet-info">
        {!isConnected ? (
          <button className="wallet-button" onClick={handleConnectWallet}>
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-connected">
            <button className="wallet-button" onClick={toggleDropdown}>
              {abbreviateAddress(walletAddress)}
            </button>

            {dropdownVisible && (
              <div className="dropdown">
                <button className="logout-button" onClick={handleLogOut}>
                  Log Out
                </button>
              </div>
            )}

            <div className="wallet-balance">
              <p>Balance: {parseFloat(walletBalance).toFixed(2)} {nativeTokens[currentNetwork] || '$MON'}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mint-counter">
        <p>Mint Count: {count}</p>
      </div>

      {/* Mint Button */}
      <button
        className="mint-button"
        onClick={handleMint}
        disabled={count >= 10000 || isMinting} // Disable if minting is in progress or max mint reached
        style={{ backgroundColor: count >= 10000 ? 'grey' : 'black' }}
      >
        {isMinting ? 'Minting...' : count >= 10000 ? 'Minted Out' : 'Mint NFT'}
      </button>

      {mintError && <p style={{ color: 'red' }}>{mintError}</p>}

      <div className="logos">
        <a href="https://x.com/monadians_xyz" target="_blank" rel="noopener noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <ToastContainer /> {/* Add ToastContainer to render notifications */}
      {/* Move footer text to the bottom */}
      <div className="footer" style={{ position: 'fixed', bottom: 10, width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <span style={{ marginRight: '5px' }}>Made by</span>
          <a href="https://x.com/uday_dhorajiya" target="_blank" rel="noopener noreferrer" style={{ marginRight: '2px' }}>
            <img src="https://pbs.twimg.com/profile_images/1861311127977893891/BS5Anw-Y_400x400.jpg" alt="Profile 1" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />
          </a>
          <a href="https://x.com/puresoul0109" target="_blank" rel="noopener noreferrer" style={{ marginLeft: '2px' }}>
            <img src="https://pbs.twimg.com/profile_images/1868843134219636736/tbHhlxHB_400x400.jpg" alt="Profile 2" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />
          </a>
        </div>
      </div>
    </animated.div>
  );
}

export default App;
