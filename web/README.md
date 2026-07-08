# KaPok Swim Club — attendance & payment tracker

Phone-first PWA for Macau KaPok Swimming Club: tick attendance poolside, record
(partial) repayments, and generate the monthly Traditional-Chinese repayment message
for the parent group. Parents get a read-only view of their kids' attendance.

## Run locally

```bash
cd web
npm install
npm run dev        # http://localhost:5173
npm test           # ledger unit tests (FIFO carryover + message formatting)
npm run build      # type-check + production build
```

Open `/` for a local launcher, then choose **Coach** (edit) or **Parent** (read-only).

## How it works

- **Roles via capability links** — a private coach link `/c/<coachToken>` (edit) and a
  public parent link `/p/<parentToken>` (read-only). No accounts/passwords. Tokens live in
  Settings and can be rotated (old links stop working).
- **Ledger** — every attended session is a charge (`sessionPrice`, or a per-session
  override); every repayment is a payment. Balance = charges − payments. Payments are
  applied **oldest-charge-first (FIFO)**, so unpaid months carry forward and render as
  `5月120元6月135元 / 共255元`. Fully-paid swimmers drop off the monthly message.
- **Attendance screen** — regulars auto-sort to the top by recency/frequency, defaults to
  "recent only", pins today's ticked swimmers to a "今日出席" group, and has a search box
  that doubles as inline "add new swimmer".
- **Language** — UI toggles 繁體中文 / English; the generated group message is always
  Traditional Chinese.

## Data storage — local by default, Supabase when configured

The same build runs two ways, decided by whether `VITE_SUPABASE_URL` is set:

- **Unset → local-first.** All data lives in the browser's `localStorage`
  (`src/lib/store.ts`), seeded with the 35-name roster. No backend; data is per-device.
- **Set → Supabase sync.** The store loads/saves the whole app state through a
  token-gated Edge Function. The **coach** link can write (optimistic local update +
  debounced push); **parent** links are read-only and poll for updates. The pure ledger
  logic (`src/lib/ledger.ts`) and every screen are unchanged either way.

### Enabling Supabase sync

1. **Create** a free Supabase project.
2. **Schema + seed:** open SQL Editor and run `supabase/migrations/0001_init.sql`. This
   creates the `app_state` table and seeds one row with the 35 swimmers and two random
   tokens.
3. **Edge Function:** deploy the gateway (needs the [Supabase CLI](https://supabase.com/docs/guides/cli)):
   ```bash
   supabase functions deploy api --no-verify-jwt --project-ref <your-ref>
   ```
   `--no-verify-jwt` lets the browser call it with just the capability token; the function
   does its own check and uses the service role internally (never exposed to the browser).
4. **Point the app at it:** set `VITE_SUPABASE_URL=https://<ref>.supabase.co` in `.env`
   locally (see `.env.example`) or as a GitHub Actions repo **Variable** for Pages builds.
5. **Bootstrap your link:** in Supabase → Table editor → `app_state`, copy
   `data.settings.coachToken`, then open `<site>/#/c/<that token>`. From the app's
   **Settings** tab you can then copy/share both the coach and parent links and rotate them.

> Design note: the whole state is one JSON document with last-write-wins. That's ideal for
> one coach editing at a time (parents are read-only). Two coaches editing simultaneously
> could overwrite each other — fine for this club, but not a general multi-writer design.

## Layout

```
src/lib/ledger.ts     pure balance / FIFO / message formatter (unit-tested)
src/lib/store.ts      data store: localStorage or Supabase sync (same interface)
src/lib/api.ts        Edge Function client (only used when VITE_SUPABASE_URL is set)
src/lib/types.ts      data model
src/routes/coach/*    attendance, payments, roster, message, settings
src/routes/ParentApp  read-only parent view
../supabase/          migration (schema + seed) + token-gated Edge Function
```
