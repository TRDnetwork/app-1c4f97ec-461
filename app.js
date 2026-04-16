import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { setupRealtime, teardownRealtime } from './realtime.js'

// Check for injected credentials
if (!window.__SUPABASE_URL__ || !window.__SUPABASE_ANON_KEY__) {
    document.getElementById('errorBanner').textContent = 'Supabase credentials not injected'
    document.getElementById('errorBanner').classList.add('show')
    document.getElementById('loading').style.display = 'none'
    document.getElementById('app').classList.add('loaded')
    throw new Error('Supabase credentials not injected')
}

const supabase = createClient(window.__SUPABASE_URL__, window.__SUPABASE_ANON_KEY__)

let currentUser = null
let todos = []
let isLoading = true
let authError = null
let dataError = null

const appEl = document.getElementById('app')
const loadingEl = document.getElementById('loading')
const errorBannerEl = document.getElementById('errorBanner')

async function init() {
    try {
        // Try to get session (wrapped for sandbox resilience)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            currentUser = session?.user || null
        } catch (err) {
            console.warn('Auth session check failed (sandbox):', err.message)
            currentUser = null
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                currentUser = session.user
                await fetchTodos()
                setupRealtime(supabase, handleRealtimeChange)
            } else if (event === 'SIGNED_OUT') {
                currentUser = null
                todos = []
                teardownRealtime()
            }
            render()
        })

        // If we have a user, fetch todos and setup realtime
        if (currentUser) {
            await fetchTodos()
            setupRealtime(supabase, handleRealtimeChange)
        }
    } catch (err) {
        console.error('Init error:', err)
        dataError = err.message
    } finally {
        // Always hide loading and show app
        loadingEl.style.display = 'none'
        appEl.classList.add('loaded')
        render()
    }
}

async function fetchTodos() {
    if (!currentUser) return
    isLoading = true
    dataError = null
    render()
    
    try {
        const { data, error } = await supabase
            .from('app_06d0_todos')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (error) throw error
        todos = data || []
    } catch (err) {
        console.error('Fetch todos error:', err)
        dataError = err.message
    } finally {
        isLoading = false
        render()
    }
}

function handleRealtimeChange(payload) {
    if (payload.table !== 'app_06d0_todos') return
    
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    if (eventType === 'INSERT') {
        todos = [newRecord, ...todos]
    } else if (eventType === 'UPDATE') {
        todos = todos.map(todo => todo.id === newRecord.id ? newRecord : todo)
    } else if (eventType === 'DELETE') {
        todos = todos.filter(todo => todo.id !== oldRecord.id)
    }
    
    render()
}

async function handleSignUp(email, password) {
    authError = null
    render()
    
    try {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        })
        if (error) throw error
        // Note: We don't set currentUser here - wait for onAuthStateChange
    } catch (err) {
        authError = err.message
        render()
    }
}

async function handleSignIn(email, password) {
    authError = null
    render()
    
    try {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
        // Note: We don't set currentUser here - wait for onAuthStateChange
    } catch (err) {
        authError = err.message
        render()
    }
}

async function handleSignOut() {
    try {
        await supabase.auth.signOut()
    } catch (err) {
        console.error('Sign out error:', err)
    }
}

async function addTodo(title) {
    if (!title.trim() || !currentUser) return
    
    try {
        const user = await supabase.auth.getUser()
        const userId = user.data.user?.id
        
        if (!userId) throw new Error('No user ID')
        
        const { error } = await supabase
            .from('app_06d0_todos')
            .insert({
                title: title.trim(),
                user_id: userId,
                is_completed: false
            })
        
        if (error) throw error
    } catch (err) {
        console.error('Add todo error:', err)
        dataError = err.message
        render()
    }
}

async function toggleTodo(id, isCompleted) {
    try {
        const { error } = await supabase
            .from('app_06d0_todos')
            .update({ is_completed: !isCompleted })
            .eq('id', id)
        
        if (error) throw error
    } catch (err) {
        console.error('Toggle todo error:', err)
        dataError = err.message
        render()
    }
}

async function deleteTodo(id) {
    try {
        const { error } = await supabase
            .from('app_06d0_todos')
            .delete()
            .eq('id', id)
        
        if (error) throw error
    } catch (err) {
        console.error('Delete todo error:', err)
        dataError = err.message
        render()
    }
}

function renderAuthGate() {
    let email = ''
    let password = ''
    
    const updateEmail = (e) => { email = e.target.value }
    const updatePassword = (e) => { password = e.target.value }
    
    const submitSignUp = (e) => {
        e.preventDefault()
        handleSignUp(email, password)
    }
    
    const submitSignIn = (e) => {
        e.preventDefault()
        handleSignIn(email, password)
    }
    
    return `
        <div class="auth-gate">
            <h1>Todo Minimal</h1>
            <p>Sign in to manage your tasks</p>
            <div class="auth-error ${authError ? 'show' : ''}">${authError || ''}</div>
            <form class="auth-form" onsubmit="return false">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" placeholder="you@example.com" oninput="(${updateEmail})(event)" />
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" placeholder="••••••••" oninput="(${updatePassword})(event)" />
                </div>
                <div class="auth-buttons">
                    <button class="btn btn-primary" onclick="(${submitSignUp})(event)">Sign Up</button>
                    <button class="btn btn-secondary" onclick="(${submitSignIn})(event)">Sign In</button>
                </div>
            </form>
        </div>
    `
}

function renderApp() {
    let newTodoTitle = ''
    
    const updateNewTodo = (e) => { newTodoTitle = e.target.value }
    
    const submitNewTodo = async (e) => {
        e.preventDefault()
        if (!newTodoTitle.trim()) return
        await addTodo(newTodoTitle)
        // Clear input
        const input = document.querySelector('.input-group input')
        if (input) input.value = ''
        newTodoTitle = ''
    }
    
    const remainingCount = todos.filter(t => !t.is_completed).length
    
    return `
        <div class="app-header">
            <h1>Todo Minimal</h1>
            <button class="sign-out-btn" onclick="(${handleSignOut})()">Sign Out</button>
        </div>
        
        <div class="data-error ${dataError ? 'show' : ''}">${dataError || ''}</div>
        
        <div class="todo-input-card">
            <form class="input-group" onsubmit="(${submitNewTodo})(event)">
                <input 
                    type="text" 
                    placeholder="What needs to be done?" 
                    oninput="(${updateNewTodo})(event)"
                />
                <button class="btn btn-primary" type="submit">Add</button>
            </form>
        </div>
        
        <div class="todo-list">
            ${isLoading ? `
                <div class="loading-todos">Loading tasks...</div>
            ` : todos.length === 0 ? `
                <div class="todo-empty">No tasks yet. Add one above!</div>
            ` : todos.map(todo => `
                <div class="todo-item" data-id="${todo.id}">
                    <div class="todo-checkbox ${todo.is_completed ? 'checked' : ''}" 
                         onclick="(${() => toggleTodo(todo.id, todo.is_completed)})()">
                    </div>
                    <div class="todo-text ${todo.is_completed ? 'completed' : ''}">
                        ${todo.title}
                    </div>
                    <button class="todo-delete" onclick="(${() => deleteTodo(todo.id)})()">
                        ×
                    </button>
                </div>
            `).join('')}
        </div>
        
        <div class="todo-footer">
            ${remainingCount} ${remainingCount === 1 ? 'task' : 'tasks'} remaining
        </div>
    `
}

function render() {
    if (!currentUser) {
        appEl.innerHTML = renderAuthGate()
    } else {
        appEl.innerHTML = renderApp()
    }
}

// Initialize the app
init()