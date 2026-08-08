# AgentShield — Autonomous AI Agent Security Suite

AgentShield is an autonomous AI red-teaming, adversarial evaluation, and security hardening platform for AI agents.

---

## 🌟 Key Features

1. **Dual Target Agent Modes**
   - **Demo Agent Mode**: Built-in vulnerable/hardened agent simulator for safe hackathon testing and visual posture comparison.
   - **Live Agent Mode**: Real HTTP API testing engine capable of sending adversarial payloads directly to external AI agent endpoints (`POST /api/chat`) and capturing real responses.

2. **AI-Powered Red Teaming & Evaluation**
   - **AI Attack Generator**: Uses Gemini API (`GEMINI_API_KEY`) to synthesize novel adversarial attack vectors across categories like Prompt Injection, Jailbreak, Data Leakage, and Unsafe Tool Use, with deterministic fallbacks.
   - **AI Security Judge**: Uses LLM-as-a-Judge for semantic analysis of target agent responses to detect subtle security bypasses.

3. **Autonomous Execution Pipeline**
   - Single-click audit flow executing target discovery, attack generation, real HTTP execution, evaluation, evidence collection, risk scoring, and fix recommendation.

---

## 🚀 Getting Started

### 1. Install & Build
```bash
npm install
npm run build
```

### 2. Run Application
```bash
npm run start
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser.

---

## 🌐 Target Configurations

### Demo Mode
Runs adversarial tests against the local built-in demo agent. Supports single-click **HARDEN AGENT** to demonstrate before/after posture score improvements (e.g. 5/100 → 100/100).

### Live Mode
Configure your external agent API:
- **Endpoint URL**: `https://your-agent-service.com/api/chat`
- **HTTP Method**: `POST`
- **Prompt Field Key**: `message` (or custom field key)
- **Bearer Token**: Optional authorization key (kept secure and masked in UI)
