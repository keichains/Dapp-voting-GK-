/**
 * scripts/interact.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Minh hoạ cách tương tác với contract đã deploy: bỏ phiếu, thêm ứng cử viên,
 * đóng/mở bầu cử — dùng để test thủ công trên Ganache.
 *
 * Chạy:
 *   npx hardhat run scripts/interact.ts --network ganache
 *
 * Sửa CONTRACT_ADDRESS bên dưới thành địa chỉ in ra sau khi deploy.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ethers } from "hardhat";

// !! Thay bằng địa chỉ thực sau khi deploy
const CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS";

async function main() {
  const signers = await ethers.getSigners();
  const owner   = signers[0]; // tài khoản deploy = owner
  const voter1  = signers[1]; // tài khoản bỏ phiếu thứ nhất
  const voter2  = signers[2]; // tài khoản bỏ phiếu thứ hai

  // Attach vào contract đã deploy
  const Voting = await ethers.getContractFactory("Voting");
  const voting = Voting.attach(CONTRACT_ADDRESS);

  console.log("═".repeat(60));
  console.log("  INTERACT: Voting Contract");
  console.log(`  Address : ${CONTRACT_ADDRESS}`);
  console.log("═".repeat(60));

  // ── Đọc trạng thái ban đầu ─────────────────────────────────────────────────
  console.log("\n[1] Trạng thái ban đầu:");
  await printStatus(voting as any);

  // ── Owner thêm ứng cử viên mới ─────────────────────────────────────────────
  console.log("\n[2] Owner thêm ứng cử viên thứ 3...");
  const tx1 = await (voting.connect(owner) as any).addCandidatePublic("Candidate 3 - Le Van C");
  await tx1.wait();
  console.log("  ✔ Đã thêm: Candidate 3 - Le Van C");

  // ── Voter 1 bỏ phiếu cho ứng cử viên #1 ───────────────────────────────────
  console.log(`\n[3] ${voter1.address} bỏ phiếu cho ứng cử viên #1...`);
  const tx2 = await (voting.connect(voter1) as any).vote(1);
  await tx2.wait();
  console.log("  ✔ Bỏ phiếu thành công");

  // ── Voter 2 bỏ phiếu cho ứng cử viên #2 ───────────────────────────────────
  console.log(`\n[4] ${voter2.address} bỏ phiếu cho ứng cử viên #2...`);
  const tx3 = await (voting.connect(voter2) as any).vote(2);
  await tx3.wait();
  console.log("  ✔ Bỏ phiếu thành công");

  // ── Thử bỏ phiếu lại (expect revert) ──────────────────────────────────────
  console.log("\n[5] Voter 1 thử bỏ phiếu lại (phải bị revert)...");
  try {
    await (voting.connect(voter1) as any).vote(1);
    console.log("  ✗ KHÔNG được! Đây là lỗi logic.");
  } catch (e: any) {
    console.log("  ✔ Revert đúng:", e.reason || e.message);
  }

  // ── Owner đóng bầu cử ──────────────────────────────────────────────────────
  console.log("\n[6] Owner đóng bầu cử...");
  const tx4 = await (voting.connect(owner) as any).toggleVoting(false);
  await tx4.wait();
  console.log("  ✔ Đã đóng (votingOpen = false)");

  // ── Voter 3 thử bỏ phiếu khi đã đóng ─────────────────────────────────────
  const voter3 = signers[3];
  console.log("\n[7] Voter 3 thử bỏ phiếu khi cuộc bầu cử đã đóng...");
  try {
    await (voting.connect(voter3) as any).vote(1);
    console.log("  ✗ KHÔNG được! Đây là lỗi logic.");
  } catch (e: any) {
    console.log("  ✔ Revert đúng:", e.reason || e.message);
  }

  // ── Kết quả cuối cùng ──────────────────────────────────────────────────────
  console.log("\n[8] Kết quả cuối cùng:");
  await printStatus(voting as any);

  console.log("\n" + "═".repeat(60));
}

async function printStatus(voting: any) {
  const count = await voting.candidatesCount();
  const open  = await voting.votingOpen();
  console.log(`  votingOpen     : ${open}`);
  console.log(`  candidatesCount: ${count}`);
  for (let i = 1; i <= Number(count); i++) {
    const c = await voting.candidates(i);
    const bar = "█".repeat(Number(c.voteCount));
    console.log(`  [${i}] ${c.name.padEnd(35)} | votes: ${c.voteCount} ${bar}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
