// What Claudia knows of the technologies people use with Claude Code: the kind of file, what a
// command is for, which runs are tests, builds, deploys or publishes, what is risky, and the stack a
// project is built on. Pure data and functions; register.tsx asks.

// ------------------------------------------------------------------ files

export type FileTech =
  | 'migration' | 'test' | 'lock' | 'env' | 'docker' | 'ci'
  | 'html' | 'css' | 'tailwind' | 'javascript' | 'typescript' | 'react' | 'vue' | 'svelte' | 'astro'
  | 'python' | 'notebook' | 'sql' | 'go' | 'rust' | 'java' | 'kotlin' | 'swift' | 'c' | 'cpp' | 'csharp'
  | 'php' | 'ruby' | 'dart' | 'elixir' | 'lua' | 'shell' | 'r' | 'scala' | 'markdown' | 'config'
  | 'terraform' | 'graphql' | 'prisma' | 'proto'

const BY_EXTENSION: [RegExp, FileTech][] = [
  [/\.(html?|ejs|hbs|njk|liquid|jinja2?)$/, 'html'],
  [/\.(css|scss|sass|less|styl|pcss)$/, 'css'],
  [/\.(tsx|jsx)$/, 'react'],
  [/\.(ts|mts|cts)$/, 'typescript'],
  [/\.(js|mjs|cjs)$/, 'javascript'],
  [/\.vue$/, 'vue'],
  [/\.svelte$/, 'svelte'],
  [/\.astro$/, 'astro'],
  [/\.ipynb$/, 'notebook'],
  [/\.(py|pyi)$/, 'python'],
  [/\.sql$/, 'sql'],
  [/\.go$/, 'go'],
  [/\.rs$/, 'rust'],
  [/\.java$/, 'java'],
  [/\.(kt|kts)$/, 'kotlin'],
  [/\.swift$/, 'swift'],
  [/\.(c|h)$/, 'c'],
  [/\.(cpp|cc|cxx|hpp|hh|hxx)$/, 'cpp'],
  [/\.(cs|csproj|razor)$/, 'csharp'],
  [/\.php$/, 'php'],
  [/\.(rb|erb|rake)$/, 'ruby'],
  [/\.dart$/, 'dart'],
  [/\.(ex|exs|heex)$/, 'elixir'],
  [/\.lua$/, 'lua'],
  [/\.(sh|bash|zsh|fish|ps1|psm1|bat|cmd)$/, 'shell'],
  [/\.(r|rmd)$/, 'r'],
  [/\.(scala|sc)$/, 'scala'],
  [/\.(md|mdx|rst|adoc)$/, 'markdown'],
  [/\.(tf|tfvars|hcl)$/, 'terraform'],
  [/\.(graphql|gql)$/, 'graphql'],
  [/\.prisma$/, 'prisma'],
  [/\.proto$/, 'proto'],
  [/\.(json|jsonc|ya?ml|toml|ini|xml|plist|gradle|properties)$/, 'config'],
]

