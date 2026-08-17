# AGENTS.md

This document describes generic architecture and conventions for AI coding agents.

**Scope:** these conventions are written from a C++ / numerical-simulation codebase (plane-wave
DFT, Q3/ESSE) and apply as-is there. For other stacks, apply the same principles by analogy — the
naming rules and OOP antipatterns hold across languages, but tooling-specific items (GTest, ESSE
schema `$ref`s) don't. Skip a rule silently if it names a tool or file layout that doesn't exist
in the repo you're reviewing.

**Precedence:** this file owns *code conventions*. `AGENTS-code-review-tb.md`, where present,
owns *review process, severity, and tone*, and cites the rules here by name rather than restating
them.

## 1. Conventions

### 1.1. Design Patterns

- **Factory**: when multiple implementations are possible - e.g. multiple exchange-correlation functionals, or multiple k-point samplers.
- **Object-oriented design**: define abstract interfaces for components that have multiple implementations - e.g. Method → PseudopotentialMethod, PlaneWaveMethod, Model → DFTModel, HFModel, etc.

### 1.2. OOP Guidelines & Antipatterns

**Prefer polymorphism over type-checking chains.** Instead of:

```cpp
// ❌ ANTIPATTERN: long if-chain checking object type
if (functional.is_lda()) {
    compute_lda_energy(...);
} else if (functional.is_gga()) {
    compute_gga_energy(...);
} else if (functional.is_meta_gga()) {
    compute_meta_gga_energy(...);
}
```

Use:

```cpp
// ✅ CORRECT: polymorphic dispatch via virtual method
Real energy = functional.compute_energy(density);
```

**Key principles:**

- **Single Responsibility**: each class does one thing. If a class has methods for reading, computing, and writing, split it.
- **Open/Closed**: add new behavior by adding new classes, not by adding `if` branches to existing code.
- **Interface Segregation**: keep interfaces small. Don't force implementors to provide methods they don't need.
- **No `is_xxx()` type queries**: if you need `is_ultrasoft()`, `is_paw()`, `is_norm_conserving()`, your design likely needs a virtual method instead.
- **Favor composition over inheritance** for combining behaviors: use mixins (e.g., `BinarySerializableMixin`) rather than deep inheritance hierarchies.
- **Use factories** to create the right subclass from runtime configuration (e.g., `create_diagonalizer("davidson")`).

### 1.3. Logging

- All output via logger
- Allow log level to be set via command line argument (critical, error, warn, info, debug, trace). Default is error.
- Only rank 0 outputs (MPI-aware initialization)
- No print statement in the log

### 1.4. Testing

- Unit tests: `tests/unit/` (GTest)
- Integration tests: `tests/integration/`

### 1.5. Comment Style

- **Multiline docstrings** must have `/**` on its own line followed by the comment body:

```cpp
// ✅ CORRECT
/**
 * Compute the angular phase factor (-i)^l.
 */

// ❌ INCORRECT
/** Compute the angular phase factor (-i)^l.
 */
```

- Use `///` for single-line doc comments.
- Use `//` for inline implementation comments.
- Never use bare `/* ... */` for documentation; use `/** ... */`.

### 1.6. Linter

Use linting for autoformatting the codebase. Consider language-specific tools and/or prettier.

### 1.7. Pre-commit

Use pre-commit to run linters and formatters automatically.

### 1.7.1. Committed build output (`dist/`) — TypeScript packages

The `@mat3ra/*` TypeScript packages **track `dist/` in git** and ship it (`"files": ["/dist",
"/src"]`, `"main": "dist/exports.js"`). Committing a `src/` change without the matching
`dist/` leaves the repository — and any consumer installing from it — running the old code.
A brand-new module is the dangerous case: its `dist/` file is absent entirely, so the
emitted code imports something that does not exist, and the package throws at runtime
rather than merely behaving as the old version.

The husky `pre-commit` hook already handles this:

```sh
npm run transpile
git add dist/
```

