import { expect, test } from 'claude-code/testing'

import { errorKindOf } from '../hooks/bond'
import { COMMAND_LINES, DEPLOY, FILE_LINES, MIGRATE, PUBLISH, STACK_LINES, TEST_RUN, doingOf, propForFile, stackOf, techDanger, techOfFile } from '../hooks/tech'

test('files: the special ones first, then the language', () => {
  expect(techOfFile('src/app/page.tsx')).toBe('react')
  expect(techOfFile('src/lib/x.ts')).toBe('typescript')
  expect(techOfFile('index.html')).toBe('html')
  expect(techOfFile('styles/main.scss')).toBe('css')
  expect(techOfFile('tailwind.config.ts')).toBe('tailwind')
  expect(techOfFile('src/App.vue')).toBe('vue')
  expect(techOfFile('analysis.ipynb')).toBe('notebook')
  expect(techOfFile('cmd/main.go')).toBe('go')
  expect(techOfFile('src/main.rs')).toBe('rust')
  expect(techOfFile('src/Main.java')).toBe('java')
  expect(techOfFile('app/Http/Controller.php')).toBe('php')
  expect(techOfFile('lib/main.dart')).toBe('dart')
  expect(techOfFile('Program.cs')).toBe('csharp')
  expect(techOfFile('db/migrate/001_users.rb')).toBe('migration')
  expect(techOfFile('pkg/x_test.go')).toBe('test')
  expect(techOfFile('src/__tests__/a.ts')).toBe('test')
  expect(techOfFile('package-lock.json')).toBe('lock')
  expect(techOfFile('.env.local')).toBe('env')
  expect(techOfFile('Dockerfile')).toBe('docker')
  expect(techOfFile('.github/workflows/ci.yml')).toBe('ci')
  expect(techOfFile('infra/main.tf')).toBe('terraform')
  expect(techOfFile('schema.prisma')).toBe('prisma')
  expect(techOfFile('notes.xyz')).toBe(null)
  expect(propForFile('java')).toBe('coffee')
  expect(propForFile('migration')).toBe('hardhat')
  expect(propForFile('css')).toBe(null)
})

test('commands: what they are for, in every ecosystem', () => {
  const what = (cmd: string, label: string) => doingOf(cmd, label)?.what
  expect(what('cargo build --release', 'cargo build')).toBe('Building (cargo)')
  expect(what('go run ./cmd/api', 'go run')).toBe('Running the Go program')
  expect(what('./gradlew assembleDebug', 'gradlew assembleDebug')).toBe('Building (JVM)')
  expect(what('dotnet build', 'dotnet build')).toBe('Building (.NET)')
  expect(what('composer require laravel/sanctum', 'composer require')).toBe('Installing packages')
  expect(what('bundle install', 'bundle install')).toBe('Installing gems')
  expect(what('flutter build apk', 'flutter build')).toBe('Building the app')
  expect(what('uv add httpx', 'uv add')).toBe('Installing packages')
  expect(what('npx eslint src', 'npx eslint')).toBe('Linting the code')
  expect(what('npx prettier --write .', 'npx prettier')).toBe('Formatting the code')
  expect(what('ruff check .', 'ruff')).toBe('Linting the code')
  expect(what('npm run dev', 'npm run')).toBe('Starting the dev server')
  expect(what('docker build -t app .', 'docker build')).toBe('Building an image')
  expect(what('terraform plan', 'terraform')).toBe('Working in the cloud')
  expect(what('npx prisma migrate dev', 'npx prisma')).toBe('Migrating the database')
  expect(what('python manage.py migrate', 'python manage.py')).toBe('Migrating the database')
  expect(what('git rebase main', 'git rebase')).toBe('Rebasing')
  expect(what('jq .name package.json', 'jq')).toBe('Reading some JSON')
  expect(what('weirdtool --x', 'weirdtool')).toBe(undefined)
})