/** What kind of file a path is: the special ones (a migration, a test, a lock file) before the language. */
export function techOfFile(path: string): FileTech | null {
  // a leading slash, so a relative path's first folder counts too
  const p = `/${path.replace(/\\/g, '/').toLowerCase().replace(/^\/+/, '')}`
  const name = p.split('/').pop() ?? p
  if (/\/(migrations?|alembic|db\/migrate)\//.test(p)) return 'migration'
  if (/\.(test|spec)\.[a-z]+$|_test\.(go|py|rb|exs)$|\/tests?\/|\/__tests__\/|\/spec\/|\/test_[^/]+\.py$|(?:\/|[_.-])tests?\.(cs|java|kt|swift)$/.test(p) || /[a-z0-9]Tests?\.(cs|java|kt|swift)$/.test(path)) return 'test'
  if (/(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|cargo\.lock|poetry\.lock|uv\.lock|gemfile\.lock|composer\.lock|go\.sum|pubspec\.lock)$/.test(name)) return 'lock'
  if (/^\.env(\.|$)/.test(name)) return 'env'
  if (/^(dockerfile|containerfile)(\.|$)|^docker-compose|^compose\.ya?ml$/.test(name)) return 'docker'
  if (/\/\.github\/workflows\/|\.gitlab-ci\.yml$|azure-pipelines|jenkinsfile$|\.circleci\//.test(p)) return 'ci'
  if (/^tailwind\.config\./.test(name)) return 'tailwind'
  for (const [re, kind] of BY_EXTENSION) if (re.test(name)) return kind
  return null
}

/** A word of hers when she edits a file of that kind. */
export const FILE_LINES: Record<FileTech, string[]> = {
  migration: ['A migration. Hard hat stays on.', 'Migrations: write once, check twice.', 'Schema change incoming. Backwards compatible, I hope.', 'A migration: easy to write, hard to undo.'],
  test: ['Writing tests. My favourite kind of code.', 'A test! Future you will say thanks.', 'Pinning the behaviour down with a test.', 'Tests first, worries later.', 'One more test, one less surprise.'],
  lock: ['A lock file? Usually the package manager’s job.', 'Touching the lock file. Brave.', 'Lock files: let the tools write them.'],
  env: ['An .env file: secrets live here. Keep them out of git!', 'Careful, .env files hold keys.', 'Environment settings. No secrets in the repo, promise?'],
  docker: ['A Dockerfile. Layers on layers.', 'Containers! Very BLISS of us.', 'Order the layers well and the cache loves you.', 'Docker setup. Small images are happy images.'],
  ci: ['The CI pipeline. May the checks be green.', 'Editing CI: the robots are watching.', 'Pipeline tweaks. Push and pray, in a good way.'],
  html: ['HTML! The bones of the web.', 'Some markup. Semantic tags, please.', 'Alt text on those images, okay?', 'A button that is a real <button>. I approve.', 'Headings in order: h1, then h2.'],
  css: ['Styling! I have opinions about colours.', 'CSS, where one pixel matters.', 'Flexbox or grid? Grid, today.', 'Careful with !important. It always wins arguments.', 'Spacing, spacing, spacing.'],
  tailwind: ['The Tailwind config. Design tokens time.', 'Tailwind settings: colours, spacing, vibes.', 'New tokens beat arbitrary values.'],
  javascript: ['JavaScript. Mind the semicolons, or don’t.', 'A bit of JS. Classic.', 'Three equals signs, always.', 'async, await, and a try around it.'],
  typescript: ['TypeScript. The types will keep us honest.', 'Types make me feel safe.', 'No any today. Let’s be specific.', 'If it compiles, it’s halfway right.', 'A type here saves a bug there.'],
  react: ['A React component. Hooks at the top!', 'JSX time. Keys on those lists.', 'Props in, UI out.', 'Mind the effect dependencies.', 'Small components are kind components.'],
  vue: ['A Vue component. Template, script, style.', 'Vue! Reactive and tidy.', 'Computed beats a watcher, usually.'],
  svelte: ['Svelte! Less code, more magic.', 'A Svelte component. So compact.', 'Runes and reactivity. Neat.'],
  astro: ['An Astro page. Islands everywhere.', 'Astro: fast pages, few scripts.', 'Ship less JavaScript. Astro agrees.'],
  python: ['Python. Spaces, not tabs.', 'A little Python never hurt anyone.', 'Type hints make Python friendlier.', 'Readability counts. The Zen says so.', 'A list comprehension, maybe?'],
  notebook: ['A notebook. Run the cells in order, okay?', 'Jupyter time. Charts incoming?', 'Restart and run all, before you trust it.'],
  sql: ['SQL! Mind the WHERE.', 'A bit of SQL. Steady hands.', 'Is there an index for that?', 'JOINs: the fun part of SQL.', 'Explain before you optimise.'],
  go: ['Go: if err != nil, again.', 'Some Go. Simple and fast.', 'Small interfaces, big wins.', 'gofmt will make it pretty.'],
  rust: ['Rust! The borrow checker is watching.', 'Rust code. Fearless, they say.', 'Ownership first, cleverness later.', 'An unwrap here? Maybe a ? instead.'],
  java: ['Java! I brought coffee. ☕', 'Java. Classes all the way down.', 'A record would be shorter here.', 'Streams, or a plain loop?'],
  kotlin: ['Kotlin. Java’s cooler cousin.', 'Some Kotlin. Null safety, yay.', 'A data class does that in one line.'],
  swift: ['Swift! Apple vibes.', 'Swift code. Optionals, unwrap with care.', 'guard let, my favourite exit.'],
  c: ['C. Mind the pointers.', 'Plain C. Respect.', 'Every malloc needs its free.'],
  cpp: ['C++. Templates, careful.', 'Some C++. Every feature, all at once.', 'Smart pointers, please.'],
  csharp: ['C#. LINQ incoming?', 'A bit of .NET.', 'async all the way down.'],
  php: ['PHP! Still powering half the web.', 'Some PHP. Dollar signs everywhere.', 'Strict types on top, please.'],
  ruby: ['Ruby. So friendly to read.', 'A bit of Ruby. Elegant.', 'There’s a method for that, surely.'],
  dart: ['Dart. Flutter, maybe?', 'Some Dart. Widgets incoming.', 'const constructors make Flutter faster.'],
  elixir: ['Elixir! Pipes all the way. |>', 'Some Elixir. Let it crash, gracefully.', 'Pattern matching makes me happy.'],
  lua: ['Lua. Tables everywhere.', 'A bit of Lua. Light and quick.', 'Arrays start at 1 here. Careful.'],
  shell: ['A shell script. Quote your variables!', 'Some scripting. set -e, maybe?', 'Shell: powerful, and a little scary.'],
  r: ['R! Statistics time.', 'Some R. Plots incoming?', 'Tidyverse or base R?'],
  scala: ['Scala. Functional and fancy.', 'Some Scala. Implicits, careful.', 'Case classes, lovely.'],
  markdown: ['Docs! Someone will be grateful.', 'Words, not code. Nice change.', 'Good docs are a gift to future you.', 'Writing it down so nobody has to guess.'],
  config: ['Config. Mind the commas.', 'Settings, settings.', 'Small config change, big effect sometimes.', 'Valid JSON, I hope.'],
  terraform: ['Terraform. Infrastructure as code, hard hat on.', 'Plan first, apply later, okay?', 'State files are sacred.'],
  graphql: ['A GraphQL schema. Ask for exactly what you need.', 'GraphQL! Types for the API.', 'Watch out for N+1 resolvers.'],
  prisma: ['The Prisma schema. A migration may follow.', 'Prisma models. Hard hat ready.', 'Relations, indexes, enums. Tidy.'],
  proto: ['A proto file. Wire formats, careful.', 'Protobufs. Field numbers are forever.'],
}

/** What she holds while Claude edits a file of that kind, when it is not her pencil. */
export function propForFile(tech: FileTech | null): 'coffee' | 'hardhat' | null {
  if (tech === 'java' || tech === 'kotlin') return 'coffee'
  if (tech === 'migration' || tech === 'sql' || tech === 'prisma' || tech === 'terraform') return 'hardhat'
  return null
}

// ------------------------------------------------------------------ commands

/** Test runs across ecosystems: the cake is real for every one of them. */
const STEP = String.raw`(?:^|&&|\|\||[;|\n(])[^\S\n]*(?:(?:sudo|time|env|npx|bunx|pnpx|pnpm\s+(?:exec|dlx)|yarn\s+dlx|uv\s+run|uvx|poetry\s+run|pipenv\s+run|hatch\s+run|pdm\s+run|bundle\s+exec|dotenv|cross-env|python\d?(?:\.\d+)?|py|php|node|ruby|\w+=\S+|-[\w-]+(?:=\S+)?)\s+)*(?:\.[\\/]|[\w.:\\/-]*[\\/])?`
const FLAGS = String.raw`(?:\s+-[\w-]+(?:=\S+)?)*`
/** Flags that may carry a value of their own (`-n prod`, `--context=x`) before the subcommand. */
const VALUED = String.raw`(?:\s+-[\w-]+(?:=\S+|\s+(?!apply|install|upgrade)[^\s-]\S*)?)*`
export const TEST_RUN = new RegExp(
  STEP +
    String.raw`(?:pytest|vitest|jest|mocha|ava|tap|bun(?:@[\w.]+)?${FLAGS}\s+(?:run\s+)?test|deno\s+test|go\s+test|cargo\s+(?:test|nextest)|(?:npm|pnpm|yarn)${FLAGS}\s+(?:run\s+)?test|turbo\s+(?:run\s+)?test|nx\s+(?:run\s+\S+:)?test|claude\s+plugin\s+test|mvnw?(?:\.cmd)?\s+(?:\S+\s+)?test|gradlew?(?:\.bat)?\s+(?:\S+\s+)?test|dotnet\s+test|rspec|rails\s+test|phpunit|pest|artisan\s+test|flutter\s+test|dart\s+test|swift\s+test|xcodebuild\s+.*test|playwright\s+test|cypress\s+run|mix\s+test|ctest|tox|nox|unittest|\S*manage\.py\s+test|make\s+(?:test|check)|just\s+test)(?![\w.-])`,
)

/** Deploys: the runway lifts off. */
const DRY = /(^|\s)(--dry-run(=\S+)?|--dryrun)(\s|$)/
const DEPLOY_RUN = new RegExp(
  STEP +
    String.raw`(?:gcloud\s+(?:run\s+(?:jobs\s+)?deploy|app\s+deploy|builds\s+submit|functions\s+deploy)|vercel\s+(?:--prod|deploy)|netlify\s+deploy|fly\s+deploy|flyctl\s+deploy|firebase\s+deploy|wrangler\s+(?:deploy|publish)|railway\s+up|heroku\s+.*deploy|kubectl${VALUED}\s+apply|helm${VALUED}\s+(?:install|upgrade)|(?:terraform|tofu)(?:\s+-chdir=\S+)?\s+apply|serverless\s+deploy|sls\s+deploy|cdk\s+deploy|amplify\s+publish|eb\s+deploy)(?![\w-])`,
)
/** A deploy that really goes out: a dry run is not one. */
export const DEPLOY = { test: (cmd: string) => DEPLOY_RUN.test(cmd) && !DRY.test(cmd) && !/\bterraform\s+apply\b.*-destroy\b/.test(cmd) }

/** Publishing a package: it goes out to the world. */
const PUBLISH_RUN = new RegExp(
  STEP + String.raw`(?:(?:npm|pnpm|yarn|bun)\s+publish|cargo\s+publish|twine\s+upload|poetry\s+publish|uv\s+publish|gem\s+push|dotnet\s+nuget\s+push|flutter\s+pub\s+publish)(?![\w-])`,
)
/** A package really published: a dry run is not one. */
export const PUBLISH = { test: (cmd: string) => PUBLISH_RUN.test(cmd) && !/--dry-run\b/.test(cmd) }

/** Migrations: the hard hat goes on. */
export const MIGRATE = new RegExp(
  STEP +
    String.raw`(?:prisma\s+(?:migrate|db\s+push)|drizzle-kit\s+(?:push|migrate|generate)|alembic\s+(?:upgrade|downgrade|revision)|(?:\S*manage\.py)\s+(?:migrate|makemigrations)|rails\s+db:|rake\s+db:|artisan\s+migrate|knex\s+migrate|sequelize\s+db:migrate|typeorm\s+migration|flyway|liquibase|goose|dbmate|supabase\s+db)`,
)

export type CommandTech =
  | 'git' | 'js' | 'python' | 'go' | 'rust' | 'jvm' | 'dotnet' | 'php' | 'ruby' | 'mobile' | 'native'
  | 'db' | 'docker' | 'cloud' | 'web' | 'lint' | 'tsc' | 'claude'

/** What a command is for, in plain words, and which world it is from. */
export type Doing = { what: string; tech: CommandTech | null }

const D = (what: string, tech: CommandTech | null = null): Doing => ({ what, tech })

/**
 * What a shell command is for: `Searching the code`, `Running the tests`, `Building (cargo)`.
 * `label` is the program and its subcommand as the bubble names it (`git commit`, `python x.py`).
 */
export function doingOf(cmd: string, label: string): Doing | null {
  const [exe0 = '', sub = ''] = label.toLowerCase().split(/\s+/)
  const exe = exe0.replace(/^\.\//, '')
  const has = (re: RegExp) => re.test(cmd)
  if (TEST_RUN.test(cmd)) return D('Running the tests')
  if (PUBLISH.test(cmd)) return D('Publishing a package')
  if (MIGRATE.test(cmd)) return D('Migrating the database', 'db')
  if (DEPLOY.test(cmd)) return D('Deploying', 'cloud')
  // languages and their tools
  if (/^(python\d*(\.\d+)?|py)$/.test(exe)) {
    if (has(/manage\.py\s+runserver|uvicorn|flask\s+run|gunicorn/)) return D('Starting the server', 'python')
    if (has(/-m\s+(pip|uv)\b/)) return D('Installing packages', 'python')
    const script = label.split(/\s+/)[1]
    return D(script ? `Running a script (${script})` : 'Running a quick script', 'python')
  }
  if (/^(pip\d*|uv|poetry|pipenv|conda|mamba|pdm)$/.test(exe)) {
    if (/^(install|add|sync|lock|update|upgrade|remove)$/.test(sub) || has(/\bpip\s+install\b/)) return D('Installing packages', 'python')
    if (sub === 'run') return D('Running a script', 'python')
    return D('Managing the environment', 'python')
  }
  if (/^(uvicorn|gunicorn|flask|django-admin)$/.test(exe)) return D('Starting the server', 'python')
  if (/^(jupyter|ipython|papermill)$/.test(exe)) return D('Running a notebook', 'python')
  if (/^(ruff|black|isort|flake8|pylint|mypy|pyright|eslint|prettier|biome|stylelint|clippy|golangci-lint|gofmt|rubocop|phpstan|psalm|php-cs-fixer|ktlint|detekt|swiftlint|swiftformat|clang-format|clang-tidy|shellcheck|hadolint|markdownlint)$/.test(exe)
    || (/^(npx|bunx|pnpm|yarn)$/.test(exe) && /^(eslint|prettier|biome|stylelint|tsc)$/.test(sub))
    || has(/\bcargo\s+(clippy|fmt)\b|\bgo\s+vet\b|\bdotnet\s+format\b/)) {
    if (sub === 'tsc' || exe === 'tsc') return D('Checking the types', 'tsc')
    return D(/format|fmt|prettier|black|isort|biome\s+format/.test(cmd) ? 'Formatting the code' : 'Linting the code', 'lint')
  }
  if (exe === 'tsc' || ((exe === 'npx' || exe === 'bunx') && sub === 'tsc')) return D('Checking the types', 'tsc')
  if (/^(npm|pnpm|yarn|bun|deno|npx|bunx|node|corepack)$/.test(exe)) {
    if (/^(i|install|add|ci|remove|rm|uninstall|update|upgrade)$/.test(sub)) return D('Installing packages', 'js')
    if (has(/\b(build|compile)\b/)) return D('Building', 'js')
    if (has(/\b(dev|start|serve|preview)\b/)) return D('Starting the dev server', 'js')
    if (exe === 'node') {
      const script = label.split(/\s+/)[1]
      return D(script ? `Running a script (${script})` : 'Running a quick script', 'js')
    }
    if (has(/\b(vite|next|nuxt|astro|remix|webpack|esbuild|rollup|turbo|nx)\b/)) return D('Running the build tool', 'js')
    return D(`Running ${label}`, 'js')
  }
  if (/^(vite|next|nuxt|astro|webpack|esbuild|rollup|turbo|nx|parcel)$/.test(exe)) {
    if (sub === 'lint') return D('Linting the code', 'lint')
    return D(has(/\bbuild\b/) ? 'Building' : 'Starting the dev server', 'js')
  }
  if (exe === 'go') {
    if (/^(build|install)$/.test(sub)) return D('Building (go)', 'go')
    if (sub === 'run') return D('Running the Go program', 'go')
    if (/^(get|mod)$/.test(sub)) return D('Fetching modules', 'go')
    return D(`Running go ${sub}`.trim(), 'go')
  }
  if (/^(cargo|rustc|rustup)$/.test(exe)) {
    if (/^(build|check)$/.test(sub) || exe === 'rustc') return D(sub === 'check' ? 'Checking the crate' : 'Building (cargo)', 'rust')
    if (sub === 'run') return D('Running the Rust program', 'rust')
    if (/^(add|update|install)$/.test(sub)) return D('Adding crates', 'rust')
    return D(`Running cargo ${sub}`.trim(), 'rust')
  }
  if (/^(mvn|mvnw|gradle|gradlew|java|javac|kotlinc|sbt|ant)$/.test(exe)) {
    if (has(/\b(package|build|assemble\w*|compile\w*|install|jar|bundle\w*)\b/) || exe === 'javac') return D('Building (JVM)', 'jvm')
    if (has(/\b(run|bootrun|exec)\b/) || exe === 'java') return D('Running the app', 'jvm')
    return D('Working with the build', 'jvm')
  }
  if (exe === 'dotnet') {
    if (/^(build|publish|pack)$/.test(sub)) return D('Building (.NET)', 'dotnet')
    if (sub === 'run' || sub === 'watch') return D('Running the app', 'dotnet')
    if (/^(add|restore)$/.test(sub)) return D('Installing packages', 'dotnet')
    return D(`Running dotnet ${sub}`.trim(), 'dotnet')
  }
  if (/^(php|composer|artisan|symfony)$/.test(exe)) {
    if (exe === 'composer' && /^(install|require|update|remove)$/.test(sub)) return D('Installing packages', 'php')
    if (has(/artisan\s+serve|symfony\s+serve|php\s+-S\b/)) return D('Starting the server', 'php')
    return D(exe === 'php' && sub ? `Running a script (${label.split(/\s+/)[1]})` : 'Running PHP', 'php')
  }
  if (/^(ruby|bundle|bundler|gem|rails|rake|irb)$/.test(exe)) {
    if ((exe === 'bundle' && /^(install|add|update)$/.test(sub)) || (exe === 'gem' && sub === 'install')) return D('Installing gems', 'ruby')
    if (exe === 'rails' && /^(s|server)$/.test(sub)) return D('Starting the server', 'ruby')
    return D(`Running ${label}`, 'ruby')
  }
  if (/^(flutter|dart|xcodebuild|xcrun|swift|pod|fastlane|adb|expo|eas)$/.test(exe) || has(/react-native/)) {
    if (has(/\b(build|archive|assemble)\b/)) return D('Building the app', 'mobile')
    if (has(/\b(run|start|launch)\b/)) return D('Running the app', 'mobile')
    if (has(/\b(pub\s+get|pod\s+install|install)\b/)) return D('Installing packages', 'mobile')
    return D(`Running ${label}`, 'mobile')
  }
  if (/^(make|cmake|ninja|gcc|g\+\+|clang|clang\+\+|cc|msbuild|meson|bazel|zig)$/.test(exe)) return D('Building', 'native')
  if (/^(psql|mysql|mariadb|sqlite3|mongosh|mongo|redis-cli|pg_dump|pg_restore|clickhouse|duckdb|sqlcmd)$/.test(exe)) return D('Asking the database', 'db')
  if (/^(docker|docker-compose|podman|nerdctl)$/.test(exe)) {
    if (sub === 'build') return D('Building an image', 'docker')
    if (/^(compose|up|run|start)$/.test(sub)) return D('Starting containers', 'docker')
    return D('Working with containers', 'docker')
  }
  if (/^(kubectl|helm|k9s|kind|minikube|terraform|tofu|pulumi|ansible|ansible-playbook|aws|gcloud|az|doctl|flyctl|fly|vercel|netlify|firebase|wrangler|supabase|railway|heroku)$/.test(exe)) {
    if (/^(plan|diff|preview)$/.test(sub)) return D('Planning the infrastructure', 'cloud')
    return D('Working in the cloud', 'cloud')
  }
  // everyday tools
  if (exe === 'git' || exe === 'gh') {
    const git: Record<string, string> = {
      add: 'Staging changes', commit: 'Committing', push: 'Pushing', pull: 'Fetching from the remote', fetch: 'Fetching from the remote',
      checkout: 'Switching branches', switch: 'Switching branches', merge: 'Merging', rebase: 'Rebasing', stash: 'Stashing changes',
      pr: 'Working on a pull request', clone: 'Cloning a repository',
    }
    return D(git[sub] ?? 'Checking git', 'git')
  }
  if (/^(sed|awk|perl|tr)$/.test(exe)) return D('Tweaking a file')
  if (/^(grep|rg|egrep|findstr|select-string|ag|ack)$/.test(exe)) return D('Searching the code')
  if (/^(ls|dir|cat|head|tail|less|find|fd|tree|wc|file|stat|pwd|du|get-content|get-childitem|bat)$/.test(exe)) return D('Looking around')
  if (/^(curl|wget|http|httpie|invoke-webrequest|invoke-restmethod)$/.test(exe)) return D('Fetching from the web', 'web')
  if (/^(rm|rmdir|mkdir|mv|cp|touch|ln|chmod|remove-item|new-item|move-item|copy-item|rename-item)$/.test(exe)) return D('Tidying up files')
  if (/^(tar|zip|unzip|7z|gzip|gunzip)$/.test(exe)) return D('Packing files')
  if (/^(jq|yq)$/.test(exe)) return D('Reading some JSON')
  if (/^(ssh|scp|rsync)$/.test(exe)) return D('Talking to a server')
  if (/^(brew|apt|apt-get|dnf|yum|pacman|winget|choco|scoop|snap)$/.test(exe)) return D('Installing tools')
  if (exe === 'claude') return D(`Running ${label}`, 'claude')
  return null
}

/** A word of hers, now and then, about the world a command is from. */
export const COMMAND_LINES: Record<CommandTech, string[]> = {
  git: ['Git and I go way back.', 'Git, my old friend.', 'Small commits, clear messages.', 'History is a feature.'],
  js: ['node_modules, my favourite black hole.', 'Let’s see what the packages think.', 'The bundler is thinking.', 'JavaScript land, never boring.'],
  python: ['Python! Indentation police on duty.', 'Snakes are cute, honestly.', 'The virtual environment is on, right?', 'Batteries included.'],
  go: ['Gophers! I love the little guys.', 'Go: compiled before you blink.', 'go vet is a good friend.'],
  rust: ['The borrow checker has opinions.', 'Rust: slow to build, fast to run.', 'Cargo is a great package manager, honestly.'],
  jvm: ['Gradle and Maven: grab a coffee. ☕', 'The JVM is warming up.', 'Builds on the JVM take their time.'],
  dotnet: ['.NET at work. Very enterprise.', 'dotnet, doing its thing.', 'NuGet, fetch me something nice.'],
  php: ['PHP keeps half the web alive.', 'Composer, compose me something nice.', 'Artisan at your service.'],
  ruby: ['Ruby: optimised for happiness.', 'Rails magic in progress.', 'Bundler is on it.'],
  mobile: ['Phones! Builds take a while.', 'Simulators warming up.', 'Mobile builds: patience is a skill.'],
  native: ['Compiling. Fans spinning.', 'Make, the old reliable.', 'Native code. Close to the metal.'],
  db: ['Hard hat on, talking to the database.', 'Databases: handle with care.', 'The data never lies. Queries sometimes do.'],
  docker: ['Containers in containers. Very BLISS.', 'The whale! I like whales.', 'Layers are caching, I hope.'],
  cloud: ['Clouds! I like clouds.', 'Somewhere a server wakes up.', 'The cloud is just someone else’s computer.'],
  web: ['Calling the outside world.', 'Fetching something from the internet.', 'Hello, internet.'],
  lint: ['Tidy code is happy code.', 'The linter has notes.', 'Consistency is a kindness.'],
  tsc: ['Asking tsc for its opinion. Brace yourself.', 'Types, types, types.', 'The compiler is my proofreader.'],
  claude: ['Claude running Claude. Very meta.', 'Plugins testing plugins. I love this.', 'Testing my own world.'],
}

/** A word when a build or a check goes through, in its own world. */
export const OK_LINES: Partial<Record<CommandTech, string[]>> = {
  rust: ['It compiles. The borrow checker approves.', 'cargo is happy. So am I.'],
  go: ['Built before you blinked.', 'Go is happy. Clean build.'],
  jvm: ['BUILD SUCCESSFUL. The coffee was worth it. ☕', 'Gradle says yes.'],
  dotnet: ['Build succeeded. Zero warnings, I hope.', '.NET is happy.'],
  js: ['Built! The bundle is ready.', 'The build went through.'],
  tsc: ['No type errors. Lovely.', 'The types agree with us.', 'tsc is quiet. That’s praise.'],
  lint: ['The linter is happy.', 'Clean. Not a single nit.', 'Lint clean. Tidy!'],
  native: ['It compiled. No warnings, even.', 'Linked and ready.'],
  mobile: ['The app built. Phones, here we come.', 'Build done. Ready for the simulator.'],
  docker: ['Image built. Small and tidy, I hope.', 'The image is ready.'],
  db: ['The database answered.', 'Query done, data back.'],
}

/** A word when a build or a check fails, in its own world. */
export const FAIL_LINES: Partial<Record<CommandTech, string[]>> = {
  rust: ['The borrow checker said no. Let’s see who owns what.', 'Rust has notes. Lifetimes, maybe?'],
  go: ['Go won’t build. An unused import, maybe?', 'The Go compiler is strict. Let’s fix it.'],
  jvm: ['BUILD FAILED. Let’s read the first error.', 'Gradle is unhappy. Cannot find symbol?'],
  dotnet: ['The build failed. Let’s look at the CS error.', '.NET says no.'],
  js: ['The build failed. Let’s read the first error.', 'The bundler tripped over something.'],
  tsc: ['tsc is grumbling. Let’s read what it says.', 'The type check didn’t pass. Let’s look.', 'tsc has notes for us.'],
  lint: ['The linter found things. Mostly small, I hope.', 'Lint errors. Tidy-up time.'],
  python: ['A traceback. Let’s read it bottom up.', 'Python stumbled. The last line tells why.'],
  native: ['Compile error. The first one matters most.', 'The linker is unhappy.'],
  mobile: ['The app build failed. Signing, maybe?', 'Mobile build trouble. Let’s look.'],
  docker: ['The image didn’t build. Which layer?', 'Docker build failed. A missing file, maybe?'],
  db: ['The database said no.', 'The query failed. A typo in a column, maybe?'],
}

/** Risky commands beyond git and SQL: infrastructure torn down, a package published, a database reset. */
const OPTS = String.raw`(?:\s+-{1,2}[A-Za-z][\w-]*(?:=\S+|\s+(?!delete|destroy|uninstall|apply)[\w./:][\w./:-]*)?)*`
const INFRA_DESTROY = new RegExp(String.raw`\b(?:terraform|tofu|pulumi)${OPTS}\s+destroy\b|\b(?:terraform|tofu)${OPTS}\s+apply\b.*\s-destroy\b`)
const CLUSTER_DELETE = new RegExp(String.raw`\bkubectl${OPTS}\s+delete\b|\bhelm${OPTS}\s+(?:uninstall|delete)\b`)
export function techDanger(cmd: string): string | null {
  if (INFRA_DESTROY.test(cmd)) return 'Destroying infrastructure! Is that the right workspace?'
  if (CLUSTER_DELETE.test(cmd) && !/--dry-run/.test(cmd)) return 'Deleting from the cluster. Which context are we in?'
  if (PUBLISH.test(cmd)) return 'Publishing a package: it goes out to everyone. Version bumped?'
  if (/\bprisma\s+migrate\s+reset\b|\bprisma\s+db\s+push\b.*--force-reset\b|\bdb:(drop|reset)\b|\bmanage\.py\s+flush\b|\bsupabase\s+db\s+reset\b|\bmigrate:fresh\b/.test(cmd)) return 'That resets the database. Not production, right?'
  if (/\bdocker\s+volume\s+prune\b|\bdocker\s+system\s+prune\b.*--volumes\b|\bdocker(\s+compose|-compose)\s+down\b.*\s(-v|--volumes)\b/.test(cmd)) return 'Docker volumes go for good with that. Sure?'
  if (/\bdocker\s+(system|image|builder)\s+prune\b[^|&;\n]*\s(-a|--all|-af|-fa)(\s|$)/.test(cmd)) return 'Pruning every unused image and cache: the next build starts cold.'
  if (/\b(npm|pnpm|yarn)\s+(install|i|add|ci|update|upgrade|audit\s+fix)\b[^|&;\n]*\s--force(\s|$)/.test(cmd)) return 'A forced install can break versions. Sure?'
  return null
}

// ------------------------------------------------------------------ the project's stack

/** What a Python manifest (pyproject.toml, requirements.txt) says the project is built with. */
function pythonStack(manifest: string): string[] {
  const m = manifest.toLowerCase()
  const out: string[] = []
  if (/\bdjango\b/.test(m)) out.push('Django')
  else if (/\bfastapi\b/.test(m)) out.push('FastAPI')
  else if (/\bflask\b/.test(m)) out.push('Flask')
  if (/\b(asyncpg|psycopg2?|psycopg-binary|sqlalchemy|sqlmodel)\b/.test(m)) out.push('PostgreSQL')
  if (/\b(shapely|pyproj|geopandas|geoalchemy2|gdal|rasterio|osmium)\b/.test(m)) out.push('GIS')
  if (/\b(torch|tensorflow|jax|transformers|scikit-learn|sklearn)\b/.test(m)) out.push('Machine learning')
  else if (/\b(pandas|polars|numpy)\b/.test(m)) out.push('Data')
  if (/\bstripe\b/.test(m)) out.push('Stripe')
  if (/\bsupabase\b/.test(m)) out.push('Supabase')
  return out
}

/**
 * Marks of a stack in a folder and its manifests: the names she speaks of. `manifest` is a Python
 * manifest's text, when there is one.
 */
export function stackOf(files: readonly string[], packageJson: string | null, manifest: string | null = null): string[] {
  const has = (name: string) => files.includes(name)
  const out: string[] = []
  let deps: Record<string, unknown> = {}
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson) as { dependencies?: Record<string, unknown>; devDependencies?: Record<string, unknown> }
      deps = { ...pkg.dependencies, ...pkg.devDependencies }
    } catch {
      // not JSON: no dependencies to read
    }
  }
  const dep = (name: string) => name in deps
  if (dep('next')) out.push('Next.js')
  else if (dep('nuxt')) out.push('Nuxt')
  else if (dep('@remix-run/react')) out.push('Remix')
  else if (dep('astro')) out.push('Astro')
  else if (dep('@sveltejs/kit')) out.push('SvelteKit')
  else if (dep('@angular/core')) out.push('Angular')
  else if (dep('react-native') || dep('expo')) out.push('React Native')
  else if (dep('react')) out.push('React')
  else if (dep('vue')) out.push('Vue')
  else if (dep('svelte')) out.push('Svelte')
  if (dep('tailwindcss')) out.push('Tailwind')
  if (dep('express') || dep('fastify') || dep('hono') || dep('@nestjs/core')) out.push(dep('@nestjs/core') ? 'NestJS' : dep('hono') ? 'Hono' : dep('fastify') ? 'Fastify' : 'Express')
  if (dep('payload')) out.push('Payload CMS')
  if (dep('prisma') || dep('@prisma/client')) out.push('Prisma')
  if (dep('drizzle-orm')) out.push('Drizzle')
  if (dep('@supabase/supabase-js')) out.push('Supabase')
  if (dep('leaflet') || dep('maplibre-gl') || dep('mapbox-gl') || dep('react-map-gl')) out.push('Maps')
  if (dep('@playwright/test')) out.push('Playwright')
  if (dep('electron')) out.push('Electron')
  if (packageJson && !out.length) out.push(dep('typescript') ? 'TypeScript' : 'Node.js')
  if (has('manage.py')) out.push('Django')
  if (manifest) out.push(...pythonStack(manifest))
  if (!out.some(t => ['Django', 'FastAPI', 'Flask'].includes(t)) && (has('pyproject.toml') || has('requirements.txt') || has('setup.py') || has('Pipfile')))
    out.push('Python')
  if (has('go.mod')) out.push('Go')
  if (has('Cargo.toml')) out.push('Rust')
  if (has('pom.xml') || has('build.gradle') || has('build.gradle.kts')) out.push(has('build.gradle.kts') ? 'Kotlin' : 'Java')
  if (files.some(f => /\.(sln|csproj)$/.test(f))) out.push('.NET')
  if (has('artisan')) out.push('Laravel')
  else if (has('composer.json')) out.push('PHP')
  if (has('Gemfile')) out.push(has('config.ru') || has('bin') ? 'Rails' : 'Ruby')
  if (has('pubspec.yaml')) out.push('Flutter')
  if (has('Package.swift') || files.some(f => f.endsWith('.xcodeproj'))) out.push('Swift')
  if (has('mix.exs')) out.push('Elixir')
  if (has('CMakeLists.txt')) out.push('C++')
  if (files.some(f => f.endsWith('.tf'))) out.push('Terraform')
  if (has('Dockerfile') || has('docker-compose.yml') || has('compose.yaml')) out.push('Docker')
  // no manifest at all: a TypeScript or Python folder still says what it is
  if (!out.length && has('tsconfig.json')) out.push('TypeScript')
  if (!out.some(t => ['Python', 'Django', 'FastAPI', 'Flask'].includes(t)) && files.some(f => f.endsWith('.py'))) out.push('Python')
  return [...new Set(out)].slice(0, 6)
}

