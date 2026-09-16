# Lumin42
Ai consultancy

## Reference tools

Real, external open-source projects pulled in as git submodules — reference material for the
build, not code lumin42 has written or shipped. Nothing in `reference-tools/` is lumin42's own
work; each is a separate, independently maintained project.

- [`reference-tools/orca`](https://github.com/stablyai/orca) — an ADE (agent development
  environment) for running a fleet of parallel coding agents.
- [`reference-tools/open-code-review`](https://github.com/alibaba/open-code-review) — Alibaba's
  hybrid deterministic-pipeline + LLM-agent code review tool.
- [`reference-tools/security-audit-skill`](https://github.com/cloudflare/security-audit-skill) —
  Cloudflare's multi-phase security-audit coding-agent skill.

Cloning this repo: run `git clone --recurse-submodules` (or `git submodule update --init`
afterward) to pull the submodule contents too — a plain clone leaves those folders empty.
