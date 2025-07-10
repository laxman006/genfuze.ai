# Genfuze.ai - Complete Q&A Generation Platform

A modern, full-stack application for generating questions and answers from content using AI. Features a beautiful green/black theme with glassmorphism design.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### 1. Landing Page (Port 5173)
```bash
cd content-genesis-optimizer-main
npm install
npm run dev
```
Visit: http://localhost:5173

### 2. Main Application (Port 5174)
```bash
cd auto_browser/project
npm install
npm run dev
```
Visit: http://localhost:5174

### 3. Backend Server (Port 5000)
```bash
cd auto_browser/project/backend
npm install
npm start
```
API: http://localhost:5000

## 🎨 Features

### Landing Page
- **Modern Design**: Clean green/black theme with glassmorphism effects
- **Responsive**: Works on all devices
- **Call-to-Action**: Direct navigation to main app
- **Professional**: Matches marketing site aesthetics

### Main Application
- **Authentication**: Local login/register system
- **Q&A Generation**: AI-powered question and answer creation
- **Session Management**: Save and load different sessions
- **History**: View and export Q&A history
- **Statistics**: Performance and cost analytics
- **Cost Breakdown**: Detailed cost tracking

### Backend
- **RESTful API**: Complete backend services
- **Local Authentication**: User management system
- **LLM Integration**: Support for multiple AI providers
- **Data Persistence**: Session and user data storage

## 🎯 User Flow

1. **Landing Page** → Visit the beautiful landing page
2. **Sign Up/Login** → Create account or sign in
3. **Dashboard** → Access the main Q&A generation interface
4. **Generate Q&A** → Input content and generate questions/answers
5. **Manage Sessions** → Save, load, and organize your work
6. **View History** → Review past generations
7. **Analytics** → Check statistics and costs

## 🛠️ Technology Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Vite** for build tooling

### Backend
- **Node.js** with Express
- **JWT** for authentication
- **JSON** file storage
- **CORS** enabled

### AI Integration
- **Gemini** (Google)
- **OpenAI** (ChatGPT)
- **Perplexity**
- **Google Serper** (Search)

## 🎨 Design System

### Color Palette
- **Primary Green**: `#00ff88` (genfuze-green)
- **Background**: Black and dark grays
- **Accents**: Green gradients and glows
- **Text**: White and light grays

### Components
- **Glassmorphism**: Translucent cards with blur effects
- **Gradients**: Green to green-400 transitions
- **Animations**: Smooth hover and focus states
- **Responsive**: Mobile-first design

## 📁 Project Structure

```
genfuze.ai/
├── content-genesis-optimizer-main/    # Landing page
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.tsx
│   └── package.json
├── auto_browser/project/              # Main application
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.tsx
│   ├── backend/                       # Backend server
│   │   ├── server.js
│   │   ├── auth.js
│   │   └── package.json
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=5000
AUTH_TYPE=local
ENABLE_LOCAL_AUTH=true
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

#### Frontend (.env)
```env
VITE_REACT_APP_API_URL=http://localhost:5000/api
VITE_APP_NAME=Genfuze.ai
```

## 🚀 Deployment

### Development
1. Start all three services (landing, main app, backend)
2. Ensure ports 5173, 5174, and 5000 are available
3. Visit http://localhost:5173 to start

### Production
- Deploy backend to your preferred hosting service
- Deploy frontend applications to Vercel, Netlify, or similar
- Update environment variables for production URLs

## 🎯 Key Features

### Authentication
- Local user registration and login
- JWT token-based authentication
- Secure password hashing
- Session management

### Q&A Generation
- Multiple AI provider support
- Configurable models and parameters
- Real-time generation with progress indicators
- Cost tracking and optimization

### Data Management
- Session persistence
- Export functionality (CSV)
- History tracking
- Statistics and analytics

### User Experience
- Modern, responsive design
- Intuitive navigation
- Real-time feedback
- Error handling

## 🔒 Security

- JWT token authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation
- Rate limiting (configurable)

## 📊 Analytics

- Question generation statistics
- Cost tracking and breakdown
- Performance metrics
- Usage analytics

## 🎨 Customization

The application uses a consistent design system that can be easily customized:

- **Colors**: Update Tailwind config for new color schemes
- **Components**: Modular component architecture
- **Themes**: Easy theme switching capability
- **Branding**: Replace logos and branding elements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software for Genfuze.ai.

---

**Ready to generate amazing Q&A content? Start with the landing page at http://localhost:5173!** 