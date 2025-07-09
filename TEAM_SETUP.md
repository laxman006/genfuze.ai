# 🚀 Team Setup Guide - Genfuze.ai

## Quick Start for New Team Members

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/genfuze-ai.git
cd genfuze-ai
```

### 2. One Command Setup
```bash
# Install all dependencies and start both apps
npm run setup
npm run dev
```

### 3. Access Your Applications
- **Landing Page**: http://localhost:8080
- **Autobrowser App**: http://localhost:5174/CloudFuzeLLMQA

## 🛠️ Available Commands

```bash
npm run dev              # Start both applications
npm run dev:landing      # Start only landing page
npm run dev:autobrowser  # Start only autobrowser app
npm run build            # Build both applications
npm run setup            # Install all dependencies
npm run clean            # Clean all node_modules
npm run reset            # Clean and reinstall everything
```

## 📁 Project Structure

```
genfuze.ai/
├── content-genesis-optimizer-main/    # Landing page
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── auto_browser/project/              # Autobrowser application
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── package.json                       # Root package.json
└── README.md                         # Complete documentation
```

## 🔧 Development Workflow

### For Landing Page Changes
```bash
cd content-genesis-optimizer-main
npm run dev
# Make changes in src/
# Test at http://localhost:8080
```

### For Autobrowser App Changes
```bash
cd auto_browser/project
npm run dev
# Make changes in src/
# Test at http://localhost:5174/CloudFuzeLLMQA
```

### For Both Applications
```bash
npm run dev
# Both apps run simultaneously
```

## 🐛 Common Issues & Solutions

### Port Conflicts
```bash
# Check what's using the ports
netstat -ano | findstr :8080
netstat -ano | findstr :5174
```

### Dependencies Issues
```bash
npm run reset
```

### Node Modules Issues
```bash
npm run clean
npm run setup
```

## 📝 Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test

# Commit changes
git add .
git commit -m "feat: add your feature description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
```

## 🔒 Environment Variables

Create `.env` file in `content-genesis-optimizer-main/`:
```bash
VITE_AUTOBROWSER_URL=http://localhost:5174/CloudFuzeLLMQA
```

## 📞 Need Help?

- Check the main README.md for detailed documentation
- Create an issue on GitHub
- Contact the team lead

## ✅ Setup Checklist

- [ ] Repository cloned
- [ ] Dependencies installed (`npm run setup`)
- [ ] Both apps running (`npm run dev`)
- [ ] Landing page accessible at http://localhost:8080
- [ ] Autobrowser app accessible at http://localhost:5174/CloudFuzeLLMQA
- [ ] Environment variables configured
- [ ] Git workflow understood

## 🎯 Ready to Code!

You're all set! Start developing and contributing to the Genfuze.ai project. 