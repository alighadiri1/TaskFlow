// ===== DOM Elements =====
const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const list = document.querySelector('#todo-list');
const counter = document.querySelector('#counter');
const filters = document.querySelector('.filters');
const themeBtn = document.getElementById('toggle-theme');

const editOverlay = document.getElementById('edit-overlay');
const editInput = document.getElementById('edit-input');
const editSave = document.getElementById('edit-save');
const editCancel = document.getElementById('edit-cancel');

const confirmOverlay = document.getElementById('confirm-overlay');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');

let editingTodo = null;
let dragSrcEl = null;

// ===== App State =====
let state = {
  filter: 'all',
  todos: JSON.parse(localStorage.getItem('todos')) || [],
  theme: localStorage.getItem('theme') || 'dark'
};

// ===== Theme Toggle =====
document.body.className = state.theme;
themeBtn.onclick = () => {
  state.theme = state.theme==='dark'?'light':'dark';
  document.body.className = state.theme;
  localStorage.setItem('theme', state.theme);
};

// ===== Save =====
const save = () => localStorage.setItem('todos', JSON.stringify(state.todos));

// ===== Render =====
function render() {
  list.innerHTML='';
  const visible = state.todos.filter(t =>
    state.filter==='all'?true:state.filter==='done'?t.done:!t.done
  );
  visible.forEach(todo => {
    const li=document.createElement('li');
    li.dataset.id = todo.id;
    li.draggable = true;
    if(todo.done) li.classList.add('done');
    li.innerHTML = `<span>${todo.text}</span><div class="actions"><button data-action="edit">✎</button><button data-action="delete">✕</button></div>`;
    list.appendChild(li);
  });
  counter.textContent = `${state.todos.filter(t=>!t.done).length} کار باقی مانده`;
}
render();

// ===== Add Todo =====
form.onsubmit = e => {
  e.preventDefault();
  const val = input.value.trim();
  if(!val) return;
  state.todos.push({id:crypto.randomUUID(),text:val,done:false});
  input.value='';
  save();
  render();
};

// ===== Filter =====
filters.onclick = e => {
  if(!e.target.dataset.filter) return;
  document.querySelectorAll('.filters button').forEach(b=>b.classList.remove('active'));
  e.target.classList.add('active');
  state.filter = e.target.dataset.filter;
  render();
};

// ===== List Actions =====
list.onclick = e => {
  const li = e.target.closest('li');
  if(!li) return;
  const todo = state.todos.find(t=>t.id===li.dataset.id);

  // Delete
  if(e.target.dataset.action==='delete'){
    state.todos = state.todos.filter(t=>t.id!==todo.id);
    save(); render(); return;
  }

  // Edit
  if(e.target.dataset.action==='edit'){
    editingTodo = todo;
    editInput.value = todo.text;
    editOverlay.classList.remove('hidden');
    editInput.focus();
    return;
  }

  // Toggle done
  if(!e.target.closest('.actions')){
    if(!todo.done){
      confirmOverlay.classList.remove('hidden');
      confirmYes.onclick = () => { todo.done=true; save(); render(); confirmOverlay.classList.add('hidden'); };
      confirmNo.onclick = () => { confirmOverlay.classList.add('hidden'); };
      return;
    }
    todo.done = !todo.done;
    save();
    render();
  }
};

// ===== Edit Modal =====
editSave.onclick = () => {
  const val = editInput.value.trim();
  if(val){ editingTodo.text=val; save(); render(); }
  closeEdit();
};
editCancel.onclick = closeEdit;
editInput.addEventListener('keydown', e => {
  if(e.key==='Enter') editSave.click();
  if(e.key==='Escape') closeEdit();
});
function closeEdit(){ editOverlay.classList.add('hidden'); editingTodo=null; }

// ===== Drag & Drop =====
list.addEventListener('dragstart', e => { dragSrcEl=e.target; e.dataTransfer.effectAllowed='move'; e.target.classList.add('dragging'); });
list.addEventListener('dragend', e => e.target.classList.remove('dragging'));
list.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect='move'; });
list.addEventListener('drop', e => {
  e.preventDefault();
  const li = e.target.closest('li');
  if(!li || li===dragSrcEl) return;
  const srcIndex = state.todos.findIndex(t=>t.id===dragSrcEl.dataset.id);
  const tgtIndex = state.todos.findIndex(t=>t.id===li.dataset.id);
  const [moved] = state.todos.splice(srcIndex,1);
  state.todos.splice(tgtIndex,0,moved);
  save(); render();
});
