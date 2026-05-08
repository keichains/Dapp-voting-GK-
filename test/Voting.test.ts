/**
 * test/Voting.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Test suite đầy đủ cho contract Voting.
 *
 * Chạy với Hardhat built-in network (nhanh, không cần Ganache):
 *   npx hardhat test
 *
 * Chạy với Ganache CLI (mô phỏng môi trường thực tế):
 *   npx ganache --port 8545 --chainId 1337 --deterministic
 *   npx hardhat test --network ganacheCli
 *
 * Flags hữu ích:
 *   npx hardhat test --grep "vote"     → chỉ chạy test có chữ "vote"
 *   npx hardhat test --parallel        → chạy song song (nhanh hơn)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import { Voting } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Voting Contract", function () {
  // ── Biến dùng chung cho toàn bộ test ────────────────────────────────────
  let voting: Voting;
  let owner: SignerWithAddress;
  let voter1: SignerWithAddress;
  let voter2: SignerWithAddress;
  let voter3: SignerWithAddress;
  let stranger: SignerWithAddress;

  // ── beforeEach: Deploy lại contract trước mỗi test ──────────────────────
  // Mỗi test chạy trên contract sạch — không ảnh hưởng lẫn nhau.
  beforeEach(async function () {
    [owner, voter1, voter2, voter3, stranger] = await ethers.getSigners();
    voting = await ethers.deployContract("Voting");
    await voting.waitForDeployment();
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  NHÓM 1: KHỞI TẠO (Constructor)
  // ═══════════════════════════════════════════════════════════════════════
  describe("1. Khởi tạo (Constructor)", function () {

    it("1.1 – owner phải là địa chỉ deploy", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("1.2 – votingOpen phải là true ngay sau deploy", async function () {
      expect(await voting.votingOpen()).to.equal(true);
    });

    it("1.3 – phải có đúng 2 ứng cử viên mặc định", async function () {
      expect(await voting.candidatesCount()).to.equal(2n);
    });

    it("1.4 – ứng cử viên #1 phải đúng tên và voteCount = 0", async function () {
      const c1 = await voting.candidates(1);
      expect(c1.id).to.equal(1n);
      expect(c1.name).to.equal("Candidate 1 - Nguyen Van A");
      expect(c1.voteCount).to.equal(0n);
    });

    it("1.5 – ứng cử viên #2 phải đúng tên và voteCount = 0", async function () {
      const c2 = await voting.candidates(2);
      expect(c2.id).to.equal(2n);
      expect(c2.name).to.equal("Candidate 2 - Tran Thi B");
      expect(c2.voteCount).to.equal(0n);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  NHÓM 2: BỎ PHIẾU (vote)
  // ═══════════════════════════════════════════════════════════════════════
  describe("2. Bỏ phiếu (vote)", function () {

    it("2.1 – bỏ phiếu hợp lệ → tăng voteCount", async function () {
      await voting.connect(voter1).vote(1);
      const c1 = await voting.candidates(1);
      expect(c1.voteCount).to.equal(1n);
    });

    it("2.2 – bỏ phiếu hợp lệ → đánh dấu voter đã bỏ phiếu", async function () {
      await voting.connect(voter1).vote(1);
      // Sửa voters thành votedRound, người vote ở vòng 1 sẽ có giá trị là 1n
      expect(await voting.votedRound(voter1.address)).to.equal(1n);
    });

    it("2.3 – bỏ phiếu hợp lệ → emit event VotedEvent đúng candidateId", async function () {
      await expect(voting.connect(voter1).vote(1))
        .to.emit(voting, "VotedEvent")
        // Khớp 3 biến: msg.sender, _candidateId, currentRound
        .withArgs(voter1.address, 1n, 1n); 
    });

    it("2.4 – bỏ phiếu lần 2 → revert 'Ban da bo phieu roi!'", async function () {
      await voting.connect(voter1).vote(1);
      await expect(voting.connect(voter1).vote(1))
        .to.be.revertedWith("Ban da bo phieu roi!");
    });

    it("2.5 – bỏ phiếu ID = 0 → revert 'ID ung cu vien khong hop le!'", async function () {
      await expect(voting.connect(voter1).vote(0))
        .to.be.revertedWith("ID ung cu vien khong hop le!");
    });

    it("2.6 – bỏ phiếu ID vượt quá số ứng cử viên → revert", async function () {
      await expect(voting.connect(voter1).vote(999))
        .to.be.revertedWith("ID ung cu vien khong hop le!");
    });

    it("2.7 – khi votingOpen = false → revert 'Cuoc bau cu da ket thuc!'", async function () {
      await voting.connect(owner).toggleVoting(false);
      await expect(voting.connect(voter1).vote(1))
        .to.be.revertedWith("Cuoc bau cu da ket thuc!");
    });

    it("2.8 – nhiều voter bỏ phiếu độc lập → voteCount cộng dồn đúng", async function () {
      // voter1, voter2 bỏ cho #1; voter3 bỏ cho #2
      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(1);
      await voting.connect(voter3).vote(2);

      const c1 = await voting.candidates(1);
      const c2 = await voting.candidates(2);
      expect(c1.voteCount).to.equal(2n);
      expect(c2.voteCount).to.equal(1n);
    });

    it("2.9 – voter chưa bỏ phiếu → voters[address] = false (mặc định)", async function () {
      // Sửa voters thành votedRound, chưa vote thì bằng 0n
      expect(await voting.votedRound(stranger.address)).to.equal(0n);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  NHÓM 3: QUẢN LÝ TRẠNG THÁI (toggleVoting)
  // ═══════════════════════════════════════════════════════════════════════
  describe("3. Quản lý trạng thái bầu cử (toggleVoting)", function () {

    it("3.1 – owner có thể đóng bầu cử", async function () {
      await voting.connect(owner).toggleVoting(false);
      expect(await voting.votingOpen()).to.equal(false);
    });

    it("3.2 – owner có thể mở lại sau khi đóng", async function () {
      await voting.connect(owner).toggleVoting(false);
      await voting.connect(owner).toggleVoting(true);
      expect(await voting.votingOpen()).to.equal(true);
    });

    it("3.3 – toggleVoting emit event VotingToggled", async function () {
      await expect(voting.connect(owner).toggleVoting(false))
        .to.emit(voting, "VotingToggled")
        .withArgs(false);
    });

    it("3.4 – non-owner gọi toggleVoting → revert onlyOwner", async function () {
      await expect(voting.connect(stranger).toggleVoting(false))
        .to.be.revertedWith("Chi chu hop dong moi co quyen nay");
    });

    it("3.5 – sau khi mở lại, voter vẫn bỏ phiếu được", async function () {
      // Đóng → mở lại → bỏ phiếu
      await voting.connect(owner).toggleVoting(false);
      await voting.connect(owner).toggleVoting(true);
      await expect(voting.connect(voter1).vote(1)).to.not.be.reverted;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  NHÓM 4: THÊM ỨNG CỬ VIÊN (addCandidatePublic)
  // ═══════════════════════════════════════════════════════════════════════
  describe("4. Thêm ứng cử viên (addCandidatePublic)", function () {

    it("4.1 – owner thêm ứng cử viên mới → candidatesCount tăng", async function () {
      await voting.connect(owner).addCandidatePublic("Candidate 3 - Le Van C");
      expect(await voting.candidatesCount()).to.equal(3n);
    });

    it("4.2 – ứng cử viên mới có đúng tên, id, voteCount = 0", async function () {
      await voting.connect(owner).addCandidatePublic("Candidate 3 - Le Van C");
      const c3 = await voting.candidates(3);
      expect(c3.id).to.equal(3n);
      expect(c3.name).to.equal("Candidate 3 - Le Van C");
      expect(c3.voteCount).to.equal(0n);
    });

    it("4.3 – thêm ứng cử viên emit event CandidateAdded", async function () {
      await expect(voting.connect(owner).addCandidatePublic("Candidate 3 - Le Van C"))
        .to.emit(voting, "CandidateAdded")
        .withArgs(3n, "Candidate 3 - Le Van C");
    });

    it("4.4 – non-owner thêm ứng cử viên → revert onlyOwner", async function () {
      await expect(
        voting.connect(stranger).addCandidatePublic("Hacker")
      ).to.be.revertedWith("Chi chu hop dong moi co quyen nay");
    });

    it("4.5 – voter có thể bỏ phiếu cho ứng cử viên vừa thêm", async function () {
      await voting.connect(owner).addCandidatePublic("Candidate 3 - Le Van C");
      await expect(voting.connect(voter1).vote(3)).to.not.be.reverted;
      const c3 = await voting.candidates(3);
      expect(c3.voteCount).to.equal(1n);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  NHÓM 5: HELPER FUNCTION (getAllCandidates)
  // ═══════════════════════════════════════════════════════════════════════
  describe("5. getAllCandidates()", function () {

    it("5.1 – trả về đúng số lượng ứng cử viên", async function () {
      const [ids] = await voting.getAllCandidates();
      expect(ids.length).to.equal(2);
    });

    it("5.2 – ids, names, voteCounts khớp với candidates mapping", async function () {
      const [ids, names, voteCounts] = await voting.getAllCandidates();
      expect(ids[0]).to.equal(1n);
      expect(names[0]).to.equal("Candidate 1 - Nguyen Van A");
      expect(voteCounts[0]).to.equal(0n);
      expect(ids[1]).to.equal(2n);
      expect(names[1]).to.equal("Candidate 2 - Tran Thi B");
    });

    it("5.3 – voteCounts phản ánh đúng sau khi bỏ phiếu", async function () {
      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(1);
      await voting.connect(voter3).vote(2);
      const [, , voteCounts] = await voting.getAllCandidates();
      expect(voteCounts[0]).to.equal(2n);
      expect(voteCounts[1]).to.equal(1n);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  NHÓM 6: KỊCH BẢN ĐẦY ĐỦ (End-to-End Scenario)
  // ═══════════════════════════════════════════════════════════════════════
  describe("6. Kịch bản đầy đủ (E2E)", function () {

    it("6.1 – Toàn bộ luồng: mở → bầu → xem → đóng", async function () {
      // Bước 1: Thêm ứng cử viên thứ 3
      await voting.connect(owner).addCandidatePublic("Candidate 3 - Le Van C");
      expect(await voting.candidatesCount()).to.equal(3n);

      // Bước 2: 3 voter bỏ phiếu
      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(3);
      await voting.connect(voter3).vote(1);

      // Bước 3: Kiểm tra kết quả
      const c1 = await voting.candidates(1);
      const c3 = await voting.candidates(3);
      expect(c1.voteCount).to.equal(2n);
      expect(c3.voteCount).to.equal(1n);

      // Bước 4: Owner đóng bầu cử
      await voting.connect(owner).toggleVoting(false);
      expect(await voting.votingOpen()).to.equal(false);

      // Bước 5: Không ai bỏ phiếu được nữa
      await expect(voting.connect(stranger).vote(2))
        .to.be.revertedWith("Cuoc bau cu da ket thuc!");
    });
  });
});