test('tests, deploys, publishes and migrations across stacks', () => {
  for (const cmd of ['cargo test', 'go test ./...', './mvnw test', 'gradle test', 'dotnet test', 'bundle exec rspec', 'php artisan test', 'flutter test', 'npx playwright test', 'mix test', 'pytest -q', 'pnpm test'])
    expect(TEST_RUN.test(cmd)).toBe(true)
  for (const cmd of ['vercel --prod', 'firebase deploy', 'wrangler deploy', 'fly deploy', 'helm upgrade api ./chart']) expect(DEPLOY.test(cmd)).toBe(true)
  for (const cmd of ['npm publish', 'cargo publish', 'twine upload dist/*']) expect(PUBLISH.test(cmd)).toBe(true)
  for (const cmd of ['rails db:migrate', 'alembic upgrade head', 'php artisan migrate']) expect(MIGRATE.test(cmd)).toBe(true)
  expect(TEST_RUN.test('npm install')).toBe(false)
})

test('risky commands beyond git and SQL', () => {
  expect(techDanger('terraform destroy -auto-approve')).toContain('Destroying infrastructure')
  expect(techDanger('kubectl delete ns staging')).toContain('cluster')
  expect(techDanger('npm publish --access public')).toContain('Publishing')
  expect(techDanger('npx prisma migrate reset')).toContain('resets the database')
  expect(techDanger('docker system prune -a')).toContain('Pruning')
  expect(techDanger('npm run build')).toBe(null)
})

test('the stack, from the top folder and package.json', () => {
  const pkg = JSON.stringify({ dependencies: { next: '15', react: '19' }, devDependencies: { tailwindcss: '4', prisma: '6' } })
  expect(stackOf(['package.json', 'next.config.ts'], pkg)).toEqual(['Next.js', 'Tailwind', 'Prisma'])
  expect(stackOf(['manage.py', 'requirements.txt'], null)).toEqual(['Django'])
  expect(stackOf(['go.mod', 'Dockerfile'], null)).toEqual(['Go', 'Docker'])
  expect(stackOf(['Cargo.toml'], null)).toEqual(['Rust'])
  expect(stackOf(['pubspec.yaml'], null)).toEqual(['Flutter'])
  expect(stackOf(['artisan', 'composer.json'], null)).toEqual(['Laravel'])
  expect(stackOf(['README.md'], null)).toEqual([])
  // no manifest: a TypeScript plugin with a Python script beside it
  expect(stackOf(['tsconfig.json', 'claudia_art.py', 'README.md'], null)).toEqual(['TypeScript', 'Python'])
})

test('more kinds of failure', () => {
  expect(errorKindOf('Error: listen EADDRINUSE: address already in use :::3000')).toBe('port')
  expect(errorKindOf('FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory')).toBe('memory')
  expect(errorKindOf('npm ERR! code ERESOLVE')).toBe('dependency')
  expect(errorKindOf('error[E0382]: borrow of moved value')).toBe('compile')
  expect(errorKindOf('Main.java:3: error: cannot find symbol')).toBe('compile')
  expect(errorKindOf('✖ 4 problems (3 errors, 1 warning)')).toBe('lint')
})

test('her words about technologies fit a bubble', () => {
  const all = [...Object.values(FILE_LINES), ...Object.values(COMMAND_LINES), ...Object.values(STACK_LINES)].flat()
  for (const s of all) if (s.length > 110 || !s.trim()) throw new Error(`"${s}"`)
})

test('no line of repeats makes a pattern think for long: each word reads one way', () => {
  const lines = [
    'py -m '.repeat(400) + 'x',
    'python -m '.repeat(400) + 'x',
    'terraform' + ' --a'.repeat(900) + ' x',
    'kubectl' + ' -n a'.repeat(700) + ' x',
    'helm' + ' --set a=b'.repeat(500) + ' x',
    'env ' + 'A=b '.repeat(900) + 'x',
    'npm' + ' --a=b'.repeat(900) + ' x',
  ]
  const from = Date.now()
  for (const l of lines) {
    TEST_RUN.test(l)
    MIGRATE.test(l)
    PUBLISH.test(l)
    DEPLOY.test(l)
    techDanger(l)
    doingOf(l, "x")
  }
  expect(Date.now() - from).toBeLessThan(1500)
  // and the real ones are still seen
  expect(TEST_RUN.test('py -m pytest -q')).toBe(true)
  expect(TEST_RUN.test('python3.12 -m pytest')).toBe(true)
  expect(techDanger('terraform -chdir=infra destroy -auto-approve')).toBeTruthy()
  expect(techDanger('kubectl -n prod delete pod x')).toBeTruthy()
  expect(techDanger('kubectl -n prod get pods')).toBeNull()
})
