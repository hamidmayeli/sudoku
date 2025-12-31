# React TypeScript Project Instructions

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Naming Conventions](#naming-conventions)
- [Component Guidelines](#component-guidelines)
- [TypeScript Best Practices](#typescript-best-practices)
- [State Management](#state-management)
- [Styling Guidelines](#styling-guidelines)
- [Code Quality](#code-quality)

---

## 🎯 Project Overview

This project is built with React 18+ and TypeScript, following modern best practices for maintainability, scalability, and code readability.

### Tech Stack
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool (recommended) or Create React App
- **ESLint** - Code linting

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- VS Code (recommended editor)

### Installation
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build
# Run tests
pnpm test
```

---

## 📁 Project Structure

```
src/
├── assets/              # Static files (images, fonts, etc.)
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Button, Input, etc.)
│   └── features/       # Feature-specific components
├── hooks/              # Custom React hooks
├── services/           # API calls and external services
├── types/              # TypeScript type definitions
├── utils/              # Helper functions and utilities
├── constants/          # App-wide constants
├── pages/              # Page components (if using routing)
├── context/            # React Context providers
├── styles/             # Global styles and theme
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

### Directory Details

**`components/`**
- Organize by feature or domain
- Each component should have its own folder
- Include component file, styles, tests, and types

Example:
```
components/
└── UserProfile/
    ├── UserProfile.tsx
    ├── UserProfile.module.css
    ├── UserProfile.test.tsx
    └── UserProfile.types.ts
```

**`hooks/`**
- Custom hooks start with "use"
- One hook per file
- Include tests for complex logic

**`services/`**
- API integration logic
- Separate concerns (auth, data fetching, etc.)

**`types/`**
- Shared TypeScript interfaces and types
- Domain models and DTOs

---

## 🏷️ Naming Conventions

### Files
- **Components**: PascalCase - `UserProfile.tsx`
- **Hooks**: camelCase - `useAuth.ts`
- **Utils**: camelCase - `formatDate.ts`
- **Types**: PascalCase - `User.types.ts`
- **Constants**: UPPER_SNAKE_CASE file - `API_ENDPOINTS.ts`

### Code
- **Components**: PascalCase - `UserProfile`
- **Functions**: camelCase - `handleSubmit`
- **Variables**: camelCase - `userData`
- **Constants**: UPPER_SNAKE_CASE - `MAX_RETRY_COUNT`
- **Interfaces**: PascalCase with "I" prefix (optional) - `IUser` or `User`
- **Types**: PascalCase - `UserRole`
- **Enums**: PascalCase - `Status`

---

## 🧩 Component Guidelines

### Functional Components
Always use functional components with TypeScript:

```tsx
import React from 'react';

interface UserCardProps {
  name: string;
  age: number;
  email?: string;
  onEdit: (id: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  name, 
  age, 
  email,
  onEdit 
}) => {
  return (
    <div className="user-card">
      <h2>{name}</h2>
      <p>Age: {age}</p>
      {email && <p>Email: {email}</p>}
      <button onClick={() => onEdit(name)}>Edit</button>
    </div>
  );
};
```

### Component Best Practices

1. **Single Responsibility**: Each component should do one thing well
2. **Props Interface**: Always define TypeScript interfaces for props
3. **Default Props**: Use default parameters instead of `defaultProps`
4. **Prop Drilling**: Avoid deep prop drilling - use Context or state management
5. **Composition**: Prefer composition over inheritance

### Component Size
- Keep components under 200 lines
- Extract complex logic into custom hooks
- Split large components into smaller sub-components

### Export Pattern
```tsx
// ✅ Named export (preferred for components)
export const Button: React.FC<ButtonProps> = (props) => { ... };

// ✅ Default export (acceptable for page components)
const HomePage: React.FC = () => { ... };
export default HomePage;
```

---

## 📘 TypeScript Best Practices

### Type Definitions

```tsx
// ✅ Use interfaces for objects
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Use type for unions, intersections, primitives
type Status = 'pending' | 'approved' | 'rejected';
type UserWithStatus = User & { status: Status };

// ✅ Use enums for fixed sets of values
enum UserRole {
  Admin = 'ADMIN',
  User = 'USER',
  Guest = 'GUEST'
}
```

### Avoid `any`
```tsx
// ❌ Bad
const handleData = (data: any) => { ... };

// ✅ Good
const handleData = (data: unknown) => {
  if (typeof data === 'string') {
    // Type narrowing
  }
};

// ✅ Better - explicit type
interface DataResponse {
  id: number;
  message: string;
}

const handleData = (data: DataResponse) => { ... };
```

### Generic Components
```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

### Type Event Handlers
```tsx
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log('Clicked');
};
```

---

## 🔄 State Management

### Local State (useState)
Use for component-specific state:

```tsx
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);
const [isLoading, setIsLoading] = useState(false);
```

### Complex State (useReducer)
Use for related state updates:

```tsx
interface State {
  count: number;
  step: number;
}

type Action = 
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setStep'; payload: number };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'setStep':
      return { ...state, step: action.payload };
    default:
      return state;
  }
};
```

### Global State (Context)
Use for app-wide state:

```tsx
interface AuthContextType {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### State Management Libraries
- Context API

---

## 🎨 Styling Guidelines

### CSS (Recommended)
Use tailwind CSS for component-scoped styles

```tsx

### Styling Options
1. **Tailwind CSS** - Utility-first, rapid development
2. **SASS/SCSS** - Advanced CSS features
3. All elements should support dark mode

### Best Practices
- Use consistent spacing units (4px, 8px, 16px, etc.)
- Keep styles close to components

---

## ✨ Code Quality

### ESLint Configuration
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off"
  }
}
```

### Code Review Checklist
- [ ] TypeScript types are defined (no `any`)
- [ ] Components are small and focused
- [ ] Props interfaces are documented
- [ ] No console.logs in production code
- [ ] Error handling is implemented
- [ ] Loading states are handled
- [ ] Accessibility attributes are added
- [ ] Tests are written for new features
- [ ] Code is formatted with Prettier

### Performance Tips
1. Use `React.memo()` for expensive components
2. Use `useMemo()` for expensive calculations
3. Use `useCallback()` for callback stability
4. Lazy load routes and heavy components
5. Optimize images and assets
6. Use production builds for deployment

---

## 📝 Additional Best Practices

### Error Boundaries
```tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

### Environment Variables
```tsx
// Use VITE_ prefix for Vite projects
const API_URL = import.meta.env.VITE_API_URL;
```

### Accessibility
- Use semantic HTML elements
- Add `aria-*` attributes when needed
- Ensure keyboard navigation works
- Maintain proper heading hierarchy
- Provide alt text for images
- Test with screen readers

---

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app)
- [Testing Library](https://testing-library.com/react)

---

## 📞 Getting Help

- Check existing documentation first
- Ask team members for guidance
- Refer to official documentation
- Search for similar issues in the codebase

---

**Last Updated**: December 31, 2025
