# Contributing to Finding Sports

🎉 First off, thanks for taking the time to contribute! 🎉

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed**
- **Explain which behavior you expected to see**
- **Include screenshots if possible**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain the expected behavior**
- **Explain why this enhancement would be useful**

### Your First Code Contribution

Unsure where to begin? You can start by looking through these issues:

- Issues labeled `good first issue`
- Issues labeled `help wanted`

## Development Setup

1. Fork the repo and create your branch from `main`
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/findingsports.com.git
   cd findingsports.com
   ```

3. Set up the development environment:
   ```bash
   # Using Docker (recommended)
   docker-compose up
   
   # Or manually
   cargo build
   cd mockup && python3 -m http.server 3000
   ```

4. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```

## Pull Request Process

1. Ensure any install or build dependencies are removed
2. Update the README.md with details of changes if needed
3. Increase version numbers if applicable
4. Ensure all tests pass:
   ```bash
   cargo test
   ./security-audit.sh
   ```
5. Make sure your code follows the style guidelines:
   ```bash
   cargo fmt
   cargo clippy
   ```
6. Submit the pull request!

## Style Guidelines

### Rust Code Style

- Use `cargo fmt` to format your code
- Use `cargo clippy` to catch common mistakes
- Follow Rust naming conventions:
  - `snake_case` for functions and variables
  - `PascalCase` for types
  - `SCREAMING_SNAKE_CASE` for constants

### JavaScript Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Add trailing commas in objects and arrays

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Use conventional commits format:

```
feat: Add user authentication
fix: Resolve game search bug
docs: Update API documentation
style: Format code with prettier
refactor: Restructure venue service
test: Add tests for game joining
chore: Update dependencies
```

## Project Structure

```
findingsports.com/
├── mockup/                    # Frontend application
│   ├── index.html            # Main app page
│   ├── login.html            # Authentication page
│   ├── css/                  # Stylesheets
│   └── js/                   # JavaScript files
├── mockup/finding-sports-backend/  # Rust backend
│   ├── src/                  # Source code
│   ├── migrations/           # Database migrations
│   └── Cargo.toml           # Rust dependencies
├── .github/                  # GitHub Actions workflows
└── docs/                     # Documentation

```

## Testing

- Write tests for any new functionality
- Ensure all tests pass before submitting PR
- Aim for high test coverage
- Test both happy paths and edge cases

### Running Tests

```bash
# Backend tests
cd mockup/finding-sports-backend
cargo test

# Security audit
./security-audit.sh

# Performance tests (if applicable)
k6 run performance-test.js
```

## Questions?

Feel free to open an issue with your question or reach out to the maintainers!

Thank you for contributing to Finding Sports! 🏀⚽🏐