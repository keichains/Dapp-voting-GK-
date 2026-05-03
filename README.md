# Voting DApp — Hướng dẫn từng bước

> Hardhat · Ganache · MetaMask · ethers.js v6

---

## Cấu trúc dự án

```
voting-project/
├── contracts/
│   └── Voting.sol              ← Smart contract chính
├── scripts/
│   ├── deploy.ts               ← Deploy lên Ganache
│   └── interact.ts             ← Tương tác thủ công sau deploy
├── test/
│   └── Voting.test.ts          ← 20+ test cases đầy đủ
├── frontend/
│   ├── index.html              ← Web UI kết nối MetaMask
│   └── deployment-info.json    ← Tự sinh sau khi deploy
├── hardhat.config.ts
└── package.json
```

---

## BƯỚC 1 — Cài đặt

```bash
# 1. Tạo thư mục và vào trong
mkdir voting-project && cd voting-project

# 2. Cài dependencies
npm install

# 3. Compile contract
npx hardhat compile
```

---

## BƯỚC 2 — Cài & Cấu hình Ganache

### Cách A: Ganache Desktop (GUI) — khuyến nghị cho người mới

1. Tải tại https://trufflesuite.com/ganache/
2. Mở Ganache → **New Workspace** → Ethereum
3. Đặt tên workspace, chọn port **7545**, Chain ID **1337**
4. Click **Save Workspace**
5. Copy **Private Key** của Account #0 (click biểu tượng chìa khoá)

Điền vào `hardhat.config.ts`:
```typescript
ganache: {
  url: "http://127.0.0.1:7545",
  chainId: 1337,
  accounts: ["0xDAN_PRIVATE_KEY_ACCOUNT_0_TU_GANACHE"]
}
```

### Cách B: Ganache CLI

```bash
# Cài global
npm install -g ganache

# Chạy với seed cố định (--deterministic → địa chỉ giống nhau mỗi lần)
npx ganache --port 8545 --chainId 1337 --deterministic

# Terminal sẽ in ra 10 tài khoản + private keys
# Copy private key account[0] vào hardhat.config.ts → ganacheCli.accounts
```

---

## BƯỚC 3 — Deploy lên Ganache

```bash
# Deploy lên Ganache Desktop (port 7545)
npx hardhat run scripts/deploy.ts --network ganache

# Hoặc Ganache CLI (port 8545)
npx hardhat run scripts/deploy.ts --network ganacheCli
```

Output mẫu:
```
════════════════════════════════════════════════════════════
  DEPLOY: Voting Contract
  Network : ganache
════════════════════════════════════════════════════════════

  Deployer : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  Balance  : 100.0 ETH

  Đang deploy...

  ✔ Contract deployed tại: 0x5FbDB2315678afecb367f032d93F642f64180aa3

  ── Trạng thái ban đầu ──────────────────────────
  owner          : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  votingOpen     : true
  candidatesCount: 2
  candidate[1]  : Candidate 1 - Nguyen Van A (votes: 0)
  candidate[2]  : Candidate 2 - Tran Thi B (votes: 0)

  ✔ Đã lưu deployment-info.json → frontend/deployment-info.json
```

**Copy địa chỉ contract** (ví dụ: `0x5FbDB2315678afecb367f032d93F642f64180aa3`)

---

## BƯỚC 4 — Chạy Test

### Test với Hardhat built-in network (không cần Ganache, nhanh nhất)

```bash
npx hardhat test
```

Output mẫu:
```
  Voting Contract

  1. Khởi tạo (Constructor)
    ✔ 1.1 – owner phải là địa chỉ deploy (45ms)
    ✔ 1.2 – votingOpen phải là true ngay sau deploy
    ✔ 1.3 – phải có đúng 2 ứng cử viên mặc định
    ✔ 1.4 – ứng cử viên #1 phải đúng tên và voteCount = 0
    ✔ 1.5 – ứng cử viên #2 phải đúng tên và voteCount = 0

  2. Bỏ phiếu (vote)
    ✔ 2.1 – bỏ phiếu hợp lệ → tăng voteCount
    ✔ 2.2 – bỏ phiếu hợp lệ → đánh dấu voter đã bỏ phiếu
    ✔ 2.3 – bỏ phiếu hợp lệ → emit event VotedEvent đúng candidateId
    ✔ 2.4 – bỏ phiếu lần 2 → revert 'Ban da bo phieu roi!'
    ✔ 2.5 – bỏ phiếu ID = 0 → revert 'ID ung cu vien khong hop le!'
    ✔ 2.6 – bỏ phiếu ID vượt quá số ứng cử viên → revert
    ✔ 2.7 – khi votingOpen = false → revert 'Cuoc bau cu da ket thuc!'
    ✔ 2.8 – nhiều voter bỏ phiếu độc lập → voteCount cộng dồn đúng
    ✔ 2.9 – voter chưa bỏ phiếu → voters[address] = false (mặc định)

  ... (20 tests total)

  20 passing (2s)
```

