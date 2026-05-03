// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Voting {

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    // Biến lưu danh sách địa chỉ người đã vote
    address[] public voterList;
    address public owner;
    bool public votingOpen;
    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public voters;
    uint public candidatesCount;

    event CandidateRemoved(uint indexed id);
    event VotedEvent(uint indexed _candidateId);
    event VotingToggled(bool status);
    event CandidateAdded(uint indexed id, string name);
    event VoterReset(address indexed voter);
    event AllVotesReset();
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Chi chu hop dong moi co quyen nay");
        _;
    }

    constructor() {
        owner = msg.sender;
        votingOpen = true;
        addCandidate("Candidate 1 - Nguyen Van A");
        addCandidate("Candidate 2 - Tran Thi B");
    }

    function addCandidate(string memory _name) private {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit CandidateAdded(candidatesCount, _name);
    }

    function toggleVoting(bool _status) public onlyOwner {
        votingOpen = _status;
        emit VotingToggled(_status);
    }

    // Owner xoá toàn bộ phiếu và reset về 0
function resetAllVotes() public onlyOwner {
    for (uint i = 1; i <= candidatesCount; i++) {
        candidates[i].voteCount = 0;
    }
    emit AllVotesReset();
    }

    function addCandidatePublic(string memory _name) public onlyOwner {
        addCandidate(_name);
    }

    function vote(uint _candidateId) public {
        require(votingOpen, "Cuoc bau cu da ket thuc!");
        require(!voters[msg.sender], "Ban da bo phieu roi!");
        require(
            _candidateId > 0 && _candidateId <= candidatesCount,
            "ID ung cu vien khong hop le!"
        );
        voters[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        voterList.push(msg.sender);
        emit VotedEvent(_candidateId);
    }

    // Helper: get all candidates at once for Frontend
    function getAllCandidates() public view returns (
        uint[] memory ids,
        string[] memory names,
        uint[] memory voteCounts
    ) {
        ids = new uint[](candidatesCount);
        names = new string[](candidatesCount);
        voteCounts = new uint[](candidatesCount);
        for (uint i = 1; i <= candidatesCount; i++) {
            ids[i - 1] = candidates[i].id;
            names[i - 1] = candidates[i].name;
            voteCounts[i - 1] = candidates[i].voteCount;
        }
    }
    // Lấy tổng số lượng cử tri đã tham gia
    function getTotalVoters() public view returns (uint256) {
        return voterList.length;
    }

    // Lấy danh sách địa chỉ cử tri
    function getVoterList() public view returns (address[] memory) {
        return voterList;
    }

    // Xóa ứng cử viên (Đặt lại thông tin về rỗng và 0)
    function removeCandidate(uint _candidateId) public onlyOwner {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "ID khong hop le");
        
        // Xóa thông tin ứng cử viên
        candidates[_candidateId].name = "";
        candidates[_candidateId].voteCount = 0;
        
        emit CandidateRemoved(_candidateId);
    }

    // Reset quyền vote cho một địa chỉ ví cụ thể
    function resetVoter(address _voter) public onlyOwner {
        require(voters[_voter], "Nguoi nay chua bo phieu!");
        voters[_voter] = false;
        
        emit VoterReset(_voter);
    }
}
