/**
 * scripts/deploy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Deploy contract Voting lên Ganache (hoặc bất kỳ network nào trong config).
 *
 * Chạy:
 *   npx hardhat run scripts/deploy.ts --network ganache
 *   npx hardhat run scripts/deploy.ts --network ganacheCli
 *   npx hardhat run scripts/deploy.ts --network hardhat
 *
 * Sau khi chạy xong, sao chép địa chỉ contract in ra console vào frontend/index.html
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  // ── 1. In thông tin môi trường ──────────────────────────────────────────────
  console.log("═".repeat(60));
  console.log("  DEPLOY: Voting Contract");
  console.log(`  Network : ${network.name}`);
  console.log("═".repeat(60));

  // ── 2. Lấy danh sách signer (tài khoản) ────────────────────────────────────
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`\n  Deployer : ${deployer.address}`);
  console.log(`  Balance  : ${ethers.formatEther(balance)} ETH\n`);

  // ── 3. Deploy ───────────────────────────────────────────────────────────────
  console.log("  Đang deploy...");
  const VotingFactory = await ethers.getContractFactory("Voting");
  const voting = await VotingFactory.deploy();

  // Chờ transaction được mine
  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log(`\n  ✔ Contract deployed tại: ${contractAddress}`);

  // ── 4. Kiểm tra nhanh sau deploy ────────────────────────────────────────────
  const owner = await voting.owner();
  const votingOpen = await voting.votingOpen();
  const candidatesCount = await voting.candidatesCount();

  console.log("\n  ── Trạng thái ban đầu ──────────────────────────");
  console.log(`  owner          : ${owner}`);
  console.log(`  votingOpen     : ${votingOpen}`);
  console.log(`  candidatesCount: ${candidatesCount}`);

  // In ra các ứng cử viên ban đầu
  for (let i = 1; i <= Number(candidatesCount); i++) {
    const c = await voting.candidates(i);
    console.log(`  candidate[${i}]  : ${c.name} (votes: ${c.voteCount})`);
  }

  // ── 5. Lưu artifact để Frontend dùng ────────────────────────────────────────
  // Đọc ABI từ artifacts/
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/Voting.sol/Voting.json"
  );

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // Tạo file deployment-info.json cho Frontend load
    const deploymentInfo = {
      network: network.name,
      contractAddress,
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      abi: artifact.abi,
    };

    const outPath = path.join(__dirname, "../frontend/deployment-info.json");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(deploymentInfo, null, 2));

    console.log(`\n  ✔ Đã lưu deployment-info.json → frontend/deployment-info.json`);
  }

  console.log("\n═".repeat(60));
  console.log("  Deploy hoàn tất!");
  console.log("═".repeat(60) + "\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
