pragma solidity ^0.8.20;

contract SepoliaFaucet {
    uint256 public constant AMOUNT = 0.001 ether;
    uint256 public constant COOLDOWN = 24 hours;

    mapping(address => uint256) public lastClaimed;

    receive() external payable {}

    function claim() external {
        require(msg.sender != address(0), "ZERO_ADDRESS");
        require(block.timestamp >= lastClaimed[msg.sender] + COOLDOWN, "COOLDOWN_ACTIVE");
        require(address(this).balance >= AMOUNT, "INSUFFICIENT_BALANCE");

        lastClaimed[msg.sender] = block.timestamp;
        (bool sent, ) = msg.sender.call{value: AMOUNT}("");
        require(sent, "TRANSFER_FAILED");
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getLastClaimTime(address user) external view returns (uint256) {
        return lastClaimed[user];
    }
}