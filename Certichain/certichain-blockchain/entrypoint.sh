#!/bin/bash
set -e

# Compile the smart contracts
echo "Compiling smart contracts..."
npx hardhat compile

# Execute the main command (hardhat node)
echo "Starting Hardhat node..."
exec "$@"
