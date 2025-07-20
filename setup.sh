#!/bin/bash

echo "🚀 Setting up IntelliMark Mobile App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install Expo CLI globally if not installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI..."
    npm install -g @expo/cli
fi

echo "📦 Installing mobile app dependencies..."
npm install

# Check if backend directory exists
if [ -d "backend" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
else
    echo "⚠️  Backend directory not found. Backend setup skipped."
fi

echo "✅ Setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Configure your API endpoint in services/api.ts"
echo "2. Set up your backend server (see backend/README.md)"
echo "3. Run 'npm start' to start the mobile app"
echo "4. Run 'npm run ios' or 'npm run android' to test on simulators"
echo ""
echo "📖 For more information, check the README.md file"