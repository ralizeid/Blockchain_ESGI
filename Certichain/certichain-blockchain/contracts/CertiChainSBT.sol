// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CertiChainSBT is ERC721, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("CertiChain Diploma", "CERT") Ownable(msg.sender) {}

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    // VERSION PROPRE : On retire les noms des variables inutilisées (from, to, tokenId)
    // et on ajoute 'pure' car la fonction ne fait que rejeter l'action.
    
    function transferFrom(address, address, uint256) public pure override(ERC721) {
        revert("Action Interdite: Ce diplome est lie a l'etudiant (SBT).");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override(ERC721) {
        revert("Action Interdite: Ce diplome est lie a l'etudiant (SBT).");
    }
}
