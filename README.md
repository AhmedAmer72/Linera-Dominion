# Linera Dominion

A decentralized Massively Multiplayer Online Real-Time Strategy (MMORTS) game built on the [Linera](https://linera.io) blockchain. Conquer the galaxy through strategic resource management, fleet coordination, and interstellar warfare — all executed trustlessly on-chain.

## 🌌 Overview

Linera Dominion leverages Linera's revolutionary microchain architecture to deliver a scalable, real-time strategy experience where every action is a blockchain transaction. The game uses a "Galaxy of Chains" architecture where different chain types handle different aspects of the game:

- **User Chains (Dominion)**: Private empires, resource production, research
- **Region Chains**: Spatial sharding, fleet movement, planetary control
- **Battle Chains**: Ephemeral combat instances with tactical depth
- **Alliance Chains**: DAO governance, collective decision-making

## 🏗️ Architecture

```
                    ┌──────────────────┐
                    │   Senate Chain   │
                    │  (Governance)    │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Region Chain A  │ │ Region Chain B  │ │ Region Chain C  │
│ (Sector 0,0)    │ │ (Sector 1,0)    │ │ (Sector 0,1)    │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
    ┌────┴────┐         ┌────┴────┐         ┌────┴────┐
    │         │         │         │         │         │
    ▼         ▼         ▼         ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│User A │ │User B │ │User C │ │User D │ │User E │ │User F │
│Chain  │ │Chain  │ │Chain  │ │Chain  │ │Chain  │ │Chain  │
└───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘
```

## 🎮 Game Features

### Resource System
- **Iron**: Primary construction material
- **Deuterium**: Fuel for fleets
- **Chronos Crystals**: Premium currency for advanced tech
- **Lazy Evaluation**: Resources calculated on-demand, not every tick

### Units
| Ship Type | Role | Attack | Defense | Speed |
|-----------|------|--------|---------|-------|
| Scout | Reconnaissance | 5 | 2 | 200 |
| Fighter | Combat | 25 | 10 | 150 |
| Cruiser | Heavy Combat | 80 | 40 | 100 |
| Battleship | Capital Ship | 200 | 100 | 60 |
| Carrier | Fighter Support | 50 | 150 | 50 |
| Dreadnought | Alliance Super-weapon | 1000 | 500 | 20 |

### Combat System
- **Fog of War**: Fleet compositions hidden via commit-reveal scheme
- **Tactical Orders**: Focus Fire, Flank, Defensive Stance, Retreat
- **War Bonds**: Time-limited battles prevent griefing
- **Experience System**: Veterans gain combat bonuses

### Governance
- **Senate Chain**: Cross-alliance parameter voting
- **Alliance DAOs**: Collective research, shared fleets
- **Slashing Penalties**: Automatic enforcement of treaties

## 📁 Project Structure

```
linera-dominion/
├── common/                 # Shared types and utilities
│   └── src/
│       ├── lib.rs         # Module exports
│       ├── types.rs       # Core game types
│       ├── resources.rs   # Resource wallet with lazy evaluation
│       ├── units.rs       # Ship types and fleet management
│       ├── coordinates.rs # Spatial coordinate system
│       ├── messages.rs    # Cross-chain message types
│       ├── errors.rs      # Error types
│       ├── constants.rs   # Game balance constants
│       └── crypto.rs      # Fog of war commit-reveal
├── dominion/              # User Chain application
│   └── src/
│       ├── lib.rs         # ABI definitions
│       ├── state.rs       # Player state management
│       ├── operations.rs  # Operation handlers
│       ├── contract.rs    # Main contract logic
│       └── service.rs     # GraphQL service
├── region/                # Region Chain application
│   └── src/
│       ├── lib.rs         # ABI definitions
│       ├── state.rs       # Sector state
│       ├── contract.rs    # Fleet & planet management
│       └── service.rs     # GraphQL queries
├── battle/                # Battle Chain application
│   └── src/
│       ├── lib.rs         # ABI definitions
│       ├── state.rs       # Combat state
│       ├── combat.rs      # Damage calculations
│       ├── contract.rs    # Tactical commands
│       └── service.rs     # Battle status queries
├── Cargo.toml             # Workspace configuration
├── rust-toolchain.toml    # Rust version specification
├── build.sh               # Build script
└── README.md              # This file
```

## 🛠️ Building

### Prerequisites

1. **Rust 1.86+** with wasm32 target:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

2. **Linera CLI**:
   ```bash
   cargo install linera-client
   ```

### Build

```bash
# Make build script executable
chmod +x build.sh

# Build all contracts
./build.sh
```

Or manually:
```bash
cargo build --release --target wasm32-unknown-unknown
```

## 🚀 Deployment

### Local Development Network

```bash
# Start local Linera network
linera net up

# Initialize a wallet
linera wallet init --faucet http://localhost:8080

# Publish the Dominion application
linera publish-application \
    target/wasm32-unknown-unknown/release/linera_dominion.wasm \
    --json-argument '{}' \
    --json-parameters '{}'
```

### Interacting via GraphQL

Each application exposes a GraphQL endpoint for queries:

```graphql
# Query player resources
query {
  resources {
    iron
    deuterium
    chronosCrystals
  }
  productionRates {
    iron
    deuterium
  }
}

# Build a structure
mutation {
  build(buildingType: "IronMine")
}

# Create a fleet
mutation {
  createFleet(ships: [
    { shipType: "Fighter", count: 10 },
    { shipType: "Cruiser", count: 5 }
  ])
}
```

## 🎯 Gameplay Loop

1. **Establish Your Dominion**
   - Each player owns a private User Chain
   - Build mines to produce Iron and Deuterium
   - Research technologies to unlock advanced units

2. **Explore the Galaxy**
   - Send scouts to discover nearby sectors
   - Fleet compositions are hidden (Fog of War)
   - Procedurally generated planets await colonization

3. **Claim Territory**
   - Stake Chronos Crystals to claim planets
   - Stakes decay over time - defend or lose control
   - Planet ownership grants passive bonuses

4. **Engage in Combat**
   - When fleets collide, a Battle Chain spawns
   - Issue tactical commands each turn
   - Winners capture cargo and gain experience

5. **Form Alliances**
   - Join or create Alliance DAOs
   - Pool resources for mega-projects (Dreadnoughts!)
   - Negotiate binding treaties with other alliances

## 🔬 Technical Innovations

### Lazy Resource Evaluation
Resources are not updated every block. Instead:
```
R_current = R_last + (Rate × (T_now - T_last))
```
This dramatically reduces on-chain computation.

### Fog of War via Commit-Reveal
Fleet compositions use cryptographic commits:
1. **Commit**: `H = SHA3(fleet_data || salt)` when dispatching
2. **Reveal**: Submit `fleet_data` and `salt` when required
3. **Verify**: Region chain validates `SHA3(fleet_data || salt) == H`

### Ephemeral Battle Chains
Combat chains exist only for the duration of battle:
- Spawned on first contact
- High-frequency tactical commands
- Self-destruct after resolution
- Results propagated to Region and User chains

### Deterministic Procedural Generation
```
planet_hash = SHA3(region_seed || position)
resources = extract_resources(planet_hash)
planet_type = determine_type(planet_hash)
```
Same seed always produces same galaxy — no centralized map server.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## 🔗 Links

- [Linera Protocol](https://linera.io)
- [Linera Documentation](https://linera.dev)
- [Linera GitHub](https://github.com/linera-io/linera-protocol)

---

*"In the vastness of space, every transaction is a step toward galactic dominion."*
