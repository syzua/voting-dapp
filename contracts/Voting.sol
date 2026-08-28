// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Voting {
    address public admin;

    string public votingProject;
    string[] public candidates;
    uint256 public startTime;
    uint256 public endTime;

    mapping(string => bool) public candidateExists;
    mapping(uint256 => uint256) public votes;

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidateId;
    }

    mapping(address => Voter) public voters;
    mapping(string => bool) public registrationCodes;

    string[] public notifications;

    event Voted(address indexed voter, uint256 indexed candidateId);
    event ProjectSet(string project, uint256 startTime, uint256 endTime);
    event CandidateAdded(string candidate);
    event VoterRegistered(address indexed voter);
    event RegistrationCodeGenerated(string code);
    event NotificationSent(string message);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier duringVotingPeriod() {
        require(block.timestamp >= startTime, "Voting has not started yet");
        require(block.timestamp <= endTime, "Voting has already ended");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function setVotingProject(
        string memory _project,
        uint256 _startTime,
        uint256 _endTime
    ) public onlyAdmin {
        require(bytes(_project).length > 0, "Project name cannot be empty");
        require(_endTime > _startTime, "End time must be after start time");
        votingProject = _project;
        startTime = _startTime;
        endTime = _endTime;
        emit ProjectSet(_project, _startTime, _endTime);
    }

    function addCandidate(string memory _candidate) public onlyAdmin {
        require(!candidateExists[_candidate], "Candidate already exists");
        require(bytes(_candidate).length > 0, "Candidate name cannot be empty");

        candidates.push(_candidate);
        candidateExists[_candidate] = true;
        emit CandidateAdded(_candidate);
    }

    function generateRegistrationCode(string memory _code) public onlyAdmin {
        require(bytes(_code).length > 0, "Code cannot be empty");
        require(!registrationCodes[_code], "Code already exists");
        registrationCodes[_code] = true;
        emit RegistrationCodeGenerated(_code);
    }

    function register(string memory _code) public {
        require(!voters[msg.sender].isRegistered, "Already registered");
        require(registrationCodes[_code], "Invalid or used registration code");

        registrationCodes[_code] = false;
        voters[msg.sender] = Voter({
            isRegistered: true,
            hasVoted: false,
            votedCandidateId: 0
        });

        emit VoterRegistered(msg.sender);
    }

    function vote(uint256 _candidateId) public duringVotingPeriod {
        require(msg.sender != admin, "Admin cannot vote");
        require(voters[msg.sender].isRegistered, "You are not registered");
        require(!voters[msg.sender].hasVoted, "You have already voted");
        require(_candidateId < candidates.length, "Invalid candidate ID");

        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedCandidateId = _candidateId;
        votes[_candidateId]++;

        emit Voted(msg.sender, _candidateId);
    }

    function sendNotification(string memory _message) public onlyAdmin {
        require(bytes(_message).length > 0, "Message cannot be empty");
        notifications.push(_message);
        emit NotificationSent(_message);
    }

    function getResults() public view returns (string[] memory, uint256[] memory) {
        uint256[] memory voteCounts = new uint256[](candidates.length);
        for (uint256 i = 0; i < candidates.length; i++) {
            voteCounts[i] = votes[i];
        }
        return (candidates, voteCounts);
    }

    function getVoterInfo(address _voter) public view returns (
        bool registered,
        bool voted,
        uint256 candidateId
    ) {
        Voter storage v = voters[_voter];
        return (v.isRegistered, v.hasVoted, v.votedCandidateId);
    }

    function getCandidateCount() public view returns (uint256) {
        return candidates.length;
    }

    function getNotificationCount() public view returns (uint256) {
        return notifications.length;
    }

    function isAdmin(address _address) public view returns (bool) {
        return _address == admin;
    }

    function isRegistered(address _address) public view returns (bool) {
        return voters[_address].isRegistered;
    }

    function hasVoted(address _address) public view returns (bool) {
        return voters[_address].hasVoted;
    }

    function isRegistrationCodeValid(string memory _code) public view returns (bool) {
        return registrationCodes[_code];
    }
}