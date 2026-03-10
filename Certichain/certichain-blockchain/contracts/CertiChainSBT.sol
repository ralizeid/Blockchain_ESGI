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
contract CertiChainSBT is Ownable {

    /// @dev Informations liées à un hash certifié.
    struct Certificate {
        address issuer;   // Portefeuille de l'émetteur (plateforme / école)
        uint256 issuedAt; // Timestamp Unix d'émission
        bool    revoked;  // Drapeau de révocation (fraude, erreur)
    }

    // hash SHA-256 du diplôme (bytes32) → certificat
    mapping(bytes32 => Certificate) private _certificates;

    /// @dev Émis à chaque nouvelle certification.
    event DiplomaIssued(
        bytes32 indexed diplomaHash,
        address indexed issuer,
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
    //  ÉCRITURE (onlyOwner)
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Certifie un diplôme via son hash SHA-256 pseudonymisé.
     * @param  diplomaHash  Hash bytes32 des données clés du diplôme.
     */
    function certify(bytes32 diplomaHash) external onlyOwner {
        require(
            _certificates[diplomaHash].issuedAt == 0,
            "Ce hash est deja certifie."
        );
        _certificates[diplomaHash] = Certificate({
            issuer:   msg.sender,
            issuedAt: block.timestamp,
            revoked:  false
        });
        emit DiplomaIssued(diplomaHash, msg.sender, block.timestamp);
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
    function verify(bytes32 diplomaHash) external view returns (
        bool    certified,
        bool    revoked,
        address issuer,
        uint256 issuedAt
    ) {
        Certificate memory cert = _certificates[diplomaHash];
        certified = cert.issuedAt != 0;
        revoked   = cert.revoked;
        issuer    = cert.issuer;
        issuedAt  = cert.issuedAt;
    }
}