/** A word of hers, when idle, about the stack she sees. */
export const STACK_LINES: Record<string, string[]> = {
  'Next.js': ['Server or client component? The eternal question.', 'App Router life: layouts all the way down.', 'next build is the real test.'],
  React: ['useEffect again? Let’s keep it tidy.', 'Lifting state up, or not? Decisions.'],
  Vue: ['Vue’s reactivity still feels like magic to me.', 'Composition API, my favourite.'],
  Svelte: ['Svelte: so little code. I’m jealous.'],
  SvelteKit: ['SvelteKit: so little code. I’m jealous.', 'Load functions everywhere.'],
  Angular: ['Angular: modules, services, so organised.', 'Signals are a nice change.'],
  Astro: ['Astro pages load so fast. Islands are cute.'],
  Tailwind: ['Fourteen classes on one div? Tailwind life.', 'Design tokens beat magic numbers.'],
  'Payload CMS': ['Payload collections, neatly typed.', 'The CMS and the app in one repo. Cosy.'],
  Supabase: ['Row-level security on, I hope.', 'Supabase: Postgres with a friendly face.'],
  Maps: ['Maps! I love a good map.', 'Tiles, layers, markers. My kind of UI.'],
  Playwright: ['Playwright tests: the browser does the clicking.', 'Smoke tests keep releases calm.'],
  Django: ['Django: batteries included, and a fine admin.', 'Migrations and models, the Django way.'],
  FastAPI: ['FastAPI: types in, docs out. Lovely.', 'Async endpoints, Pydantic models. Tidy.', 'The /docs page writes itself.'],
  Flask: ['Flask: small and friendly.'],
  PostgreSQL: ['Postgres: my favourite database.', 'EXPLAIN ANALYZE is a good friend.'],
  GIS: ['Coordinates! EPSG codes, mind them.', 'Geometry is just maths with maps.', 'Shapely and pyproj, the GIS duo.'],
  Data: ['DataFrames all day.', 'Vectorise it, it’s faster.'],
  'Machine learning': ['Training something? Check the loss curve.'],
  Stripe: ['Payments: test mode first, always.'],
  Python: ['A virtual environment a day keeps the conflicts away.'],
  Go: ['if err != nil. I could sing it by now.'],
  Rust: ['The borrow checker and I are on speaking terms now.'],
  Java: ['Java: I keep the coffee warm. ☕'],
  Kotlin: ['Kotlin: data classes are so neat.'],
  '.NET': ['.NET: I like a good LINQ query.'],
  Laravel: ['Laravel: artisan, at your service.'],
  Rails: ['Rails: convention over configuration, my kind of thing.'],
  Flutter: ['Flutter: widgets all the way down.'],
  Swift: ['Swift: so many optionals to unwrap.'],
  Prisma: ['Prisma schema changes? A migration follows.'],
  Terraform: ['Terraform: always plan before apply.'],
  Docker: ['Rebuilding the image? Cache layers, please.'],
}

