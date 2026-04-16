-- Sample todos for demo user (replace with actual user_id after auth setup)
INSERT INTO app_06d0_todos (user_id, title, is_completed, created_at)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'Buy groceries', false, now() - interval '2 days'),
    ('00000000-0000-0000-0000-000000000000', 'Finish project report', true, now() - interval '1 day'),
    ('00000000-0000-0000-0000-000000000000', 'Call dentist', false, now()),
    ('00000000-0000-0000-0000-000000000000', 'Plan weekend trip', false, now() - interval '3 hours'),
    ('00000000-0000-0000-0000-000000000000', 'Read book', true, now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;