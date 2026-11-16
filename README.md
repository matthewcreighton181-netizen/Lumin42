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
- [`reference-tools/reverse-api-engineer`](https://github.com/kalil0321/reverse-api-engineer) (MIT) —
  turns a website's own network traffic into a typed API client. Use it only on sites we own or have
  written permission to integrate with, and check the site's terms first; never to scrape or get round
  a login, paywall or rate limit. Useful for Otto and Reverse SaaS builds where a client's tool has no
  public API.

Cloning this repo: run `git clone --recurse-submodules` (or `git submodule update --init`
afterward) to pull the submodule contents too — a plain clone leaves those folders empty.
