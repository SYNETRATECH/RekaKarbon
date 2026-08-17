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

    /// @notice Token ID untuk SPE-GRK (Offset) dimulai dari angka 2
    uint256 private _nextTokenId = 2; 

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
    }

    /// @notice Mencetak token Jatah Emisi (PTBAE-PU) ke alamat tujuan
    /// @param to Alamat penerima jatah emisi
    /// @param amount Jumlah token yang dicetak
    function issueQuota(address to, uint256 amount) public onlyRole(MINISTRY_ROLE) {
        _mint(to, PTBAE_PU, amount, "");
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

    /// @notice Menghanguskan token sebagai bukti pelaporan kepatuhan/offset karbon
    /// @param assetId ID aset yang akan di-retire
    /// @param amount Jumlah aset yang di-retire
    function retireCarbon(uint256 assetId, uint256 amount) public {
        require(!carbonAssets[assetId].isFrozen, "RekaKarbon: Aset sedang dibekukan");
        
        _burn(msg.sender, assetId, amount);
        
        emit CarbonRetired(msg.sender, assetId, amount);
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
