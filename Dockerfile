# Linera Dominion - MMORTS Game on Linera Blockchain
# Docker build for local development and testing

FROM rust:1.89-slim

SHELL ["bash", "-c"]

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    protobuf-compiler \
    clang \
    libclang-dev \
    make \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Linera tools (matching SDK version 0.15.8)
RUN cargo install --locked linera-service@0.15.8 linera-storage-service@0.15.8

# Install Node.js via nvm (for future frontend integration)
RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.40.3/install.sh | bash \
    && . ~/.nvm/nvm.sh \
    && nvm install lts/krypton \
    && npm install -g pnpm

# Add wasm target for contract compilation
RUN rustup target add wasm32-unknown-unknown

WORKDIR /build

# Healthcheck - wait for GraphQL service
HEALTHCHECK --interval=5s --timeout=3s --start-period=120s --retries=20 \
    CMD curl -sf http://localhost:9001 || exit 1

ENTRYPOINT ["bash", "/build/run.bash"]
