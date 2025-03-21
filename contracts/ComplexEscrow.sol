// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ComplexEscrow
 * @notice A production-grade escrow contract for a P2P exchange.
 * Supports multi-party confirmation, dispute resolution, partial fund release,
 * fee deduction, and timeout-based refunds.
 */
contract ComplexEscrow {
    // Participants
    address public buyer;
    address public seller;
    address public arbitrator;

    // Financial parameters
    uint256 public totalAmount;
    uint256 public feePercentage; // in basis points (e.g., 200 = 2%)

    // Timing parameters
    uint256 public createdAt;
    uint256 public disputeTimeout; // in seconds

    // State flags
    bool public buyerConfirmed;
    bool public sellerConfirmed;
    bool public disputeRaised;
    bool public fundsReleased;
    bool public arbitratorDecided;

    // Dispute resolution outcome
    enum Resolution { Pending, RefundBuyer, ReleaseToSeller }
    Resolution public resolution;

    // Events
    event PaymentDeposited(address indexed buyer, uint256 amount, uint256 timestamp);
    event BuyerConfirmed(address indexed buyer, uint256 timestamp);
    event SellerConfirmed(address indexed seller, uint256 timestamp);
    event DisputeRaised(address indexed raisedBy, uint256 timestamp);
    event ArbitratorDecision(address indexed arbitrator, Resolution decision, uint256 timestamp);
    event PartialFundsReleased(address indexed seller, uint256 releasedAmount, uint256 fee, uint256 remainingAmount, uint256 timestamp);
    event FundsReleased(address indexed receiver, uint256 netAmount, uint256 fee, uint256 timestamp);
    event RefundIssued(address indexed buyer, uint256 amount, uint256 timestamp);

    /**
     * @dev Constructor.
     * @param _seller The seller's address.
     * @param _arbitrator The arbitrator's address.
     * @param _feePercentage The fee percentage in basis points.
     * @param _disputeTimeout The dispute timeout period in seconds.
     */
    constructor(
        address _seller,
        address _arbitrator,
        uint256 _feePercentage,
        uint256 _disputeTimeout
    ) payable {
        require(msg.value > 0, "Deposit must be > 0");
        require(_feePercentage < 10000, "Fee must be less than 100% in basis points");

        buyer = msg.sender;
        seller = _seller;
        arbitrator = _arbitrator;
        totalAmount = msg.value;
        feePercentage = _feePercentage;
        createdAt = block.timestamp;
        disputeTimeout = _disputeTimeout;

        buyerConfirmed = false;
        sellerConfirmed = false;
        disputeRaised = false;
        fundsReleased = false;
        arbitratorDecided = false;
        resolution = Resolution.Pending;

        emit PaymentDeposited(buyer, totalAmount, createdAt);
    }

    function confirmPayment() external onlyBuyer notReleased {
        require(!disputeRaised, "Dispute already raised");
        buyerConfirmed = true;
        emit BuyerConfirmed(buyer, block.timestamp);
        _tryReleaseFunds();
    }

    function confirmReceipt() external onlySeller notReleased {
        require(!disputeRaised, "Dispute already raised");
        sellerConfirmed = true;
        emit SellerConfirmed(seller, block.timestamp);
        _tryReleaseFunds();
    }

    function _tryReleaseFunds() internal {
        if (buyerConfirmed && sellerConfirmed) {
            fundsReleased = true;
            uint256 fee = (totalAmount * feePercentage) / 10000;
            uint256 netAmount = totalAmount - fee;
            payable(seller).transfer(netAmount);
            emit FundsReleased(seller, netAmount, fee, block.timestamp);
        }
    }

    function raiseDispute() external notReleased {
        require(msg.sender == buyer || msg.sender == seller, "Only buyer or seller can raise dispute");
        disputeRaised = true;
        emit DisputeRaised(msg.sender, block.timestamp);
    }

    function resolveDispute(uint8 decision) external onlyArbitrator notReleased inDispute {
        require(decision == uint8(Resolution.RefundBuyer) || decision == uint8(Resolution.ReleaseToSeller), "Invalid decision");
        arbitratorDecided = true;
        resolution = Resolution(decision);
        emit ArbitratorDecision(arbitrator, resolution, block.timestamp);
        _executeResolution();
    }

    function refundDueToTimeout() external onlyBuyer notReleased {
        require(disputeRaised, "No dispute raised");
        require(block.timestamp >= createdAt + disputeTimeout, "Dispute timeout not reached");
        require(!arbitratorDecided, "Arbitrator decided");
        fundsReleased = true;
        payable(buyer).transfer(totalAmount);
        emit RefundIssued(buyer, totalAmount, block.timestamp);
    }

    function _executeResolution() internal {
        fundsReleased = true;
        if (resolution == Resolution.ReleaseToSeller) {
            uint256 fee = (totalAmount * feePercentage) / 10000;
            uint256 netAmount = totalAmount - fee;
            payable(seller).transfer(netAmount);
            emit FundsReleased(seller, netAmount, fee, block.timestamp);
        } else if (resolution == Resolution.RefundBuyer) {
            payable(buyer).transfer(totalAmount);
            emit RefundIssued(buyer, totalAmount, block.timestamp);
        }
    }

    function releasePartialFunds(uint256 partialAmount) external onlyArbitrator notReleased inDispute {
        require(partialAmount > 0 && partialAmount <= totalAmount, "Invalid partial amount");
        uint256 fee = (partialAmount * feePercentage) / 10000;
        uint256 netAmount = partialAmount - fee;
        totalAmount -= partialAmount;
        payable(seller).transfer(netAmount);
        emit PartialFundsReleased(seller, partialAmount, fee, totalAmount, block.timestamp);
        if (totalAmount == 0) {
            fundsReleased = true;
        }
    }

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer allowed");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller allowed");
        _;
    }

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Only arbitrator allowed");
        _;
    }

    modifier notReleased() {
        require(!fundsReleased, "Funds already released");
        _;
    }

    modifier inDispute() {
        require(disputeRaised, "No dispute raised");
        _;
    }

    fallback() external payable {
        revert("Use designated functions for ETH transfer");
    }
    
    receive() external payable {
        revert("Direct ETH deposits not allowed");
    }
}

