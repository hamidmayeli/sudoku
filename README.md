# Sudoku Game

A modern, feature-rich Sudoku game built with React, TypeScript, and Vite. Play Sudoku with multiple themes, difficulty levels, and helpful features like notes and hints.

## ✨ Features

### Core Gameplay
- **Three Difficulty Levels**: Easy, Medium, and Hard puzzles
- **Smart Validation**: Option to highlight incorrect entries in real-time
- **Notes Mode**: Add candidate numbers to cells to help solve puzzles
- **Hint System**: Get help when stuck with the hint button
- **Keyboard Navigation**: Full keyboard support (1-9 for numbers, arrows to navigate, backspace to clear)
- **On-Screen Keypad**: Mobile-friendly numeric keypad for easy input

### User Experience
- **2 Beautiful Themes**: Switch between Classic Dark, Light themes
- **Local Storage**: Auto-saves your progress - continue your game anytime
- **Progressive Web App (PWA)**: Install on your device and play offline
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Clean UI**: Intuitive interface with collapsible controls

### Technical Features
- **Valid Puzzle Generation**: Uses backtracking algorithm to ensure unique solutions
- **Real-time Validation**: Instant feedback on incorrect entries
- **Efficient State Management**: React hooks with TypeScript for type safety
- **Service Worker**: Offline functionality through PWA support

## 🚀 Getting Started

### Prerequisites
- Node.js 19
- pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd sudoku

# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

The app will be available at `http://localhost:5173/`

## 🎮 How to Play

1. **Start a Game**: Choose a difficulty level from the start screen
2. **Select a Cell**: Click on any empty cell to select it
3. **Enter Numbers**: 
   - Use keyboard (1-9) or click the on-screen keypad
   - Press Backspace/Delete or click "Clear" to remove a number
4. **Use Notes Mode**: Enable notes mode to add candidate numbers (multiple per cell)
5. **Get Hints**: Click the hint button to reveal a correct number
6. **Check Progress**: Enable "Show Incorrect" to highlight wrong entries

### Keyboard Shortcuts
- **1-9**: Enter number in selected cell
- **Arrow Keys**: Navigate between cells
- **Backspace/Delete**: Clear selected cell
- **Notes Mode**: Toggle to add multiple candidate numbers

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Board.tsx       # 9x9 Sudoku grid
│   ├── Cell.tsx        # Individual cell with notes
│   ├── Controls.tsx    # Game controls and settings
│   ├── Game.tsx        # Main game logic and state
│   ├── Keypad.tsx      # On-screen numeric keypad
│   └── StartPage.tsx   # Difficulty selection screen
├── hooks/              # Custom React hooks
│   └── useTheme.ts     # Theme management hook
├── types/              # TypeScript type definitions
│   └── sudoku.types.ts # Game state and board types
├── utils/              # Helper functions
│   └── sudoku.ts       # Puzzle generation and validation
├── App.tsx             # Root component
├── App.css             # Global styles and themes
└── main.tsx            # Entry point

public/
├── pwa-192x192.png     # PWA icon (192x192)
├── pwa-512x512.png     # PWA icon (512x512)
└── pwa-512x512.svg     # Vector icon
```

## 🛠️ Tech Stack

- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Vite 7** - Build tool and dev server
- **CSS Variables** - Dynamic theming
- **Vite PWA Plugin** - Progressive Web App support
- **ESLint** - Code quality and consistency

## 🎯 Key Algorithms

### Puzzle Generation
- Uses backtracking algorithm to generate valid Sudoku puzzles
- Ensures unique solutions for all puzzles
- Removes cells based on difficulty (35 for easy, 45 for medium, 55 for hard)

### Validation
- Real-time validation checks rows, columns, and 3x3 boxes
- Highlights incorrect entries when "Show Incorrect" is enabled
- Detects puzzle completion automatically

## 📱 PWA Features

The game works as a Progressive Web App:
- **Install on Device**: Add to home screen on mobile or desktop
- **Offline Play**: Works without internet connection
- **Auto-Updates**: Automatically updates when new versions are available
- **Native Feel**: Runs like a native app when installed

## 🎮 Game Features in Detail

### Notes Mode
- Add multiple candidate numbers (1-9) to any cell
- Notes appear in a smaller 3x3 grid within the cell
- Automatically cleared when a number is entered
- Helps track possible values for complex puzzles

### Hint System
- Reveals one random correct number from empty cells
- Uses the puzzle's solution to ensure accuracy
- Great for learning or when stuck

### Auto-Save
- Game state saved to browser's local storage
- Preserves board, difficulty, notes, and settings
- Resume your game anytime, even after closing the browser

## 🔧 Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
```

### Code Quality
- TypeScript strict mode enabled
- ESLint configured with React and TypeScript rules
- Component-based architecture for maintainability
- Custom hooks for reusable logic

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 🙏 Acknowledgments

- Built with React, TypeScript, and Vite
- Icons and styling inspired by modern design principles
- Puzzle generation algorithm based on backtracking technique

---

**Enjoy playing Sudoku! 🎉**
