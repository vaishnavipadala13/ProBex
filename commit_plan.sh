#!/bin/bash
set -e
cd "c:/Users/prems/OneDrive/Desktop/ProBex/ProBex"

commit_file() {
    local file="$1"
    local msg="$2"
    git add "$file"
    git commit -m "$msg"
}

echo "=== Starting individual commits ==="

# 1. README
commit_file "README.md" "docs: add comprehensive project README with architecture and usage guide"

# 2. Root config
commit_file "AGENTS.md" "docs: add AI agent instructions for Algorand development workflow"
commit_file ".vscode/mcp.json" "config: add MCP server configuration for Kappa and VibeKit"

# 3. AlgoKit workspace config
commit_file "ProBex/.algokit.toml" "config: add AlgoKit workspace configuration"
commit_file "ProBex/.algokit/.copier-answers.yml" "config: add Copier template answers for workspace generation"
commit_file "ProBex/.algokit/generators/create-devcontainer/copier.yaml" "config: add devcontainer generator template"
commit_file "ProBex/.algokit/generators/create-devcontainer/devcontainer.json" "config: add devcontainer JSON specification"
commit_file "ProBex/.editorconfig" "config: add editor configuration for consistent formatting"
commit_file "ProBex/.gitattributes" "config: add git attributes for line ending normalization"
commit_file "ProBex/.gitignore" "config: add gitignore rules for AlgoKit workspace"
commit_file "ProBex/.vscode/launch.json" "config: add VS Code launch configuration for debugging"
commit_file "ProBex/.vscode/settings.json" "config: add VS Code workspace settings"
commit_file "ProBex/ProBex.code-workspace" "config: add VS Code multi-root workspace definition"
commit_file "ProBex/README.md" "docs: add AlgoKit workspace README"
commit_file "ProBex/projects/.gitkeep" "chore: add gitkeep for projects directory"

# 4. Smart contracts project config
commit_file "ProBex/projects/ProBex-contracts/.algokit.toml" "config: add AlgoKit config for smart contract project"
commit_file "ProBex/projects/ProBex-contracts/.algokit/.copier-answers.yml" "config: add Copier answers for contract project scaffolding"
commit_file "ProBex/projects/ProBex-contracts/.algokit/generators/create_contract/copier.yaml" "config: add contract generator template configuration"

git add "ProBex/projects/ProBex-contracts/.algokit/generators/create_contract/smart_contracts/"
git commit -m "config: add contract and deploy config Jinja2 templates"

commit_file "ProBex/projects/ProBex-contracts/.algokit/generators/create_env_file/copier.yaml" "config: add environment file generator template"

git add "ProBex/projects/ProBex-contracts/.algokit/generators/create_env_file/"
git commit -m "config: add environment file templates for localnet, testnet, and mainnet"

commit_file "ProBex/projects/ProBex-contracts/.editorconfig" "config: add editor config for contract project"
commit_file "ProBex/projects/ProBex-contracts/.gitignore" "config: add gitignore for Python contract project"
commit_file "ProBex/projects/ProBex-contracts/.tours/getting-started-with-your-algokit-project.tour" "docs: add getting started CodeTour for contract project"
commit_file "ProBex/projects/ProBex-contracts/.vscode/extensions.json" "config: add recommended VS Code extensions for contract development"
commit_file "ProBex/projects/ProBex-contracts/.vscode/launch.json" "config: add VS Code launch config for contract debugging"
commit_file "ProBex/projects/ProBex-contracts/.vscode/settings.json" "config: add VS Code settings for Python contract project"
commit_file "ProBex/projects/ProBex-contracts/.vscode/tasks.json" "config: add VS Code tasks for build and deploy commands"
commit_file "ProBex/projects/ProBex-contracts/README.md" "docs: add smart contract project README with setup instructions"
commit_file "ProBex/projects/ProBex-contracts/poetry.toml" "config: add Poetry configuration for in-project virtualenv"
commit_file "ProBex/projects/ProBex-contracts/pyproject.toml" "build: add Python project dependencies and build system config"
commit_file "ProBex/projects/ProBex-contracts/poetry.lock" "build: add Poetry lockfile for reproducible dependency installs"

# 5. Smart contract core source code
commit_file "ProBex/projects/ProBex-contracts/smart_contracts/__init__.py" "feat: initialize smart_contracts Python package"
commit_file "ProBex/projects/ProBex-contracts/smart_contracts/__main__.py" "feat: add build and deploy orchestrator for smart contracts"
commit_file "ProBex/projects/ProBex-contracts/smart_contracts/probex_contract/contract.py" "feat: implement ProbexContract parimutuel prediction market"
commit_file "ProBex/projects/ProBex-contracts/smart_contracts/probex_contract/deploy_config.py" "feat: add deployment configuration for ProbexContract"