/** Small, true tips she shares now and then, for the stack she sees. */
export const TIPS: Record<string, string[]> = {
  'Next.js': ['Tip: server components can’t use hooks; add "use client" where state lives.', 'Tip: next/image sizes images for you.', 'Tip: fetch in server components, not in useEffect, when you can.'],
  React: ['Tip: a list needs stable keys, not array indexes.', 'Tip: derive values in render instead of syncing state with an effect.'],
  Tailwind: ['Tip: a design token in the config beats an arbitrary value.', 'Tip: group long class lists into a component, not a copy.'],
  TypeScript: ['Tip: unknown is safer than any.', 'Tip: let the types narrow with a guard instead of a cast.'],
  'Payload CMS': ['Tip: after a collection change, regenerate the Payload types.'],
  Supabase: ['Tip: check row-level security policies on every new table.'],
  Playwright: ['Tip: getByRole finds elements the way users do.'],
  FastAPI: ['Tip: a response_model keeps the API from leaking fields.', 'Tip: blocking calls in async endpoints stall the loop; use a thread.'],
  Django: ['Tip: select_related saves you from N+1 queries.'],
  PostgreSQL: ['Tip: an index on the column you filter by can save seconds.', 'Tip: EXPLAIN ANALYZE shows where the time goes.'],
  GIS: ['Tip: buffer in a metric projection, not in degrees.', 'Tip: a spatial index makes ST_Intersects fly.'],
  Python: ['Tip: pathlib beats string paths.', 'Tip: f-strings are faster and clearer than format().'],
  Go: ['Tip: wrap errors with %w so callers can check them.'],
  Rust: ['Tip: ? passes errors up more kindly than unwrap.'],
  Java: ['Tip: a record is a whole value class in one line.'],
  Docker: ['Tip: copy the lock file before the source, so installs stay cached.'],
  Terraform: ['Tip: plan, read it, then apply.'],
}

