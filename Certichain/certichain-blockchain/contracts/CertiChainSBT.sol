// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  CertiChainSBT
 * @notice Registre immuable de certification de diplômes pseudonymisés.
 *
 *         Privacy by Design (RGPD Art. 25) :
 *         – Aucune donnée personnelle n'est écrite sur la blockchain.
 *         – Seul le hash SHA-256 (pseudonyme) du diplôme est ancré.
 *         – Le hash est calculé à partir de : prénom | nom | intitulé | UUID-secret.
 *           L'UUID empêche toute réidentification par force brute.
 *
 *         Tous les établissements partagent le même portefeuille admin (custodial).
 *         L'adresse du portefeuille (0x...) identifie l'émetteur sur la chaîne
 *         sans révéler son nom en clair.
 */
/**
 * @title  CertiChainSBT
 * @notice Registre immuable de certification de diplômes pseudonymisés.
 *
 *         Double signature MetaMask (École + Rectorat) :
 *         – Avant ancrage, les deux parties signent le hash hors-chaîne.
 *         – Le backend vérifie les deux signatures (ecrecover) et appelle
 *           certify(hash, schoolAddr, rectorateAddr).
 *         – Les deux adresses sont stockées on-chain : preuve publique et
 *           immuable de la co-validation.
 */
contract CertiChainSBT is Ownable {

    /// @dev Informations liées à un hash certifié.
    struct Certificate {
        address schoolAddr;    // Portefeuille MetaMask de l'école co-signataire
        address rectorateAddr; // Portefeuille MetaMask du rectorat co-signataire
        uint256 issuedAt;      // Timestamp Unix d'émission
        bool    revoked;       // Drapeau de révocation
    }

    // hash SHA-256 du diplôme (bytes32) → certificat
    mapping(bytes32 => Certificate) private _certificates;

    /// @dev Émis à chaque nouvelle certification (avec les deux adresses co-signataires).
    event DiplomaIssued(
        bytes32 indexed diplomaHash,
        address indexed schoolAddr,
        address indexed rectorateAddr,
        uint256         timestamp
    );

    /// @dev Émis lors d'une révocation.
    event DiplomaRevoked(
        bytes32 indexed diplomaHash,
        address indexed revokedBy,
        uint256         timestamp
    );

    constructor() Ownable(msg.sender) {}

    // ─────────────────────────────────────────────────────────────
    //  ÉCRITURE (onlyOwner = backend custodial)
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Certifie un diplôme en enregistrant les deux portefeuilles co-signataires.
     * @param  diplomaHash  Hash bytes32 des données clés du diplôme.
     * @param  school       Adresse MetaMask de l'école ayant signé hors-chaîne.
     * @param  rectorate    Adresse MetaMask du rectorat ayant signé hors-chaîne.
     */
    function certify(bytes32 diplomaHash, address school, address rectorate) external onlyOwner {
        require(
            _certificates[diplomaHash].issuedAt == 0,
            "Ce hash est deja certifie."
        );
        require(
            school != address(0) && rectorate != address(0),
            "Adresses signataires invalides."
        );
        _certificates[diplomaHash] = Certificate({
            schoolAddr:    school,
            rectorateAddr: rectorate,
            issuedAt:      block.timestamp,
            revoked:       false
        });
        emit DiplomaIssued(diplomaHash, school, rectorate, block.timestamp);
    }

    /**
     * @notice Révoque un diplôme (fraude, erreur d'émission).
     *         La preuve d'existence reste sur la chaîne ; seul le flag change.
     * @param  diplomaHash  Hash du diplôme à révoquer.
     */
    function revoke(bytes32 diplomaHash) external onlyOwner {
        require(
            _certificates[diplomaHash].issuedAt != 0,
            "Ce hash n'est pas certifie."
        );
        require(
            !_certificates[diplomaHash].revoked,
            "Ce diplome est deja revoque."
        );
        _certificates[diplomaHash].revoked = true;
        emit DiplomaRevoked(diplomaHash, msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    //  LECTURE (public, sans permission)
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Vérifie l'état d'un diplôme de manière publique et transparente.
     * @param  diplomaHash Hash du diplôme à vérifier.
     * @return certified   Vrai si le hash est enregistré sur la blockchain.
     * @return revoked     Vrai si le diplôme a été révoqué.
     * @return issuer      Adresse du portefeuille émetteur.
     * @return issuedAt    Timestamp Unix d'émission.
     */
    /**
     * @notice Vérifie l'état d'un diplôme et expose les adresses co-signataires.
     * @return certified     Vrai si le hash est enregistré sur la blockchain.
     * @return revoked       Vrai si le diplôme a été révoqué.
     * @return schoolAddr    Adresse MetaMask de l'école co-signataire.
     * @return rectorateAddr Adresse MetaMask du rectorat co-signataire.
     * @return issuedAt      Timestamp Unix d'émission.
     */
    function verify(bytes32 diplomaHash) external view returns (
        bool    certified,
        bool    revoked,
        address schoolAddr,
        address rectorateAddr,
        uint256 issuedAt
    ) {
        Certificate memory cert = _certificates[diplomaHash];
        certified     = cert.issuedAt != 0;
        revoked       = cert.revoked;
        schoolAddr    = cert.schoolAddr;
        rectorateAddr = cert.rectorateAddr;
        issuedAt      = cert.issuedAt;
    }
}

