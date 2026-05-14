// 1. Thay bằng địa chỉ Contract của bạn sau khi deploy (npx hardhat run scripts/deploy.js --network localhost)
const CONTRACT_ADDRESS = "0xE47A68ca6a905e6B6191190538461112bC7683F9";
const SEPOLIA_CHAIN_ID = "0xaa36a7";
// 2. ABI cơ bản để gọi hàm
const CONTRACT_ABI = [
    "function getAllCandidates() public view returns (uint[], string[], uint[], bool[])",
    "function vote(uint _candidateId) public",
    "function owner() public view returns (address)",
    "function addCandidatePublic(string memory _name) public",
    "function removeCandidate(uint _candidateId) public",

    "function votingOpen() public view returns (bool)",
    "function startTime() public view returns (uint256)",
    "function endTime() public view returns (uint256)",
    "function setVotingTime(uint256 _startTime, uint256 _endTime) public",
    "function isVotingOpen() public view returns (bool)",
    "function toggleVoting(bool _status) public",

    "event VotedEvent(address indexed voter, uint indexed _candidateId, uint round)",
    "event VotingToggled(bool status)",
    "event VotingTimeUpdated(uint256 startTime, uint256 endTime)",
    "event CandidateAdded(uint indexed id, string name)",
    "event CandidateRemoved(uint indexed id)"
];

let provider;
let signer;
let contract;
let currentAccount = null;

// Hàm kiểm tra và khởi tạo kết nối (Gọi ở mọi trang)
const CONTRACT_ADDRESS = "0xE47A68ca6a905e6B6191190538461112bC7683F9";
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 ở dạng hex

async function initWeb3() {
    if (typeof window.ethereum === 'undefined') {
        alert("Vui lòng cài đặt MetaMask!");
        return false;
    }

    try {
        // 1. Xin quyền truy cập account
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length === 0) return false;

        // 2. ✅ Kiểm tra đúng network Sepolia chưa
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });

        if (chainId !== SEPOLIA_CHAIN_ID) {
            try {
                // Tự động yêu cầu switch sang Sepolia
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: SEPOLIA_CHAIN_ID }],
                });
            } catch (switchError) {
                // Nếu ví chưa có Sepolia thì tự thêm vào
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: SEPOLIA_CHAIN_ID,
                            chainName: 'Sepolia Testnet',
                            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                            rpcUrls: ['https://rpc.sepolia.org'],
                            blockExplorerUrls: ['https://sepolia.etherscan.io']
                        }]
                    });
                } else {
                    alert("Vui lòng chuyển sang mạng Sepolia trong MetaMask!");
                    return false;
                }
            }
        }

        // 3. Khởi tạo sau khi đã đúng network
        currentAccount = accounts[0];

        const walletDOM = document.getElementById('walletAddressDOM');
        if (walletDOM) {
            walletDOM.innerText = currentAccount.substring(0, 6) + '...' + currentAccount.substring(38);
        }

        const connectBtn = document.getElementById('connectWalletBtnDOM');
        if (connectBtn) connectBtn.style.display = 'none';

        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        return true;

    } catch (error) {
        console.error("Lỗi kết nối ví:", error);
        return false;
    }
}
// Gắn sự kiện click cho nút Connect Wallet (nếu nó tồn tại trên trang)
document.addEventListener("DOMContentLoaded", () => {
    const connectBtn = document.getElementById('connectWalletBtnDOM');
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    // Kết nối thành công thì load lại trang để chạy hàm initWeb3()
                    window.location.reload(); 
                } catch (error) {
                    console.error("Lỗi kết nối:", error);
                }
            } else {
                alert("Vui lòng cài đặt ví MetaMask!");
            }
        });
    }
});
if (window.ethereum) {
    window.ethereum.on("chainChanged", () => {
        window.location.reload();
    });

    window.ethereum.on("accountsChanged", () => {
        window.location.reload();
    });
}
