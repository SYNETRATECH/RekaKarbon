// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title Emission Report Registry
/// @notice Registry untuk menyimpan laporan emisi tahunan perusahaan secara on-chain menggunakan Merkle Root
contract EmissionReportRegistry is AccessControl {
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");

    enum ReportStatus { DRAFT, SUBMITTED, APPROVED, REJECTED }
    enum PtbaeAnchorType { APPLICATION_SUBMISSION, AUDIT_DECISION, MINISTRY_DECISION, REVOCATION }

    struct EmissionReport {
        address reporter;
        uint256 year;
        bytes32 merkleRoot;
        ReportStatus status;
        string auditorNotes;
        uint256 submissionTime;
        uint8 revisionCount;
    }

    uint256 private _nextReportId = 1;
    mapping(uint256 => EmissionReport) public reports;
    mapping(address => mapping(uint256 => uint256)) public latestReportIdByYear; // reporter => year => reportId

    struct PtbaeApplicationAnchor {
        bytes32 applicationId;
        uint256 version;
        bytes32 merkleRoot;
        PtbaeAnchorType anchorType;
        uint256 anchoredAt;
        address anchoredBy;
    }

    mapping(bytes32 => mapping(uint256 => PtbaeApplicationAnchor)) public ptbaeAnchors;

    uint8 public constant MAX_REVISIONS = 3;

    event ReportSubmitted(uint256 indexed reportId, address indexed reporter, bytes32 merkleRoot, uint256 year, uint8 revision);
    event ReportAudited(uint256 indexed reportId, ReportStatus status, string notes);
    event PtbaeApplicationAnchored(
        bytes32 indexed applicationId,
        uint256 indexed version,
        bytes32 merkleRoot,
        PtbaeAnchorType anchorType,
        address indexed anchoredBy
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender); // Biasanya AI dMRV service atau KLHK
        _grantRole(REPORTER_ROLE, msg.sender); // Backend dapat mewakili emitter terautentikasi
    }

    /// @notice Submit laporan emisi dengan menyimpan Merkle Root data
    function submitReport(uint256 year, bytes32 merkleRoot) public returns (uint256) {
        return _submitReport(msg.sender, year, merkleRoot);
    }

    /// @notice Submit laporan atas nama emitter yang sudah diverifikasi oleh backend
    function submitReportFor(
        address reporter,
        uint256 year,
        bytes32 merkleRoot
    ) external onlyRole(REPORTER_ROLE) returns (uint256) {
        require(reporter != address(0), "Reporter is required");
        return _submitReport(reporter, year, merkleRoot);
    }

    function _submitReport(
        address reporter,
        uint256 year,
        bytes32 merkleRoot
    ) internal returns (uint256) {
        uint256 existingReportId = latestReportIdByYear[reporter][year];
        uint8 revision = 0;

        if (existingReportId != 0) {
            EmissionReport storage existing = reports[existingReportId];
            require(existing.status == ReportStatus.REJECTED || existing.status == ReportStatus.DRAFT, "Report already approved or pending");
            require(existing.revisionCount < MAX_REVISIONS, "Max revisions reached");
            revision = existing.revisionCount + 1;
        }

        uint256 newReportId = _nextReportId++;
        
        reports[newReportId] = EmissionReport({
            reporter: reporter,
            year: year,
            merkleRoot: merkleRoot,
            status: ReportStatus.SUBMITTED,
            auditorNotes: "",
            submissionTime: block.timestamp,
            revisionCount: revision
        });

        latestReportIdByYear[reporter][year] = newReportId;

        emit ReportSubmitted(newReportId, reporter, merkleRoot, year, revision);
        return newReportId;
    }

    /// @notice Auditor menyetujui atau menolak laporan
    function auditReport(uint256 reportId, ReportStatus status, string calldata notes) public onlyRole(AUDITOR_ROLE) {
        require(status == ReportStatus.APPROVED || status == ReportStatus.REJECTED, "Invalid audit status");
        EmissionReport storage r = reports[reportId];
        require(r.reporter != address(0), "Report not found");
        require(r.status == ReportStatus.SUBMITTED, "Report not submitted");

        r.status = status;
        r.auditorNotes = notes;

        emit ReportAudited(reportId, status, notes);
    }

    /// @notice Memeriksa kecocokan merkle root untuk laporan tertentu
    function verifyMerkleRoot(uint256 reportId, bytes32 providedRoot) public view returns (bool) {
        EmissionReport storage r = reports[reportId];
        require(r.reporter != address(0), "Report not found");
        return r.merkleRoot == providedRoot;
    }

    /// @notice Menghitung sisa revisi untuk reporter di tahun tertentu
    function remainingRevisions(address reporter, uint256 year) public view returns (uint8) {
        uint256 reportId = latestReportIdByYear[reporter][year];
        if (reportId == 0) return MAX_REVISIONS;
        return MAX_REVISIONS - reports[reportId].revisionCount;
    }

    /// @notice Mencatat fingerprint versi pengajuan PTBAE-PU tanpa menyimpan data mentah.
    function anchorPtbaeApplication(
        bytes32 applicationId,
        uint256 version,
        bytes32 merkleRoot,
        PtbaeAnchorType anchorType
    ) external onlyRole(AUDITOR_ROLE) {
        require(applicationId != bytes32(0), "Application ID is required");
        require(version > 0, "Application version is required");
        require(merkleRoot != bytes32(0), "Merkle root is required");
        require(ptbaeAnchors[applicationId][version].anchoredAt == 0, "PTBAE version already anchored");

        ptbaeAnchors[applicationId][version] = PtbaeApplicationAnchor({
            applicationId: applicationId,
            version: version,
            merkleRoot: merkleRoot,
            anchorType: anchorType,
            anchoredAt: block.timestamp,
            anchoredBy: msg.sender
        });

        emit PtbaeApplicationAnchored(
            applicationId,
            version,
            merkleRoot,
            anchorType,
            msg.sender
        );
    }

    /// @notice Memverifikasi fingerprint versi pengajuan PTBAE-PU.
    function verifyPtbaeApplicationAnchor(
        bytes32 applicationId,
        uint256 version,
        bytes32 merkleRoot
    ) external view returns (bool) {
        PtbaeApplicationAnchor storage anchor = ptbaeAnchors[applicationId][version];
        return anchor.anchoredAt != 0 && anchor.merkleRoot == merkleRoot;
    }
}
