// paste this in console while on localhost:3000 with React DevTools' "$r" pointed
// at any component, OR just temporarily call it from a throwaway onClick in page.tsx:
useTaskStore.getState().addTask({
  id: crypto.randomUUID(),
  user_id: 'test-user',
  anchor_id: null,
  name: 'Test task',
  aes_score: 3,
  energy_level: 'medium',
  status: 'active',
  decay_started_at: null,
  completed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})