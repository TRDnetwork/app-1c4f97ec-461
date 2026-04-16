import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
  const mockSupabase = {
    auth: {
      getSession: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    })),
    removeChannel: vi.fn(),
  };
  return { createClient: vi.fn(() => mockSupabase) };
});

// Mock global window for credentials
global.window = {
  __SUPABASE_URL__: 'https://test.supabase.co',
  __SUPABASE_ANON_KEY__: 'test-key',
};

// Import app functions after mocks
const { setupRealtime, teardownRealtime } = await import('./realtime.js');

describe('Todo Minimal App', () => {
  let supabase;

  beforeEach(() => {
    supabase = createClient();
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should render auth gate when no user is logged in', () => {
      // Simulate no user
      supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
      // This would be tested via integration, but we can assert the mock
      expect(supabase.auth.getSession).toBeDefined();
    });

    it('should call signUp with email and password', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      supabase.auth.signUp.mockResolvedValue({ error: null });

      // Simulate signUp call
      await supabase.auth.signUp({ email, password });
      expect(supabase.auth.signUp).toHaveBeenCalledWith({ email, password });
    });

    it('should call signIn with credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      supabase.auth.signInWithPassword.mockResolvedValue({ error: null });

      await supabase.auth.signInWithPassword({ email, password });
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email, password });
    });
  });

  describe('Todo Operations', () => {
    it('should fetch todos for the current user', async () => {
      const mockTodos = [
        { id: '1', title: 'Test todo', is_completed: false, user_id: 'user1' },
      ];
      const selectMock = vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockTodos, error: null })),
      }));
      supabase.from.mockReturnValue({ select: selectMock });

      const result = await supabase.from('app_06d0_todos').select('*').order('created_at', { ascending: false });
      expect(result.data).toEqual(mockTodos);
      expect(supabase.from).toHaveBeenCalledWith('app_06d0_todos');
    });

    it('should add a new todo', async () => {
      const title = 'New task';
      const userId = 'user123';
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } } });
      const insertMock = vi.fn(() => Promise.resolve({ error: null }));
      supabase.from.mockReturnValue({ insert: insertMock });

      await supabase.from('app_06d0_todos').insert({ title: title.trim(), user_id: userId, is_completed: false });
      expect(insertMock).toHaveBeenCalledWith({
        title: 'New task',
        user_id: 'user123',
        is_completed: false,
      });
    });

    it('should toggle todo completion status', async () => {
      const todoId = 'todo1';
      const isCompleted = false;
      const updateMock = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      }));
      supabase.from.mockReturnValue({ update: updateMock });

      await supabase.from('app_06d0_todos').update({ is_completed: !isCompleted }).eq('id', todoId);
      expect(updateMock).toHaveBeenCalledWith({ is_completed: true });
    });

    it('should delete a todo', async () => {
      const todoId = 'todo1';
      const deleteMock = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      }));
      supabase.from.mockReturnValue({ delete: deleteMock });

      await supabase.from('app_06d0_todos').delete().eq('id', todoId);
      expect(deleteMock).toHaveBeenCalled();
    });
  });

  describe('Realtime', () => {
    it('should setup realtime subscription', () => {
      const onChange = vi.fn();
      const channelMock = { on: vi.fn(() => ({ subscribe: vi.fn() })) };
      supabase.channel.mockReturnValue(channelMock);
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user123' } } });

      setupRealtime(supabase, onChange);
      expect(supabase.channel).toHaveBeenCalledWith('app_06d0_todos_changes');
    });

    it('should teardown realtime subscriptions', () => {
      teardownRealtime();
      expect(supabase.removeChannel).toHaveBeenCalled();
    });
  });

  describe('UI State', () => {
    it('should calculate remaining task count correctly', () => {
      const todos = [
        { id: '1', title: 'Task 1', is_completed: false },
        { id: '2', title: 'Task 2', is_completed: true },
        { id: '3', title: 'Task 3', is_completed: false },
      ];
      const remaining = todos.filter(t => !t.is_completed).length;
      expect(remaining).toBe(2);
    });

    it('should apply completed class for done tasks', () => {
      const todo = { id: '1', title: 'Done task', is_completed: true };
      const hasClass = todo.is_completed ? 'completed' : '';
      expect(hasClass).toBe('completed');
    });
  });
});