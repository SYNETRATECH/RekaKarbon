// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

/// @title RekaKarbon Smart Contract
/// @notice Kontrak pintar untuk manajemen tokenisasi karbon (PTBAE-PU dan SPE-GRK) dengan sistem asuransi otomatis.
/// @dev Menggunakan standar ERC1155 dan sistem Role-Based Access Control (RBAC).
contract RekaKarbon is ERC1155, AccessControl, ERC1155Holder {
    /// @notice Role untuk Kementerian LHK sebagai regulator
    bytes32 public constant MINISTRY_ROLE = keccak256("MINISTRY_ROLE");
    /// @notice Role untuk Oracle / Sistem AI sebagai verifikator proyek hijau
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    /// @notice Token ID 0 digunakan sebagai asuransi global (Global Reserve Pool)
    uint256 public constant GLOBAL_RESERVE = 0;

    /// @notice Token ID 1 dialokasikan khusus untuk Jatah Emisi (PTBAE-PU)
    uint256 public constant PTBAE_PU = 1; 

    /// @notice Token ID 3 digunakan untuk Wallet Credit berbasis Rupiah (RKB_CREDIT)
    uint256 public constant RKB_CREDIT = 3;

    /// @notice Role untuk deposit/pembelian bursa
    bytes32 public constant DEPOSIT_ROLE = keccak256("DEPOSIT_ROLE");

    /// @notice Role backend/oracle yang menjalankan settlement bursa setelah
    /// validasi identitas dan status dilakukan di server.
    bytes32 public constant MARKET_OPERATOR_ROLE = keccak256("MARKET_OPERATOR_ROLE");

    /// @notice Token ID untuk SPE-GRK (Offset) dimulai dari angka 4
    uint256 private _nextTokenId = 4; 

    /// @notice Struktur data untuk sertifikat setelah token di-burn
    struct RetirementCertificate {
        address retiree;
        uint256 assetId;
        uint256 amountRetired;
        string certificateNumber;
        bytes32 burnTxHash;
        uint256 retiredAt;
        bool isActive;
    }

    uint256 private _nextCertId = 1;
    mapping(uint256 => RetirementCertificate) public retirementCerts;
    mapping(address => uint256[]) public certsByRetiree;

    enum BursaListingStatus {
        AWAITING_KTH_CONFIRMATION,
        ACTIVE,
        PARTIALLY_FILLED,
        FILLED,
        CANCELLED
    }

    struct BursaListing {
        address seller;
        uint256 assetId;
        uint256 totalAmount;
        uint256 soldAmount;
        uint256 floorPricePerTonIdr;
        uint256 marketPricePerTonIdr;
        bytes32 projectId;
        bytes32 kthGroupId;
        bytes32 projectSnapshotMerkleRoot;
        address kthConfirmedBy;
        uint256 createdAt;
        uint256 priceUpdatedAt;
        BursaListingStatus status;
    }

    uint256 private _nextBursaListingId = 1;
    mapping(uint256 => BursaListing) public bursaListings;
    mapping(uint256 => address) public bursaListingKthRecipients;

    address public platformRecipient;
    address public restorationRecipient;
    address public maintenanceRecipient;
    address public monitoringRecipient;
    address public bufferRecipient;
    address public environmentalIntelligenceRecipient;

    uint256 private constant BASIS_POINTS = 10_000;
    uint256 private constant PLATFORM_BPS = 300;
    uint256 private constant RESTORATION_BPS = 6_014;
    uint256 private constant MAINTENANCE_BPS = 1_455;
    uint256 private constant MONITORING_BPS = 970;
    uint256 private constant BUFFER_BPS = 776;
    uint256 private constant ENVIRONMENTAL_INTELLIGENCE_BPS = 485;

    /// @notice Event ketika pembelian karbon terjadi di Bursa
    event CarbonPurchased(
        address indexed buyer,
        uint256 indexed assetId,
        uint256 amount,
        uint256 totalValueWei,
        uint256 timestamp
    );

    event BursaListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed assetId,
        uint256 amount,
        uint256 floorPricePerTonIdr,
        bytes32 projectId,
        bytes32 kthGroupId,
        bytes32 projectSnapshotMerkleRoot
    );

    event BursaListingKthConfirmed(
        uint256 indexed listingId,
        address indexed kthRepresentative,
        bytes32 projectSnapshotMerkleRoot
    );

    event BursaListingKthRecipientConfigured(
        uint256 indexed listingId,
        address indexed kthRecipient
    );

    event BursaListingActivated(uint256 indexed listingId, uint256 marketPricePerTonIdr);

    event BursaListingPriceUpdated(
        uint256 indexed listingId,
        uint256 previousPricePerTonIdr,
        uint256 newPricePerTonIdr,
        uint256 updatedAt
    );

    event BursaListingCancelled(uint256 indexed listingId, address indexed seller, uint256 returnedAmount);

    event BursaPurchaseSettled(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 assetId,
        uint256 amount,
        uint256 unitPricePerTonIdr,
        uint256 totalCostRkb
    );

    event BursaRevenueAllocated(
        uint256 indexed listingId,
        bytes32 indexed category,
        address indexed recipient,
        uint256 amountRkb
    );

    /// @notice Event ketika sertifikat dikeluarkan paska pembakaran (burn) token
    event RetirementCertificateIssued(
        uint256 indexed certId,
        address indexed retiree,
        uint256 indexed assetId,
        uint256 amount,
        string certificateNumber
    );

    /// @notice Struktur data untuk menyimpan metadata setiap aset karbon
    struct CarbonAsset {
        string assetType;
        address creator;
        string coordinates;
        bool isFrozen;
    }

    /// @notice Pemetaan Token ID ke detail metadata CarbonAsset
    mapping(uint256 => CarbonAsset) public carbonAssets;

    /// @notice Event ketika aset karbon berhasil dibekukan (contoh: hutan terbakar)
    event AssetFrozen(uint256 indexed assetId);
    
    /// @notice Event ketika aset karbon dibuka kembali blokirnya
    event AssetUnfrozen(uint256 indexed assetId);
    
    /// @notice Event ketika korporasi menghanguskan (retire) aset untuk bukti kepatuhan
    event CarbonRetired(address indexed account, uint256 indexed assetId, uint256 amount);
    
    /// @notice Event ketika korban pembekuan menukarkan aset bekunya dengan token asuransi
    event InsuranceClaimed(address indexed account, uint256 indexed frozenAssetId, uint256 amount);

    /// @notice Konstruktor untuk inisialisasi kontrak
    /// @dev Mengatur admin awal dan mencatat metadata aset PTBAE-PU serta GLOBAL_RESERVE
    constructor() ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINISTRY_ROLE, msg.sender); 
        _grantRole(DEPOSIT_ROLE, msg.sender);
        _grantRole(MARKET_OPERATOR_ROLE, msg.sender);

        // Nilai awal aman untuk jaringan lokal. Deployment produksi harus
        // menggantinya melalui setBursaRevenueRecipients().
        platformRecipient = msg.sender;
        restorationRecipient = msg.sender;
        maintenanceRecipient = msg.sender;
        monitoringRecipient = msg.sender;
        bufferRecipient = msg.sender;
        environmentalIntelligenceRecipient = msg.sender;
        
        // Metadata asuransi global
        carbonAssets[GLOBAL_RESERVE] = CarbonAsset({
            assetType: "RESERVE-POOL",
            creator: msg.sender,
            coordinates: "Global",
            isFrozen: false
        });

        // Inisialisasi metadata untuk PTBAE-PU
        carbonAssets[PTBAE_PU] = CarbonAsset({
            assetType: "PTBAE-PU",
            creator: msg.sender,
            coordinates: "National",
            isFrozen: false
        });

        // Inisialisasi metadata untuk RKB_CREDIT
        carbonAssets[RKB_CREDIT] = CarbonAsset({
            assetType: "RKB-CREDIT",
            creator: msg.sender,
            coordinates: "Wallet",
            isFrozen: false
        });
    }

    /// @notice Mencetak token Jatah Emisi (PTBAE-PU) ke alamat tujuan
    /// @param to Alamat penerima jatah emisi
    /// @param amount Jumlah token yang dicetak
    function issueQuota(address to, uint256 amount) public onlyRole(MINISTRY_ROLE) {
        _mint(to, PTBAE_PU, amount, "");
    }

    /// @notice Mencetak RKB_CREDIT untuk pengguna yang deposit fiat
    function mintWalletCredit(address to, uint256 amount) public onlyRole(DEPOSIT_ROLE) {
        _mint(to, RKB_CREDIT, amount, "");
    }

    /// @notice Membakar RKB_CREDIT ketika pengguna membelanjakannya (misal di luar bursa)
    function spendWalletCredit(address from, uint256 amount) public onlyRole(DEPOSIT_ROLE) {
        require(balanceOf(from, RKB_CREDIT) >= amount, "RekaKarbon: Saldo RKB tidak cukup");
        _burn(from, RKB_CREDIT, amount);
    }

    /// @notice AI Verifier mencetak SPE-GRK. 5% otomatis dialokasikan ke Brankas Asuransi (GLOBAL_RESERVE)
    /// @param to Alamat penerima offset (Pengelola Hutan)
    /// @param amount Jumlah total token yang di-generate
    /// @param coordinates Titik koordinat proyek hijau
    /// @return ID token baru untuk SPE-GRK proyek tersebut
    function mintOffsetCredit(
        address to, 
        uint256 amount, 
        string memory coordinates
    ) public onlyRole(ORACLE_ROLE) returns (uint256) {
        uint256 newAssetId = _nextTokenId++;
        
        carbonAssets[newAssetId] = CarbonAsset({
            assetType: "SPE-GRK",
            creator: msg.sender,
            coordinates: coordinates,
            isFrozen: false
        });

        // Mekanisme Potongan Asuransi (Tax) 5%
        uint256 reserveTax = (amount * 5) / 100;
        uint256 creatorAmount = amount - reserveTax;

        // 95% diberikan ke pengelola hutan (to)
        _mint(to, newAssetId, creatorAmount, "");
        
        // 5% dicetak ke Reserve Pool (dalam hal ini disimpan di alamat kontrak / GLOBAL_RESERVE)
        _mint(address(this), GLOBAL_RESERVE, reserveTax, "");
        
        return newAssetId;
    }

    /// @notice Mengklaim asuransi dengan menukarkan aset beku menjadi aset cadangan (Reserve)
    /// @dev Pengguna membakar token bekunya dan kontrak akan mentransfer GLOBAL_RESERVE sejumlah yang sama
    /// @param frozenAssetId ID aset yang sedang dalam status frozen
    /// @param amount Jumlah aset beku yang ingin ditukar
    function swapFrozenAsset(uint256 frozenAssetId, uint256 amount) public {
        require(carbonAssets[frozenAssetId].isFrozen, "RekaKarbon: Aset tidak dibekukan");
        require(balanceOf(msg.sender, frozenAssetId) >= amount, "RekaKarbon: Saldo aset beku tidak cukup");
        require(balanceOf(address(this), GLOBAL_RESERVE) >= amount, "RekaKarbon: Saldo asuransi tidak mencukupi");

        // 1. Bakar aset beku milik pengguna
        _burn(msg.sender, frozenAssetId, amount);

        // 2. Transfer token GLOBAL_RESERVE dari kontrak ke pengguna
        _safeTransferFrom(address(this), msg.sender, GLOBAL_RESERVE, amount, "");

        emit InsuranceClaimed(msg.sender, frozenAssetId, amount);
    }

    /// @notice Mengatur penerima settlement bursa.
    /// @dev Pembagian dana dilakukan di kontrak agar backend tidak dapat
    /// mengubah tujuan dana setelah transaksi disetujui.
    function setBursaRevenueRecipients(
        address platform,
        address restoration,
        address maintenance,
        address monitoring,
        address buffer,
        address environmentalIntelligence
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(platform != address(0), "RekaKarbon: Platform recipient is required");
        require(restoration != address(0), "RekaKarbon: Restoration recipient is required");
        require(maintenance != address(0), "RekaKarbon: Maintenance recipient is required");
        require(monitoring != address(0), "RekaKarbon: Monitoring recipient is required");
        require(buffer != address(0), "RekaKarbon: Buffer recipient is required");
        require(environmentalIntelligence != address(0), "RekaKarbon: Intelligence recipient is required");

        platformRecipient = platform;
        restorationRecipient = restoration;
        maintenanceRecipient = maintenance;
        monitoringRecipient = monitoring;
        bufferRecipient = buffer;
        environmentalIntelligenceRecipient = environmentalIntelligence;
    }

    /// @notice Regulator membuat listing dan langsung mengunci SPE-GRK ke
    /// escrow kontrak. Listing belum aktif sebelum KTH mengonfirmasi snapshot.
    function createBursaListing(
        address seller,
        uint256 assetId,
        uint256 amount,
        uint256 floorPricePerTonIdr,
        bytes32 projectId,
        bytes32 kthGroupId,
        bytes32 projectSnapshotMerkleRoot
    ) external onlyRole(MARKET_OPERATOR_ROLE) returns (uint256) {
        require(seller != address(0), "RekaKarbon: Seller is required");
        require(amount > 0, "RekaKarbon: Listing amount is required");
        require(floorPricePerTonIdr > 0, "RekaKarbon: Floor price is required");
        require(projectId != bytes32(0), "RekaKarbon: Project ID is required");
        require(kthGroupId != bytes32(0), "RekaKarbon: KTH group ID is required");
        require(projectSnapshotMerkleRoot != bytes32(0), "RekaKarbon: Project snapshot is required");
        require(carbonAssets[assetId].creator != address(0), "RekaKarbon: Asset is not registered");
        require(!carbonAssets[assetId].isFrozen, "RekaKarbon: Aset sedang dibekukan");
        require(balanceOf(seller, assetId) >= amount, "RekaKarbon: Pasokan SPE-GRK tidak cukup");

        uint256 listingId = _nextBursaListingId++;
        _safeTransferFrom(seller, address(this), assetId, amount, "");

        BursaListing storage listing = bursaListings[listingId];
        listing.seller = seller;
        listing.assetId = assetId;
        listing.totalAmount = amount;
        listing.soldAmount = 0;
        listing.floorPricePerTonIdr = floorPricePerTonIdr;
        listing.marketPricePerTonIdr = floorPricePerTonIdr;
        listing.projectId = projectId;
        listing.kthGroupId = kthGroupId;
        listing.projectSnapshotMerkleRoot = projectSnapshotMerkleRoot;
        listing.kthConfirmedBy = address(0);
        listing.createdAt = block.timestamp;
        listing.priceUpdatedAt = block.timestamp;
        listing.status = BursaListingStatus.AWAITING_KTH_CONFIRMATION;

        emit BursaListingCreated(
            listingId,
            seller,
            assetId,
            amount,
            floorPricePerTonIdr,
            projectId,
            kthGroupId,
            projectSnapshotMerkleRoot
        );

        return listingId;
    }

    /// @notice Menetapkan wallet KTH untuk distribusi dana proyek pada listing.
    /// @dev Harus dilakukan sebelum listing dapat dikonfirmasi oleh KTH.
    function setBursaListingKthRecipient(
        uint256 listingId,
        address kthRecipient
    ) external onlyRole(MARKET_OPERATOR_ROLE) {
        BursaListing storage listing = bursaListings[listingId];
        require(listing.seller != address(0), "RekaKarbon: Listing not found");
        require(
            listing.status == BursaListingStatus.AWAITING_KTH_CONFIRMATION,
            "RekaKarbon: Listing recipient is locked"
        );
        require(kthRecipient != address(0), "RekaKarbon: KTH recipient is required");

        bursaListingKthRecipients[listingId] = kthRecipient;
        emit BursaListingKthRecipientConfigured(listingId, kthRecipient);
    }

    /// @notice Mencatat konfirmasi KTH terhadap snapshot data proyek.
    function confirmBursaListing(
        uint256 listingId,
        address kthRepresentative
    ) external onlyRole(MARKET_OPERATOR_ROLE) {
        BursaListing storage listing = bursaListings[listingId];
        require(listing.seller != address(0), "RekaKarbon: Listing not found");
        require(
            listing.status == BursaListingStatus.AWAITING_KTH_CONFIRMATION,
            "RekaKarbon: Listing is not awaiting KTH confirmation"
        );
        require(kthRepresentative != address(0), "RekaKarbon: KTH representative is required");
        require(
            bursaListingKthRecipients[listingId] != address(0),
            "RekaKarbon: KTH recipient is not configured"
        );

        listing.kthConfirmedBy = kthRepresentative;
        emit BursaListingKthConfirmed(
            listingId,
            kthRepresentative,
            listing.projectSnapshotMerkleRoot
        );
    }

    /// @notice Mengaktifkan listing setelah konfirmasi KTH tercatat.
    function activateBursaListing(uint256 listingId) external onlyRole(MARKET_OPERATOR_ROLE) {
        BursaListing storage listing = bursaListings[listingId];
        require(listing.seller != address(0), "RekaKarbon: Listing not found");
        require(
            listing.status == BursaListingStatus.AWAITING_KTH_CONFIRMATION,
            "RekaKarbon: Listing cannot be activated"
        );
        require(listing.kthConfirmedBy != address(0), "RekaKarbon: KTH confirmation is required");

        listing.status = BursaListingStatus.ACTIVE;
        emit BursaListingActivated(listingId, listing.marketPricePerTonIdr);
    }

    /// @notice Memperbarui harga pasar oleh operator yang telah diautentikasi.
    /// Harga tidak boleh turun di bawah floor price. Server menjadwalkan
    /// pembaruan referensi maksimal setiap 15 menit sesuai kebijakan bursa.
    function updateBursaMarketPrice(
        uint256 listingId,
        uint256 newMarketPricePerTonIdr
    ) external onlyRole(MARKET_OPERATOR_ROLE) {
        BursaListing storage listing = bursaListings[listingId];
        require(listing.seller != address(0), "RekaKarbon: Listing not found");
        require(
            listing.status == BursaListingStatus.ACTIVE ||
                listing.status == BursaListingStatus.PARTIALLY_FILLED,
            "RekaKarbon: Listing is not active"
        );
        require(
            newMarketPricePerTonIdr >= listing.floorPricePerTonIdr,
            "RekaKarbon: Price below floor"
        );

        uint256 previousPrice = listing.marketPricePerTonIdr;
        listing.marketPricePerTonIdr = newMarketPricePerTonIdr;
        listing.priceUpdatedAt = block.timestamp;

        emit BursaListingPriceUpdated(
            listingId,
            previousPrice,
            newMarketPricePerTonIdr,
            block.timestamp
        );
    }

    /// @notice Mengambil harga unit dan total biaya sebelum pembelian.
    function quoteBursaPurchase(
        uint256 listingId,
        uint256 amount
    ) external view returns (uint256 unitPricePerTonIdr, uint256 totalCostRkb) {
        BursaListing storage listing = bursaListings[listingId];
        require(listing.seller != address(0), "RekaKarbon: Listing not found");
        require(
            listing.status == BursaListingStatus.ACTIVE ||
                listing.status == BursaListingStatus.PARTIALLY_FILLED,
            "RekaKarbon: Listing is not active"
        );
        require(amount > 0, "RekaKarbon: Purchase amount is required");
        require(amount <= listing.totalAmount - listing.soldAmount, "RekaKarbon: Not enough volume");

        unitPricePerTonIdr = listing.marketPricePerTonIdr;
        totalCostRkb = amount * unitPricePerTonIdr;
    }

    /// @notice Membeli sebagian/seluruh listing secara atomic.
    /// RKB dipindahkan ke enam penerima, sementara SPE-GRK berpindah dari
    /// escrow ke buyer. Tidak ada token yang keluar dari escrow tanpa payment.
    function purchaseBursaListing(
        uint256 listingId,
        address buyer,
        uint256 amount,
        uint256 maxTotalCostRkb
    ) external onlyRole(MARKET_OPERATOR_ROLE) {
        BursaListing storage listing = bursaListings[listingId];
        require(listing.seller != address(0), "RekaKarbon: Listing not found");
        require(
            listing.status == BursaListingStatus.ACTIVE ||
                listing.status == BursaListingStatus.PARTIALLY_FILLED,
            "RekaKarbon: Listing is not active"
        );
        require(buyer != address(0), "RekaKarbon: Buyer is required");
        require(amount > 0, "RekaKarbon: Purchase amount is required");
        require(amount <= listing.totalAmount - listing.soldAmount, "RekaKarbon: Not enough volume");
        require(!carbonAssets[listing.assetId].isFrozen, "RekaKarbon: Aset sedang dibekukan");

        uint256 unitPricePerTonIdr = listing.marketPricePerTonIdr;
        uint256 totalCostRkb = amount * unitPricePerTonIdr;
        require(totalCostRkb <= maxTotalCostRkb, "RekaKarbon: Price slippage exceeded");
        require(balanceOf(buyer, RKB_CREDIT) >= totalCostRkb, "RekaKarbon: Saldo RKB tidak cukup");

        listing.soldAmount += amount;
        if (listing.soldAmount == listing.totalAmount) {
            listing.status = BursaListingStatus.FILLED;
        } else {
            listing.status = BursaListingStatus.PARTIALLY_FILLED;
        }

        _safeTransferFrom(address(this), buyer, listing.assetId, amount, "");
        _distributeBursaPayment(
            listingId,
            buyer,
            totalCostRkb,
            bursaListingKthRecipients[listingId]
        );

        emit CarbonPurchased(buyer, listing.assetId, amount, totalCostRkb, block.timestamp);
        emit BursaPurchaseSettled(
            listingId,
            buyer,
            listing.seller,
            listing.assetId,
            amount,
            unitPricePerTonIdr,
            totalCostRkb
        );
    }

    function _distributeBursaPayment(
        uint256 listingId,
        address buyer,
        uint256 totalCostRkb,
        address kthRecipient
    ) internal {
        uint256 platformAmount = (totalCostRkb * PLATFORM_BPS) / BASIS_POINTS;
        uint256 restorationAmount = (totalCostRkb * RESTORATION_BPS) / BASIS_POINTS;
        uint256 maintenanceAmount = (totalCostRkb * MAINTENANCE_BPS) / BASIS_POINTS;
        uint256 monitoringAmount = (totalCostRkb * MONITORING_BPS) / BASIS_POINTS;
        uint256 bufferAmount = (totalCostRkb * BUFFER_BPS) / BASIS_POINTS;
        uint256 intelligenceAmount = (totalCostRkb * ENVIRONMENTAL_INTELLIGENCE_BPS) / BASIS_POINTS;

        uint256 distributedAmount = platformAmount +
            restorationAmount +
            maintenanceAmount +
            monitoringAmount +
            bufferAmount +
            intelligenceAmount;
        restorationAmount += totalCostRkb - distributedAmount;

        _safeTransferFrom(buyer, platformRecipient, RKB_CREDIT, platformAmount, "");
        _safeTransferFrom(buyer, kthRecipient, RKB_CREDIT, restorationAmount, "");
        _safeTransferFrom(buyer, kthRecipient, RKB_CREDIT, maintenanceAmount, "");
        _safeTransferFrom(buyer, monitoringRecipient, RKB_CREDIT, monitoringAmount, "");
        _safeTransferFrom(buyer, bufferRecipient, RKB_CREDIT, bufferAmount, "");
        _safeTransferFrom(
            buyer,
            environmentalIntelligenceRecipient,
            RKB_CREDIT,
            intelligenceAmount,
            ""
        );

        emit BursaRevenueAllocated(listingId, keccak256("PLATFORM_FEE"), platformRecipient, platformAmount);
        emit BursaRevenueAllocated(listingId, keccak256("RESTORATION"), kthRecipient, restorationAmount);
        emit BursaRevenueAllocated(listingId, keccak256("MAINTENANCE"), kthRecipient, maintenanceAmount);
        emit BursaRevenueAllocated(listingId, keccak256("MONITORING_MRV"), monitoringRecipient, monitoringAmount);
        emit BursaRevenueAllocated(listingId, keccak256("BUFFER_RISK"), bufferRecipient, bufferAmount);
        emit BursaRevenueAllocated(
            listingId,
            keccak256("ENVIRONMENTAL_INTELLIGENCE"),
            environmentalIntelligenceRecipient,
            intelligenceAmount
        );
    }

    /// @notice Membatalkan listing yang belum pernah terjual dan mengembalikan
    /// token yang terkunci kepada Regulator/pemilik proyek.
    function cancelBursaListing(uint256 listingId) external onlyRole(MARKET_OPERATOR_ROLE) {
        BursaListing storage listing = bursaListings[listingId];
        require(listing.seller != address(0), "RekaKarbon: Listing not found");
        require(listing.soldAmount == 0, "RekaKarbon: Listing already has sales");
        require(
            listing.status == BursaListingStatus.AWAITING_KTH_CONFIRMATION ||
                listing.status == BursaListingStatus.ACTIVE,
            "RekaKarbon: Listing cannot be cancelled"
        );

        listing.status = BursaListingStatus.CANCELLED;
        _safeTransferFrom(address(this), listing.seller, listing.assetId, listing.totalAmount, "");

        emit BursaListingCancelled(listingId, listing.seller, listing.totalAmount);
    }

    /// @notice Volume yang masih tersedia di escrow listing.
    function bursaListingAvailableAmount(uint256 listingId) external view returns (uint256) {
        BursaListing storage listing = bursaListings[listingId];
        require(listing.seller != address(0), "RekaKarbon: Listing not found");
        return listing.totalAmount - listing.soldAmount;
    }

    /// @notice Backend mengeksekusi pembelian karbon di Bursa
    /// @dev Atomic: burn RKB_CREDIT + transfer SPE-GRK dalam 1 transaksi
    function executeBursaPurchase(
        address buyer,
        address seller,         // Pool proyek / pengelola hutan
        uint256 assetId,        // Token ID SPE-GRK
        uint256 amount,         // Jumlah tCO2e
        uint256 totalCostRKB    // Total Rupiah (RKB_CREDIT)
    ) public onlyRole(DEPOSIT_ROLE) {
        require(balanceOf(buyer, RKB_CREDIT) >= totalCostRKB, "RekaKarbon: Saldo RKB tidak cukup");
        require(balanceOf(seller, assetId) >= amount, "RekaKarbon: Pasokan SPE-GRK tidak cukup");
        require(!carbonAssets[assetId].isFrozen, "RekaKarbon: Aset sedang dibekukan");

        // 1. Burn RKB_CREDIT dari pembeli
        _burn(buyer, RKB_CREDIT, totalCostRKB);

        // 2. Transfer SPE-GRK dari seller ke pembeli
        _safeTransferFrom(seller, buyer, assetId, amount, "");

        emit CarbonPurchased(buyer, assetId, amount, totalCostRKB, block.timestamp);
    }

    /// @notice Menghanguskan token sebagai bukti pelaporan kepatuhan/offset karbon
    /// @param assetId ID aset yang akan di-retire
    /// @param amount Jumlah aset yang di-retire
    function retireCarbon(uint256 assetId, uint256 amount) public {
        require(!carbonAssets[assetId].isFrozen, "RekaKarbon: Aset sedang dibekukan");
        
        _burn(msg.sender, assetId, amount);
        
        emit CarbonRetired(msg.sender, assetId, amount);
    }

    /// @notice Menghanguskan token untuk mendapatkan Sertifikat Pensiun Karbon
    function retireCarbonWithCertificate(
        uint256 assetId,
        uint256 amount,
        string calldata certificateNumber
    ) public returns (uint256) {
        require(!carbonAssets[assetId].isFrozen, "RekaKarbon: Aset sedang dibekukan");
        require(balanceOf(msg.sender, assetId) >= amount, "RekaKarbon: Saldo tidak cukup");
        
        _burn(msg.sender, assetId, amount);
        
        uint256 certId = _nextCertId++;
        retirementCerts[certId] = RetirementCertificate({
            retiree: msg.sender,
            assetId: assetId,
            amountRetired: amount,
            certificateNumber: certificateNumber,
            burnTxHash: bytes32(0), // Diisi oleh backend setelah tx confirmed
            retiredAt: block.timestamp,
            isActive: true
        });
        
        certsByRetiree[msg.sender].push(certId);
        
        emit CarbonRetired(msg.sender, assetId, amount);
        emit RetirementCertificateIssued(certId, msg.sender, assetId, amount, certificateNumber);
        
        return certId;
    }

    /// @notice Backend retires tokens owned by a verified platform user.
    /// @dev The platform signer is authorized through DEPOSIT_ROLE, while the
    ///      retirement certificate remains associated with the user's wallet.
    function retireCarbonWithCertificateFor(
        address retiree,
        uint256 assetId,
        uint256 amount,
        string calldata certificateNumber
    ) public onlyRole(DEPOSIT_ROLE) returns (uint256) {
        require(retiree != address(0), "RekaKarbon: Retiree tidak valid");
        require(!carbonAssets[assetId].isFrozen, "RekaKarbon: Aset sedang dibekukan");
        require(balanceOf(retiree, assetId) >= amount, "RekaKarbon: Saldo tidak cukup");

        _burn(retiree, assetId, amount);

        uint256 certId = _nextCertId++;
        retirementCerts[certId] = RetirementCertificate({
            retiree: retiree,
            assetId: assetId,
            amountRetired: amount,
            certificateNumber: certificateNumber,
            burnTxHash: bytes32(0),
            retiredAt: block.timestamp,
            isActive: true
        });

        certsByRetiree[retiree].push(certId);

        emit CarbonRetired(retiree, assetId, amount);
        emit RetirementCertificateIssued(certId, retiree, assetId, amount, certificateNumber);

        return certId;
    }

    /// @notice Mendapatkan daftar ID sertifikat milik seorang pengguna
    function getCertsByRetiree(address retiree) external view returns (uint256[] memory) {
        return certsByRetiree[retiree];
    }

    /// @notice Admin (KLHK) membekukan aset karbon (misal: hutan terbakar)
    /// @param assetId ID aset yang akan dibekukan
    function freezeAsset(uint256 assetId) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(carbonAssets[assetId].creator != address(0), "RekaKarbon: Aset tidak valid");
        carbonAssets[assetId].isFrozen = true;
        emit AssetFrozen(assetId);
    }

    /// @notice Admin (KLHK) membuka kembali blokir aset karbon yang sebelumnya dibekukan
    /// @param assetId ID aset yang akan dibuka blokirnya
    function unfreezeAsset(uint256 assetId) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(carbonAssets[assetId].creator != address(0), "RekaKarbon: Aset tidak valid");
        carbonAssets[assetId].isFrozen = false;
        emit AssetUnfrozen(assetId);
    }

    /// @notice Pengecekan sebelum transfer. Transfer antar entitas ditolak jika token sedang dibekukan
    /// @dev Internal override dari standar ERC1155 v5
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override {
        super._update(from, to, ids, values);

        // Abaikan pengecekan saat proses minting (from == 0) atau burning (to == 0)
        // Kita mengizinkan burning token beku agar fitur `swapFrozenAsset` bisa berjalan
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                require(!carbonAssets[ids[i]].isFrozen, "RekaKarbon: Aset sedang dibekukan (Emergency Freeze)");
            }
        }
    }

    /// @notice Implementasi ERC165
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, AccessControl, ERC1155Holder)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
