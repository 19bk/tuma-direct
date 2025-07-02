# TumaDirect 🌍💸

**Bridging Mobile Money with Crypto for Kenya's Financial Future**

TumaDirect is a revolutionary fintech dApp that seamlessly connects Kenya's ubiquitous mobile money (M-Pesa) with global crypto networks (USDC/cUSD) using Coinbase Developer Platform tools. Our mission is to democratize access to global financial services for ordinary Kenyans.

## 🎯 Project Overview

### Vision
Empower Kenyan users to:
- **Onramp** KES to USDC/cUSD via Coinbase CDP Onramp
- **Send/Receive** payments globally with minimal fees
- **Offramp** to M-Pesa or P2P agents
- **Swap** tokens within the app using CDP Swap API
- **Optional privacy** features via Aleo zero-knowledge proofs

### Target Grants
1. **Coinbase Developer Platform Summer Builder Grant (2025)** - CDP Wallets, Onramp, Swap API integration
2. **Aleo START Grant** - Zero-knowledge privacy layer for anonymous transactions
3. **Circle Developer Grants** - Practical USDC adoption in emerging markets

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web App       │    │   Backend API   │
│   (Flutter)     │◄──►│   (React)       │◄──►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Coinbase CDP Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Wallets   │  │   Onramp    │  │    Swap     │            │
│  │     API     │  │     API     │  │     API     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Blockchain Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Ethereum  │  │   Polygon   │  │    Aleo     │            │
│  │   (USDC)    │  │   (cUSD)    │  │  (Privacy)  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Mobile Money Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   M-Pesa    │  │   Airtel    │  │   P2P       │            │
│  │   API       │  │   Money     │  │   Agents    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 📋 Build Phases

### Phase 1: Foundation & Architecture (Week 1-2)
- [ ] Project setup and development environment
- [ ] Smart contract architecture design
- [ ] CDP integration planning
- [ ] Database schema design
- [ ] API architecture planning

### Phase 2: Smart Contracts & Web3 (Week 3-4)
- [ ] Core smart contracts development
- [ ] Bridge logic implementation
- [ ] Security audits and testing
- [ ] Deployment scripts

### Phase 3: CDP Integration (Week 5-6)
- [ ] Coinbase Wallet integration
- [ ] Onramp API implementation
- [ ] Swap API integration
- [ ] Error handling and fallbacks

### Phase 4: Backend & APIs (Week 7-8)
- [ ] Node.js backend development
- [ ] Mobile money API integration
- [ ] User authentication system
- [ ] Transaction management

### Phase 5: Frontend Development (Week 9-12)
- [ ] Flutter mobile app
- [ ] React web app
- [ ] UI/UX implementation
- [ ] Cross-platform testing

### Phase 6: Privacy Layer (Week 13-14)
- [ ] Aleo integration (optional)
- [ ] Zero-knowledge proof implementation
- [ ] Anonymous transaction relay

### Phase 7: Testing & Polish (Week 15-16)
- [ ] Comprehensive testing
- [ ] Security audits
- [ ] Performance optimization
- [ ] Demo preparation

### Phase 8: Grant Submission (Week 17-18)
- [ ] Grant proposal writing
- [ ] Demo video creation
- [ ] Documentation completion
- [ ] Submission to all three grant programs

## 🛠️ Tech Stack

### Frontend
- **Mobile**: Flutter (cross-platform)
- **Web**: React + TypeScript
- **State Management**: Provider (Flutter) / Redux Toolkit (React)
- **UI Framework**: Material Design 3 / Tailwind CSS

### Backend
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL + Supabase
- **Authentication**: Firebase Auth
- **File Storage**: Firebase Storage
- **Real-time**: Supabase Realtime

### Web3
- **Smart Contracts**: Solidity (EVM)
- **Development**: Hardhat
- **Testing**: Foundry
- **Networks**: Ethereum, Polygon, Aleo
- **CDP Integration**: Coinbase Wallets, Onramp, Swap APIs

### DevOps
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (Frontend) + Railway (Backend)
- **Monitoring**: Sentry

## 📁 Project Structure

```
tuma-direct/
├── contracts/                 # Smart contracts
│   ├── core/                 # Core business logic
│   ├── bridge/               # Bridge contracts
│   ├── privacy/              # Aleo privacy layer
│   └── test/                 # Contract tests
├── mobile/                   # Flutter mobile app
│   ├── lib/
│   ├── assets/
│   └── test/
├── web/                      # React web app
│   ├── src/
│   ├── public/
│   └── test/
├── backend/                  # Node.js backend
│   ├── src/
│   ├── config/
│   └── test/
├── docs/                     # Documentation
├── scripts/                  # Deployment scripts
└── grants/                   # Grant proposals
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Flutter 3.10+
- Git
- MetaMask or Coinbase Wallet

### Installation
```bash
# Clone repository
git clone https://github.com/your-username/tuma-direct.git
cd tuma-direct

# Install dependencies
npm install
cd mobile && flutter pub get
cd ../web && npm install
cd ../backend && npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development
npm run dev
```

## 🔐 Security Features

- **Multi-signature wallets** for high-value transactions
- **Rate limiting** on all APIs
- **Input validation** and sanitization
- **Secure key management** via CDP Wallets
- **Audit trails** for all transactions
- **Fallback mechanisms** for failed transactions

## 📊 Key Metrics

- **Target Users**: 1M+ Kenyan mobile money users
- **Transaction Volume**: $10M+ monthly
- **Fee Structure**: 0.5% per transaction
- **Supported Currencies**: KES, USDC, cUSD
- **Supported Networks**: Ethereum, Polygon, Aleo

## 🤝 Contributing

This project is open source and welcomes contributions. Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Grant Strategy

### Coinbase Developer Platform Grant
- **Focus**: CDP Wallets, Onramp, Swap API integration
- **Key Points**: Real-world adoption, emerging market impact
- **Demo**: Live transaction flow from KES to USDC

### Aleo START Grant
- **Focus**: Zero-knowledge privacy features
- **Key Points**: Anonymous donations, private transaction history
- **Demo**: Privacy-preserving payment relay

### Circle Developer Grants
- **Focus**: USDC adoption in emerging markets
- **Key Points**: Financial inclusion, practical use cases
- **Demo**: Complete fiat-to-USDC-to-fiat cycle

---

**Built with ❤️ for Kenya's financial future** 