### Test với Ganache (mô phỏng môi trường thực)

```bash
# Đảm bảo Ganache đang chạy
npx hardhat test --network ganacheCli

# Chỉ chạy một nhóm test cụ thể
npx hardhat test --grep "vote"
npx hardhat test --grep "Admin"

# Coverage report
npx hardhat coverage
```

---

## BƯỚC 5 — Tương tác thủ công (Interact Script)

```bash
# Sửa CONTRACT_ADDRESS trong scripts/interact.ts trước
# Thay: const CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS";
# Thành địa chỉ thực từ Bước 3

npx hardhat run scripts/interact.ts --network ganache
```

Output mẫu:
```
[1] Trạng thái ban đầu:
  votingOpen     : true
  candidatesCount: 2
  [1] Candidate 1 - Nguyen Van A     | votes: 0
  [2] Candidate 2 - Tran Thi B       | votes: 0

[2] Owner thêm ứng cử viên thứ 3...
  ✔ Đã thêm: Candidate 3 - Le Van C

[3] 0x70997970... bỏ phiếu cho ứng cử viên #1...
  ✔ Bỏ phiếu thành công

[5] Voter 1 thử bỏ phiếu lại (phải bị revert)...
  ✔ Revert đúng: Ban da bo phieu roi!

[8] Kết quả cuối cùng:
  votingOpen     : false
  [1] Candidate 1 - Nguyen Van A     | votes: 2 ██
  [2] Candidate 2 - Tran Thi B       | votes: 1 █
  [3] Le Van C                       | votes: 0
```

---

## BƯỚC 6 — Cấu hình MetaMask kết nối Ganache

### Thêm mạng Ganache vào MetaMask

1. Mở MetaMask → **Settings** → **Networks** → **Add a network manually**
2. Điền thông tin:

| Trường | Giá trị |
|--------|---------|
| Network Name | Ganache Local |
| New RPC URL | http://127.0.0.1:7545 (hoặc 8545 với CLI) |
| Chain ID | 1337 |
| Currency Symbol | ETH |

3. Click **Save** → **Switch to Ganache Local**

### Import tài khoản Ganache vào MetaMask

1. Trong MetaMask → Click avatar → **Import account**
2. Chọn **Private Key**
3. Paste private key từ Ganache (Account #0 để test với owner, Account #1-#4 để test voter)
4. Click **Import**

> Mỗi tài khoản Ganache có sẵn 100 ETH test — đủ để test nhiều lần.

---

## BƯỚC 7 — Chạy Web UI

### Cập nhật địa chỉ contract trong frontend/index.html

```javascript
// Dòng 268 trong frontend/index.html
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // ← địa chỉ thực
```

### Mở UI

```bash
# Cách đơn giản nhất: dùng live-server
npm install -g live-server
live-server frontend/

# Hoặc dùng Python
python3 -m http.server 3000 --directory frontend/

# Hoặc VS Code: chuột phải index.html → Open with Live Server
```

Truy cập: http://localhost:3000

### Luồng sử dụng UI

1. Mở MetaMask → chuyển sang mạng **Ganache Local**
2. Click **Kết nối MetaMask** → Approve trong MetaMask popup
3. Xem danh sách ứng cử viên và số phiếu hiện tại
4. Click vào card ứng cử viên muốn bầu → Click **Bỏ phiếu**
5. MetaMask hiện popup confirm transaction → Click **Confirm**
6. Chờ transaction được mine (~1-3s trên Ganache) → Xem kết quả cập nhật

### Tính năng Admin Panel

Nếu kết nối bằng tài khoản **owner** (Account #0), sẽ thấy Admin Panel:
- **Thêm ứng cử viên**: nhập tên → Click "+ Thêm"
- **Đóng/Mở bầu cử**: Click "Đóng bầu cử" hoặc "Mở bầu cử"

---

## Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| `could not detect network` | Ganache chưa chạy | Khởi động Ganache trước khi chạy lệnh |
| `invalid private key` | Private key sai format | Thêm `0x` phía trước trong hardhat.config.ts |
| `nonce too high` | Reset Ganache mà không reset MetaMask | MetaMask → Settings → Advanced → Reset Account |
| `Internal JSON-RPC error` | CONTRACT_ADDRESS sai | Copy lại địa chỉ từ output deploy |
| MetaMask không hiện | Chưa cài extension | Cài MetaMask tại metamask.io |
| `CORS error` khi fetch | Mở file:// trực tiếp | Dùng live-server hoặc http.server |