**It only fires once hooks are installed.** Repos whose `package.json` has no
`"prepare": "husky install"` (most of them — `cove` is an exception) leave a fresh clone
with no active hooks, so `npm install` alone does not arm it and commits go out with a
stale `dist/`. Do not rely on `prepublishOnly` to cover it either: some packages have no
such script, and the tracked `dist/` goes stale regardless.

So, before committing in any package that tracks `dist/`:

```sh
npm run transpile   # or: npm run build
git add dist/
```

Verify rather than assume — `git ls-tree -r origin/main --name-only | grep -c '^dist/'`
says whether the repo tracks build output, and `git status --short` after transpiling says
whether your change reached it.

### 1.8. GitHub Actions

Use GitHub Actions to run tests and linters automatically.

## 2. !!! IMPORTANT !!!: Code Editing & Development HARD RULES

### 2.1. HARD RULE 1: Never commit without explicit ask from user

NEVER commit changes using `git commit` without the user's explicit ask. Leave files in the working directory for the user to review.

### 2.2. HARD RULE 2: use `<PROJECT_DIRECTORY>/agents/workdir/` for ALL scratch files.

NEVER create any throwaway files at the top level of the project directory (`<PROJECT_DIRECTORY>`). The top level of `<PROJECT_DIRECTORY>` must remain clean and contain only tracked project files. All throw-away scripts — debug helpers, patch scripts, test snippets, one-off analysis scripts — MUST go in `<PROJECT_DIRECTORY>/agents/workdir/tmp/`. Create that directory if it does not exist. Examples of files that belong in `<PROJECT_DIRECTORY>/agents/workdir/tmp/`: `debug_*.py`, `fix_*.py`, `patch_*.py`, `print_*.py`, `test_*.py` / `test_*.cpp` that are not formal tests in `tests/`, any other ephemeral script written to inspect or patch source code. Any potentially reusable agent artifacts should be either in `<PROJECT_DIRECTORY>/agents/workdir/reusable` (if they're intended to be used in the current project only) or in the repository's top-level `plan/` folder (see section 6) if they're plan or context documents intended to persist. NO EXCEPTIONS.

### 2.3. HARD RULE 3: Always setup and use a virtual environment

(`venv`) when working with Python. Do NOT install Python packages globally. Use pyenv to select python version(s). Create venv in the agents workdir directory as explained in the next item

## 3. HARD RULE 4: names with no abbreviations, Snake for Py, Camel for JS/TS, classnames

Variables, functions, methods, field names, class names, type names, file names. Always use full, descriptive names. For example:

- ❌ `nkp`, `nbnd`, `nspin`, `npw`, `ik`, `ib`, `ig`, `ia`, `et`, `pw`, `ppset`
- ✅ `number_of_kpoints`, `number_of_bands`, `number_of_spin_components`, `number_of_plane_waves`, `kpoint_index`, `band_index`, `g_index`, `atom_index`, `eigenvalues`, `planewave_basis`, `pseudopotential_set`
- ❌ `Vec3`, `Mat3`, `IVec3`
- ✅ `Vector3D`, `Matrix3x3`, `IntegerVector3D`

Also:

- Use **snake_case** for variables, functions, and file names.
- Use **PascalCase** for classes and structs.
- Member variables use trailing underscore: `planewave_basis_`, `number_of_bands_`.
- General rule: if a name looks abbreviated, spell it out. Exceptions could be made for complex physical and mathematical expressions where the abbreviation is widely known and used for compacting the representation. However, even in these cases, try to spell it out. Make sure to make it obvious from the context what the abbreviation means.

## 4. Other

### 4.1. JSON Formatting

- **HARD RULE**: JSON schemas MUST follow ESSE formatting conventions:
    - **4-space indentation** (matching ESSE `.prettierrc`)
    - **100 character print width**
    - **Double quotes** only (standard JSON)
    - **Trailing newline** at end of file
    - **Bracket spacing** enabled (e.g., `{ "key": "value" }`)
    - All Q3 result schemas must `$ref` their corresponding ESSE schema in `schemas/esse/schema/`

### 4.2. Code Reviews

- **HARD RULE**: All PR reviews must be saved locally according to the following strict directory and naming structure:
  - Directory: `reviews/<org>/<repo>/pr-<number>/`
  - Filename: `comments-<short_commit_hash>.md` (using the 7-character short hash of the latest commit in the PR)
  - Example: `reviews/mat3ra/q3/pr-10/comments-b307df4.md`

## 5. Concrete Review Examples

When conducting PR reviews, look for these specific architectural and hygiene violations to flag. 

### 5.1. Magic Numbers for Tolerance

**❌ ANTIPATTERN (Flag this):**
```cpp
// QE uses a looser convergence threshold for empty (unoccupied) bands:
int number_of_occupied_bands = quantum_system.number_of_occupied_bands_per_spin();
Real empty_band_tolerance = std::max(5.0 * tolerance_, 1.0e-5);
```

**✅ CORRECT:**
The `5.0` multiplier and `1.0e-5` lower bound should be defined centrally.
```cpp
Real empty_band_tolerance = std::max(
    math::tolerances::empty_band_relaxation_factor * tolerance_, 
    math::tolerances::empty_band_relaxation_floor
);
```

### 5.2. Global Namespace Pollution

**❌ ANTIPATTERN (Flag this):**
```cpp
extern "C" {
/**
 * ZGEMM: Complex double-precision general matrix-matrix multiply.
 * C := alpha * op(A) * op(B) + beta * C
 */
void zgemm_(const char* transa, ...);
}
```

**✅ CORRECT:**
Do not introduce bare C-style wrappers into the global namespace. Wrap them in a class or at least an inner namespace.
```cpp
namespace q3::blas {
    extern "C" {
        void zgemm_(const char* transa, ...);
    }
}
```

### 5.3. Loop Duplication & DRY Violations

**❌ ANTIPATTERN (Flag this):**
```cpp
switch (degree) {
    case 0:
        for (int index = 0; index < mesh_size; index++) {
            Real argument = q_value * radial_grid[index];
            if (std::abs(argument) < math::tolerances::bessel_series_expansion_threshold) { ... }
        }
        break;
    case 1:
        for (int index = 0; index < mesh_size; index++) {
            Real argument = q_value * radial_grid[index];
            if (std::abs(argument) < math::tolerances::bessel_series_expansion_threshold) { ... }
        }
        break;
}
```

**✅ CORRECT:**
While hoisting the switch outside the loop is good for performance, the repetitive boundary checks inside each loop violate DRY. Extract the small-argument asymptotic expansions into inline helper functions to clean this up.

## 6. Plan Folder (`plan/`)

Design documents and durable agent context live in a top-level `plan/` folder, filed by where
the work has got to. The folder a document sits in is the claim being made about it, so moving
it is part of doing the work — not bookkeeping to be done later:

- `plan/upcoming/` — agreed direction, not built yet. Safe to change freely; nothing depends on it.
- `plan/review/` — built and on a branch, not yet proven. Waiting on CI, a PR, or a deploy.
- `plan/implemented/` — shipped. Kept as the record of why the code looks the way it does. On the
  way in, add a `## Status` section at the top recording what shipped, divergences from the plan,
  and what remains open (real open items also get an entry in `upcoming/`).
- `plan/context/` — reference material that is not a plan: investigations, measurements,
  background, and context dumps written to retain state when switching models, machines, or
  sessions.

Never edit a document in `implemented/` to match the code — rewriting history loses the reason a
decision was made, which is the only thing the document is still good for; correct it with a
`## Status` note instead. Name documents `<YYYY-MM-DD>-<Short-Title>.md`, e.g.
`2026-08-16-Containerized-Venv-Plan.md` — dated, with the tracker ticket referenced inside the
document text (a `**Ticket:**` line at the top), not in the file name: repositories are public
while the tracker is private. The canonical `plan/README.md` to copy when introducing
the folder to a repository lives in `mat3ra/agents` under `templates/plan/README.md`.
