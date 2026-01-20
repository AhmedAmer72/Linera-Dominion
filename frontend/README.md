# 🌌 Linera Dominion

**A Blockchain-Powered Space MMORTS Built on Linera**

![Linera Dominion](https://img.shields.io/badge/Linera-0.15.8-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/badge/License-MIT-green)

Linera Dominion is a massively multiplayer online real-time strategy game where players build galactic empires, command fleets, research technologies, and engage in epic space battles—all powered by the Linera blockchain for true ownership and decentralization.

## 🎮 Game Features

- **🏗️ Empire Building** - Construct mining facilities, shipyards, research labs, and defensive structures
- **🚀 Fleet Management** - Build and command diverse fleets of scouts, fighters, cruisers, and capital ships
- **🔬 Technology Research** - Unlock 11 unique technologies from plasma weapons to temporal mechanics
- **🌍 Galaxy Exploration** - Explore procedurally generated sectors, colonize planets, and gather resources
- **⚔️ Strategic Combat** - Engage in turn-based fog-of-war battles with commit-reveal mechanics
- **🤝 Alliances** - Form DAOs with other players for cooperative gameplay

## 🏗️ Architecture

The game uses Linera's multi-chain architecture with three chain types:

| Chain Type | Purpose |
|------------|---------|
| **Dominion (User Chain)** | Personal empire management, resources, buildings, fleets |
| **Region Chain** | Spatial sharding, planet ownership, fleet movements |
| **Battle Chain** | Ephemeral combat instances with fog-of-war |

## 📁 Project Structure

```
Linera-Dominion/
├── dominion/          # User chain smart contracts
│   └── src/
│       ├── contract.rs
│       ├── service.rs
│       ├── state.rs
│       └── lib.rs
├── region/            # Region chain smart contracts
├── battle/            # Battle chain smart contracts
├── common/            # Shared types and utilities
├── frontend/          # Next.js web application
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   │   ├── three/     # 3D space scene
│   │   │   ├── game/      # Game HUD components
│   │   │   ├── panels/    # UI panels
│   │   │   └── ui/        # Shared UI components
│   │   ├── lib/           # GraphQL & Linera integration
│   │   └── store/         # Zustand state management
│   └── vercel.json        # Vercel deployment config
└── scripts/           # Deployment scripts
```

## 🚀 Quick Start

### Prerequisites

- **Rust 1.89+** with `wasm32-unknown-unknown` target
- **Node.js 18+** and npm
- **Linera CLI** (`cargo install linera-service@0.15.8`)

### 1. Build Smart Contracts

```bash
# Clone the repository
git clone https://github.com/yourusername/Linera-Dominion.git
cd Linera-Dominion

# Build WASM contracts
cargo build --target wasm32-unknown-unknown --release
```

### 2. Deploy to Linera Testnet

```bash
# Make the script executable
chmod +x scripts/deploy-testnet.sh

# Deploy contracts (this will create .env.local for frontend)
./scripts/deploy-testnet.sh
```

The script will:
- Initialize a wallet with testnet tokens
- Deploy all three contract types
- Generate frontend configuration

### 3. Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play!

### 4. Deploy to Vercel

```bash
cd frontend

# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

Set these environment variables in Vercel:
- `NEXT_PUBLIC_LINERA_GRAPHQL` - GraphQL endpoint
- `NEXT_PUBLIC_LINERA_FAUCET` - Faucet endpoint
- `NEXT_PUBLIC_DOMINION_APP_ID` - Your deployed app ID
- `NEXT_PUBLIC_REGION_APP_ID` - Region app ID
- `NEXT_PUBLIC_BATTLE_APP_ID` - Battle app ID

## 🎨 Frontend Features

The frontend is built with cutting-edge technologies:

- **Next.js 14** - React framework with App Router
- **Three.js / React Three Fiber** - Immersive 3D space scene
- **Framer Motion** - Smooth animations throughout
- **Tailwind CSS** - Custom space-themed design system
- **Apollo Client** - GraphQL integration with Linera
- **Zustand** - Lightweight state management

### Animations Include:
- 🌟 Dynamic starfield with parallax
- 🌀 Animated nebula clouds
- 🪐 Rotating planets with atmospheres
- 🚀 Fleet movement trails
- ✨ Holographic UI panels with glow effects
- 📊 Smooth resource counters
- 🎯 Interactive galaxy map with zoom/pan

## 📜 Smart Contract Operations

### Dominion (User Chain)

| Operation | Description |
|-----------|-------------|
| `Build` | Construct/upgrade buildings |
| `BuildShips` | Manufacture ships |
| `CreateFleet` | Form a new fleet |
| `SendFleet` | Deploy fleet to coordinates |
| `Research` | Start technology research |
| `CreateTrade` | Create trade offers |

### Region Chain

| Operation | Description |
|-----------|-------------|
| `ClaimPlanet` | Colonize a planet |
| `ScanFleet` | Detect nearby fleets |
| `DeclareHostility` | Mark enemy players |

### Battle Chain

| Operation | Description |
|-----------|-------------|
| `SubmitCommand` | Submit encrypted battle command |
| `RequestResolution` | Resolve battle turn |

## 🔧 Development

### Building Contracts

```bash
# Debug build
cargo build --target wasm32-unknown-unknown

# Release build (optimized)
cargo build --target wasm32-unknown-unknown --release

# Run tests
cargo test
```

### Frontend Development

```bash
cd frontend

# Development server
npm run dev

# Production build
npm run build

# Lint
npm run lint
```

## 🌐 Network Configuration

### Testnet (Default)
- Faucet: `https://faucet.testnet.linera.net`
- RPC: `https://rpc.testnet.linera.net`

### Local Development
```bash
# Start local network
linera net up --testing-prng-seed 37

# Use local endpoints
export LINERA_FAUCET=http://localhost:8080
export LINERA_RPC=http://localhost:9001
```

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 🔗 Links

- [Linera Documentation](https://linera.dev)
- [Discord Community](https://discord.gg/linera)
- [Game Wiki](https://github.com/yourusername/Linera-Dominion/wiki)

---

**Built with 💜 for the Linera ecosystem**
