# Contributing to Interview Assistant

Thank you for your interest in contributing! Here's how you can help.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch: `git checkout -b feature/your-feature`
4. **Make** your changes
5. **Commit** with clear messages: `git commit -m 'Add feature description'`
6. **Push** to your fork: `git push origin feature/your-feature`
7. **Open** a Pull Request

## Development Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Code Style

- Use **TypeScript** for new code
- Follow **ESLint** configuration
- Use **Prettier** for formatting
- Write **meaningful commit messages**

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** feat, fix, docs, style, refactor, test, chore
**Example:** `feat(auth): Add two-factor authentication`

## Pull Request Process

1. Update documentation if needed
2. Write/update tests if applicable
3. Ensure all tests pass
4. Request review from maintainers
5. Address review comments

## Reporting Issues

- Check existing issues first
- Use clear, descriptive titles
- Include steps to reproduce
- Attach screenshots/logs if relevant

## Questions?

- Open a discussion in Issues
- Join our community chat (if available)
- Email maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you! 🎉
