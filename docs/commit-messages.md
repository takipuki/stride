# Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for our commit messages. This helps in generating changelogs and understanding the project history.

## Format

```text
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Rules

1. **Imperative mood**: Use "add" instead of "added" or "adds".
2. **No period**: Do not end the description with a period.
3. **Lowercase**: The description should usually start with a lowercase letter.
4. **Concise**: Keep the first line under 72 characters.

## Examples

- `feat(auth): add login functionality`
- `fix(ui): resolve button misalignment on mobile`
- `docs: update readme with installation steps`
- `chore: update dependencies`
- `refactor: simplify database connection logic`
