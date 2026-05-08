// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Voting {

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
        bool active;
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
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0, true);
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
    // Code chỉ đưa voteCount của ứng viên về 0, nhưng mapping voters[address] vẫn là true. => Sau khi reset thì các phiếu trước đó ko dc vote lại
    for (uint i = 1; i <= voterList.length; i++){
        voters[voterList[i]] = false;
    }
    delete voterList;
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
        require(candidates[_candidateId].active, "Ung cu vien da bi xoa!");
        voters[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        voterList.push(msg.sender);
        emit VotedEvent(_candidateId);
    }

    // Helper: get all candidates at once for Frontend
    // Dù ứng viên đã bị remove, frontend vẫn nhận về ứng viên đó với tên rỗng
    // Thêm active để frontend chỉ hiển thị ứng viên có active = true
    function getAllCandidates() public view returns (
        uint[] memory ids,
        string[] memory names,
        uint[] memory voteCounts,
        bool[] memory actives
    ) {
        ids = new uint[](candidatesCount);
        names = new string[](candidatesCount);
        voteCounts = new uint[](candidatesCount);
        actives = new bool[](candidatesCount);
        for (uint i = 1; i <= candidatesCount; i++) {
            ids[i - 1] = candidates[i].id;
            names[i - 1] = candidates[i].name;
            voteCounts[i - 1] = candidates[i].voteCount;
            actives[i - 1] = candidates[i].active;
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
    // Chưa xoá hoàn toán ứng viên khỏi mapping
    function removeCandidate(uint _candidateId) public onlyOwner {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "ID khong hop le");
        require(candidates[_candidateId].active, "Ung cu vien da bi xoa");
        // Xóa thông tin ứng cử viên
        candidates[_candidateId].name = "";
        candidates[_candidateId].voteCount = 0;
        candidates[_candidateId].active = false;
        emit CandidateRemoved(_candidateId);
    }

    // Reset quyền vote cho một địa chỉ ví cụ thể
    // Vấn đề: nếu reset voter, địa chỉ đó vẫn còn trong voterList.
    // Sau đó nếu người đó vote lại, voterList.push(msg.sender) sẽ thêm địa chỉ đó lần nữa.
    // Kết quả: getTotalVoters() có thể bị sai vì một địa chỉ có thể xuất hiện nhiều lần.
    function resetVoter(address _voter) public onlyOwner {
        require(voters[_voter], "Nguoi nay chua bo phieu!");
        voters[_voter] = false;
        // Xoá địa chỉ voter khỏi voterList
        // Cách này ko làm cho tên voter theo đúng thự tự nhưng sẽ tiết kiệm gas hơn chạy 2 vòng for
        for (uint i = 0; i < voterList.length; i++){
            if (voterList[i] == _voter) {
                voterList[i] = voterList[voterList.length - 1];
                voterList.pop();
                break;
            }
        }
        emit VoterReset(_voter);
    }
}