# 6. Compiled artifacts
commit_file "ProBex/projects/ProBex-contracts/smart_contracts/artifacts/probex_contract/ProbexContract.approval.teal" "build: add compiled TEAL approval program (AVM v11)"
commit_file "ProBex/projects/ProBex-contracts/smart_contracts/artifacts/probex_contract/ProbexContract.clear.teal" "build: add compiled TEAL clear-state program"
commit_file "ProBex/projects/ProBex-contracts/smart_contracts/artifacts/probex_contract/ProbexContract.arc56.json" "build: add ARC-56 application specification"
commit_file "ProBex/projects/ProBex-contracts/smart_contracts/artifacts/probex_contract/ProbexContract.approval.puya.map" "build: add Puya source map for approval program"
commit_file "ProBex/projects/ProBex-contracts/smart_contracts/artifacts/probex_contract/ProbexContract.clear.puya.map" "build: add Puya source map for clear program"
commit_file "ProBex/projects/ProBex-contracts/smart_contracts/artifacts/probex_contract/probex_contract_client.py" "build: add auto-generated typed Python client for ProbexContract"

# 7. Tests
commit_file "ProBex/projects/ProBex-contracts/tests/conftest.py" "test: add Pytest fixtures for Algorand LocalNet testing"
commit_file "ProBex/projects/ProBex-contracts/tests/test_probex_contract.py" "test: add 10 integration tests for ProbexContract lifecycle"

# 8. Frontend project config
commit_file "ProBex/projects/ProBex-frontend/.algokit.toml" "config: add AlgoKit config for frontend project"
commit_file "ProBex/projects/ProBex-frontend/.algokit/.copier-answers.yml" "config: add Copier answers for frontend project scaffolding"
commit_file "ProBex/projects/ProBex-frontend/.env.template" "config: add environment variable template for frontend"
commit_file "ProBex/projects/ProBex-frontend/.gitignore" "config: add gitignore for React frontend project"
commit_file "ProBex/projects/ProBex-frontend/.npmrc" "config: add npm configuration"
commit_file "ProBex/projects/ProBex-frontend/.vscode/extensions.json" "config: add recommended VS Code extensions for frontend"
commit_file "ProBex/projects/ProBex-frontend/.vscode/launch.json" "config: add VS Code launch config for frontend debugging"
commit_file "ProBex/projects/ProBex-frontend/.vscode/settings.json" "config: add VS Code settings for TypeScript frontend"
commit_file "ProBex/projects/ProBex-frontend/.vscode/tasks.json" "config: add VS Code tasks for frontend build commands"
commit_file "ProBex/projects/ProBex-frontend/README.md" "docs: add frontend project README"
commit_file "ProBex/projects/ProBex-frontend/tsconfig.json" "config: add TypeScript compiler configuration"
commit_file "ProBex/projects/ProBex-frontend/tsconfig.node.json" "config: add TypeScript config for Vite node context"
commit_file "ProBex/projects/ProBex-frontend/vite.config.ts" "config: add Vite build configuration with React and polyfills"
commit_file "ProBex/projects/ProBex-frontend/package.json" "build: add frontend dependencies and scripts"
commit_file "ProBex/projects/ProBex-frontend/package-lock.json" "build: add npm lockfile for reproducible frontend installs"
commit_file "ProBex/projects/ProBex-frontend/index.html" "feat: add Vite entry HTML with Google Fonts"
commit_file "ProBex/projects/ProBex-frontend/public/index.html" "feat: add fallback public HTML"
commit_file "ProBex/projects/ProBex-frontend/public/robots.txt" "config: add robots.txt for search engine crawling"

# 9. Frontend core source
commit_file "ProBex/projects/ProBex-frontend/src/main.tsx" "feat: add React entry point with ErrorBoundary wrapper"
commit_file "ProBex/projects/ProBex-frontend/src/App.tsx" "feat: add root App with BrowserRouter and WalletProvider"
commit_file "ProBex/projects/ProBex-frontend/src/vite-env.d.ts" "types: add Vite environment type declarations"
commit_file "ProBex/projects/ProBex-frontend/src/assets/logo.svg" "assets: add ProBex logo SVG"
commit_file "ProBex/projects/ProBex-frontend/src/styles/App.css" "style: add responsive stylesheet with dark/light theme support"

