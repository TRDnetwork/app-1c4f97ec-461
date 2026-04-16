# Test Suite for Todo Minimal App

This directory contains unit and integration tests for the Todo Minimal application.

## How to Run

1. Install dependencies:
   ```bash
   npm install --save-dev vitest jsdom @vitest/globals
   ```

2. Run tests:
   ```bash
   npm test
   ```

   Or directly with npx:
   ```bash
   npx vitest run
   ```

## Test Files

### `app.test.js`
- **Purpose**: Unit tests for frontend logic and UI components.
- **Coverage**:
  - Authentication flows (sign up, sign in, sign out)
  - Todo operations (add, toggle, delete, fetch)
  - Realtime subscription setup/teardown
  - UI state calculations (remaining count, completed styling)
- **Mocks**: Supabase client is fully mocked to isolate frontend logic.

### `api.test.js`
- **Purpose**: Tests for Supabase API interactions and RLS policies.
- **Coverage**:
  - Table queries (SELECT, INSERT, UPDATE, DELETE)
  - Row Level Security (RLS) policy adherence
  - Error handling for network and auth failures
  - Realtime subscription configuration
- **Mocks**: Supabase client mocked with controlled responses.

## Notes
- Tests are written using Vitest with `describe`/`it`/`expect` syntax.
- The `jsdom` environment simulates a browser for DOM-related tests.
- Mocks ensure tests run without a live Supabase backend.
- The realtime subscription bug identified in the code review is not directly tested because it requires async user ID resolution; the fix should be implemented in `realtime.js`.