// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

contract KycVault {
    struct Credential {
        bytes32 hash;
        address issuer;
        uint64 issuedAt;
        bool valid;
    }

    // Stores the KYC credential for each holder
    mapping(address => Credential) public credentials;

    // Holder => Verifier => Consent
    mapping(address => mapping(address => bool)) public consent;

    event CredentialIssued(
        address indexed holder,
        address indexed issuer,
        bytes32 hash,
        uint64 issuedAt
    );

    event CredentialValidityChanged(
        address indexed holder,
        bool valid
    );

    event ConsentChanged(
        address indexed holder,
        address indexed verifier,
        bool consentGiven
    );

    // Issuer stores the verified document hash for a holder
    function issueCredential(
        address holder,
        bytes32 documentHash
    ) external {
        require(holder != address(0), "Invalid holder address");
        require(documentHash != bytes32(0), "Invalid document hash");

        credentials[holder] = Credential({
            hash: documentHash,
            issuer: msg.sender,
            issuedAt: uint64(block.timestamp),
            valid: true
        });

        emit CredentialIssued(
            holder,
            msg.sender,
            documentHash,
            uint64(block.timestamp)
        );
    }

    // Issuer can mark a credential valid or invalid
    function setCredentialValidity(
        address holder,
        bool valid
    ) external {
        require(
            credentials[holder].issuer == msg.sender,
            "Only issuer can change validity"
        );

        credentials[holder].valid = valid;

        emit CredentialValidityChanged(holder, valid);
    }

    // Holder gives or removes consent for a verifier
    function setConsent(
        address verifier,
        bool consentGiven
    ) external {
        require(verifier != address(0), "Invalid verifier address");

        consent[msg.sender][verifier] = consentGiven;

        emit ConsentChanged(
            msg.sender,
            verifier,
            consentGiven
        );
    }

    // Verifier checks whether the credential is valid
    function isValid(
        address holder,
        bytes32 documentHash
    ) external view returns (bool) {
        Credential memory credential = credentials[holder];

        return (
            credential.valid &&
            credential.hash == documentHash &&
            consent[holder][msg.sender]
        );
    }

    // Get the stored credential information
    function getCredential(
        address holder
    )
        external
        view
        returns (
            bytes32 hash,
            address issuer,
            uint64 issuedAt,
            bool valid
        )
    {
        Credential memory credential = credentials[holder];

        return (
            credential.hash,
            credential.issuer,
            credential.issuedAt,
            credential.valid
        );
    }

    // Check whether a holder has given consent to a particular verifier
    function hasConsent(
        address holder,
        address verifier
    ) external view returns (bool) {
        return consent[holder][verifier];
    }
}