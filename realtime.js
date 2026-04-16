let channels = []

export function setupRealtime(supabase, onChange) {
    // Clean up any existing channels
    teardownRealtime()
    
    // Subscribe to todos table
    const todosChannel = supabase
        .channel('app_06d0_todos_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'app_06d0_todos',
                filter: `user_id=eq.${supabase.auth.getUser()?.id || ''}`
            },
            (payload) => {
                onChange(payload)
            }
        )
        .subscribe()
    
    channels.push(todosChannel)
    
    console.log('Realtime subscriptions established')
}

export function teardownRealtime() {
    channels.forEach(channel => {
        supabase.removeChannel(channel)
    })
    channels = []
    console.log('Realtime subscriptions removed')
}