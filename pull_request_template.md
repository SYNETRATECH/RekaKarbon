## Description

Please provide a summary of the change and which issue it fixes. Include relevant motivation and context.

Fixes #(issue)

## Type of change

Please delete options that are not relevant.

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactor (no functional change)
- [ ] Documentation update
- [ ] CI/CD or infrastructure change (workflows, k8s, ansible)

## Component affected

- [ ] Cloud Backend (`apps/cloud-backend`)
- [ ] Cloud Frontend (`apps/cloud-frontend`)
- [ ] Edge Backend (`apps/edge-backend`)
- [ ] Edge Frontend (`apps/edge-frontend`)
- [ ] Device Simulator (`apps/device-simulator`)
- [ ] Database migrations (`database/`, Alembic, TypeORM)
- [ ] Kubernetes manifests (`k8s/`)
- [ ] Ansible provisioning (`ansible/`)
- [ ] CI/CD workflows (`.github/workflows/`)
- [ ] Documentation

## How Has This Been Tested?

Please describe the tests that you ran to verify your changes. Provide instructions so we can reproduce.

- [ ] `make lint` passes
- [ ] `make test` (or the relevant `make test-edge` / `make test-cloud`) passes
- [ ] `make typecheck` passes (if frontend changes)
- [ ] Tested locally with Docker Compose (`make dev-edge` / `make dev-cloud`)

## Checklist

- [ ] My code follows the style guidelines of this project (see [CONTRIBUTING.md](../CONTRIBUTING.md))
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] I have made corresponding changes to the documentation if needed
- [ ] I have added tests that prove my fix/feature works, where applicable
- [ ] No secrets, credentials, or `.env` files are included
- [ ] My commit history is clean and rebased on the latest `main`

## PR title convention

The PR title must follow the [commit message convention](../CONTRIBUTING.md#commit-message-guidelines), e.g.:

- `feat(edge): ...`
- `fix(cloud): ...`
- `docs: ...`