/** What a package.json's scripts are, by name: `npm run check` is what `check` runs. */
export function scriptsOf(packageJson: string | null): Record<string, string> {
  if (!packageJson) return {}
  try {
    const pkg = JSON.parse(packageJson) as { scripts?: Record<string, unknown> }
    return Object.fromEntries(Object.entries(pkg.scripts ?? {}).filter((e): e is [string, string] => typeof e[1] === 'string'))
  } catch {
    return {}
  }
}

/** The script a run names (`npm run lint`, `pnpm typecheck`, `bun run build`), or null. */
export function scriptNamed(step: string): string | null {
  // flags before the script (`npm run --silent build`, `npm --prefix app run build`) are not its name
  const m = /^(npm|pnpm|yarn|bun)((?:\s+-[\w-]+(?:=\S+)?(?:\s+(?!run\b)[\w./\\-]+(?=\s+run\b))?)*)\s+(run\s+(?:-[\w-]+\s+)*)?([\w:.@/-]+)/.exec(step.trim())
  const name = m?.[4]
  if (!name || name.startsWith('-')) return null
  // without `run`, the package manager's own verbs are not scripts
  if (!m?.[3] && /^(i|install|add|ci|remove|rm|uninstall|update|upgrade|up|test|exec|dlx|x|init|create|publish|link|audit|ls|list|outdated|pack|version|why|info|view|config|cache|login|logout|whoami|prune|dedupe|rebuild|workspace|workspaces|pm|build|run)$/.test(name)) return null
  if (name === 'test') return null
  return name
}