# 10. Frontend utilities
commit_file "ProBex/projects/ProBex-frontend/src/utils/supabase.ts" "feat: add Supabase client initialization"
commit_file "ProBex/projects/ProBex-frontend/src/utils/probexClient.ts" "feat: add Algorand client utilities for market state fetching"
commit_file "ProBex/projects/ProBex-frontend/src/utils/ellipseAddress.ts" "feat: add address truncation helper utility"
commit_file "ProBex/projects/ProBex-frontend/src/utils/network/getAlgoClientConfigs.ts" "feat: add Algorand network configuration reader"
commit_file "ProBex/projects/ProBex-frontend/src/interfaces/network.ts" "types: add network configuration TypeScript interfaces"
commit_file "ProBex/projects/ProBex-frontend/src/hooks/useAuth.ts" "feat: add Supabase authentication session hook"

# 11. Frontend contracts
commit_file "ProBex/projects/ProBex-frontend/src/contracts/ProbexContract.ts" "feat: add auto-generated ARC-56 typed contract client"
commit_file "ProBex/projects/ProBex-frontend/src/contracts/README.md" "docs: add contract integration documentation"

# 12. Frontend components
commit_file "ProBex/projects/ProBex-frontend/src/components/ErrorBoundary.tsx" "feat: add React error boundary component"
commit_file "ProBex/projects/ProBex-frontend/src/components/ConnectWallet.tsx" "feat: add Pera Wallet connection modal component"
commit_file "ProBex/projects/ProBex-frontend/src/components/NavButtons.tsx" "feat: add animated navigation buttons component"
commit_file "ProBex/projects/ProBex-frontend/src/components/Account.tsx" "feat: add wallet account display component"
commit_file "ProBex/projects/ProBex-frontend/src/components/AppCalls.tsx" "feat: add contract call scaffold component"
commit_file "ProBex/projects/ProBex-frontend/src/components/Transact.tsx" "feat: add ALGO payment transaction component"
commit_file "ProBex/projects/ProBex-frontend/src/components/MarketAnalytics.tsx" "feat: add market analytics dashboard with charts and orderbook"

# 13. Frontend pages
commit_file "ProBex/projects/ProBex-frontend/src/pages/LandingPage.tsx" "feat: add animated landing page with wallet-first connect flow"
commit_file "ProBex/projects/ProBex-frontend/src/pages/AuthPage.tsx" "feat: add authentication page with Supabase login/signup"
commit_file "ProBex/projects/ProBex-frontend/src/pages/DashboardPage.tsx" "feat: add protected dashboard with market tabs and analytics"

# 14. Main betting UI
commit_file "ProBex/projects/ProBex-frontend/src/Home.tsx" "feat: add main betting interface with 36 prediction markets"

# 15. GitHub Copilot
commit_file ".github/copilot-instructions.md" "docs: add GitHub Copilot context instructions"

# 16. GitHub skills (batched)
git add ".github/skills/algorand-typescript/" ".github/skills/algorand-ts-migration/" ".github/skills/build-smart-contracts/"
git commit -m "docs: add AlgoKit skills for TypeScript and smart contract development"

git add ".github/skills/call-smart-contracts/" ".github/skills/create-project/" ".github/skills/test-smart-contracts/"
git commit -m "docs: add AlgoKit skills for calling, creating, and testing contracts"

git add ".github/skills/deploy-react-frontend/" ".github/skills/search-algorand-examples/" ".github/skills/use-algokit-cli/"
git commit -m "docs: add AlgoKit skills for frontend deployment and CLI usage"

git add ".github/skills/implement-arc-standards/" ".github/skills/troubleshoot-errors/" ".github/skills/use-algokit-utils/"
git commit -m "docs: add AlgoKit skills for ARC standards, troubleshooting, and utils"

git add ".github/skills/create-python-x402-client/" ".github/skills/create-python-x402-facilitator/" ".github/skills/create-python-x402-facilitator-bazaar/" ".github/skills/create-python-x402-server/"
git commit -m "docs: add AlgoKit skills for Python x402 integration"

git add ".github/skills/create-typescript-x402-client/" ".github/skills/create-typescript-x402-facilitator/" ".github/skills/create-typescript-x402-nextjs/" ".github/skills/create-typescript-x402-paywall/" ".github/skills/create-typescript-x402-server/"
git commit -m "docs: add AlgoKit skills for TypeScript x402 integration"

git add ".github/skills/explain-algorand-x402-python/" ".github/skills/explain-algorand-x402-typescript/" ".github/skills/teach-algorand-x402/" ".github/skills/use-python-x402-core-avm/" ".github/skills/use-typescript-x402-core-avm/"
git commit -m "docs: add AlgoKit skills for x402 education and core AVM usage"

echo ""
echo "=== ALL COMMITS DONE ==="
git log --oneline | wc -l
echo "total commits created"
