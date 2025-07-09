# Genfuze.ai - Complete Application

This repository contains both the landing page and the autobrowser application for Genfuze.ai.

## 🚀 Quick Start for Team Members

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### One Command Setup
```bash
# Clone the repository
git clone https://github.com/your-org/genfuze-ai.git
cd genfuze-ai

# Install all dependencies and start both apps
npm run setup
npm run dev
```

### Application URLs
- **Landing Page**: http://localhost:8080
- **Autobrowser App**: http://localhost:5174/CloudFuzeLLMQA

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
└── README.md                         # This file
```

## 🛠️ Available Scripts

### Root Level Commands
```bash
npm run dev              # Start both applications
npm run dev:landing      # Start only landing page
npm run dev:autobrowser  # Start only autobrowser app
npm run build            # Build both applications
npm run setup            # Install all dependencies
npm run clean            # Clean all node_modules and dist
npm run reset            # Clean and reinstall everything
```

### Individual Application Commands
```bash
# Landing Page
cd content-genesis-optimizer-main
npm run dev              # Development server
npm run build            # Production build

# Autobrowser App
cd auto_browser/project
npm run dev              # Development server
npm run build            # Production build
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
# Landing: http://localhost:8080
# Autobrowser: http://localhost:5174/CloudFuzeLLMQA
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in `content-genesis-optimizer-main/`:
```bash
# For local development
VITE_AUTOBROWSER_URL=http://localhost:5174/CloudFuzeLLMQA

# For production
VITE_AUTOBROWSER_URL=https://app.genfuze.ai
```

## 🚀 Deployment

### Landing Page
- Deploy `content-genesis-optimizer-main/` to your hosting platform
- Set `VITE_AUTOBROWSER_URL` to your production autobrowser URL

### Autobrowser App
- Deploy `auto_browser/project/` to your hosting platform
- Ensure the base path is `/CloudFuzeLLMQA`

## 👥 Team Collaboration

### Git Workflow
```bash
# Create a new feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Test your changes

# Commit your changes
git add .
git commit -m "feat: add your feature description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
# Merge after review
```

### Branch Naming Convention
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding tests

### Commit Message Convention
```
type(scope): description

Examples:
feat(landing): add new hero section
fix(autobrowser): resolve login redirect issue
docs: update README with new setup instructions
```

## 🐛 Troubleshooting

### Port Conflicts
If you get port conflicts:
```bash
# Check what's using the ports
netstat -ano | findstr :8080
netstat -ano | findstr :5174

# Kill the process or change ports in vite.config.ts
```

### Dependencies Issues
```bash
# Clean install
npm run reset
```

### Concurrently Issues
```bash
npm install -g concurrently
npm run dev
```

### Node Modules Issues
```bash
# Remove all node_modules
npm run clean

# Reinstall
npm run setup
```

## 📝 Development Notes

- Landing page runs on port 8080
- Autobrowser app runs on port 5174
- Both apps use Vite for development
- Landing page redirects to autobrowser app on button clicks
- Use TypeScript for type safety
- Follow ESLint rules for code consistency

## 🔒 Security Notes

- Never commit `.env` files
- Keep API keys secure
- Use environment variables for sensitive data
- Review dependencies regularly

## 📊 Performance

### Landing Page Optimization
- Image optimization
- Lazy loading
- Code splitting
- CDN usage

### Autobrowser App Optimization
- Bundle optimization
- Service worker caching
- Progressive web app features

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For questions or issues:
- Create an issue on GitHub
- Contact the team lead
- Check the documentation

## 📄 License

This project is licensed under the MIT License. 