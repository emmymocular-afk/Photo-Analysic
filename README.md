# Photo-Analysic

An AI-powered photo analysis application built with TypeScript that leverages Google's Gemini API to intelligently analyze and extract insights from images.

**📚 Documentation Available In:**
- 🇬🇧 [English](./README.md)
- 🇻🇳 [Tiếng Việt](./README.vi.md)

---

<div align="center">
  <img width="1200" height="475" alt="Photo-Analysic Banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

---

## 📋 Table of Contents

- [Features](#features)
- [Benefits](#benefits)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [License](#license)

---

## ✨ Features

- **AI-Powered Photo Analysis**: Utilizes Google's Gemini API for advanced image understanding
- **Intelligent Insights**: Extract text, objects, scenes, and detailed information from photos
- **TypeScript Support**: Built with TypeScript for type safety and better developer experience
- **Easy to Use**: Simple API and straightforward setup process
- **Local Development**: Run and test your AI-powered app locally with hot-reload support

---

## 🎯 Benefits

### For Users
- **Time Saving**: Automatically analyze photos without manual inspection
- **Accurate Information Extraction**: AI-powered extraction of text, objects, and scene details
- **Accessibility**: Make photo content searchable and accessible
- **Versatile Use Cases**: 
  - Document digitization
  - Product catalog analysis
  - Visual content moderation
  - Automated photo tagging and organization

### For Developers
- **Easy Integration**: Simple setup with Gemini API
- **Scalable Architecture**: Built with modern TypeScript standards
- **Flexible Deployment**: Can be deployed locally or to cloud platforms
- **Well-Documented**: Clear instructions for setup and usage
- **Active Development**: Based on Google's AI Studio platform

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher recommended)
- **npm** or **yarn** package manager
- **Gemini API Key** from Google (get it at [ai.google.dev](https://ai.google.dev))

---

## 🚀 Installation

Follow these steps to set up Photo-Analysic locally:

### 1. Clone the Repository

```bash
git clone https://github.com/emmymocular-afk/Photo-Analysic.git
cd Photo-Analysic
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

**How to get your Gemini API Key:**
1. Visit [ai.google.dev](https://ai.google.dev)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and paste it into `.env.local`

---

## 🔧 Usage

### Running the Application

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at `http://localhost:3000` (or your configured port).

### Basic Workflow

1. **Start the app** using `npm run dev`
2. **Upload or provide a photo** to the application
3. **Wait for AI analysis** - Gemini API processes the image
4. **View results** - Get detailed insights about your photo including:
   - Text content (OCR)
   - Objects and items detected
   - Scene description
   - Any other relevant metadata

### Example API Integration

```typescript
// Example of how to use the photo analysis API
const analyzePhoto = async (photoPath: string) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ imageUrl: photoPath })
  });
  
  const result = await response.json();
  return result.analysis;
};
```

---

## 📱 Viewing Your App

You can also view your app directly in Google AI Studio:
[https://ai.studio/apps/8b03a2a7-3a74-4995-b6b3-6a0bfbfea410](https://ai.studio/apps/8b03a2a7-3a74-4995-b6b3-6a0bfbfea410)

---

## 📚 Additional Commands

```bash
# Build for production
npm run build

# Run production build
npm run start

# Run tests (if available)
npm test

# Format code
npm run lint
```

---

## 🛠️ Troubleshooting

### API Key Issues
- Ensure `GEMINI_API_KEY` is correctly set in `.env.local`
- Check that your API key has appropriate permissions
- Verify the key hasn't expired

### Port Already in Use
If port 3000 is already in use, the dev server will use the next available port (3001, 3002, etc.)

### Dependencies Installation
If you encounter installation issues, try:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs and issues
- Suggest new features
- Submit pull requests

---

## 📞 Support

For questions, issues, or support:
- Check the [GitHub Issues](https://github.com/emmymocular-afk/Photo-Analysic/issues)
- Visit [Google AI Documentation](https://ai.google.dev/docs)
- Explore [Gemini API Guide](https://ai.google.dev/docs/gemini)

---

## 🎓 Learn More

- [Gemini API Documentation](https://ai.google.dev/docs/gemini)
- [Google AI Studio](https://ai.studio)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Happy Analyzing! 📸✨**
