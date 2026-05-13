// 1. Thay bằng địa chỉ Contract của bạn sau khi deploy (npx hardhat run scripts/deploy.js --network localhost)
const CONTRACT_ADDRESS = "0xE47A68ca6a905e6B6191190538461112bC7683F9";

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
async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
            currentAccount = accounts[0];
            
            // 1. CẬP NHẬT HIỂN THỊ ĐỊA CHỈ VÍ TRÊN HTML
            const walletDOM = document.getElementById('walletAddressDOM');
            if (walletDOM) {
                // Rút gọn ví thật
                walletDOM.innerText = currentAccount.substring(0, 6) + '...' + currentAccount.substring(38);
            }

            // 2. ẨN NÚT "CONNECT WALLET" ĐI KHI ĐÃ ĐĂNG NHẬP
            const connectBtn = document.getElementById('connectWalletBtnDOM');
            if (connectBtn) {
                connectBtn.style.display = 'none';
            }

            // Khởi tạo Ethers v6
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            
            return true;
        }
    }
    return false;
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