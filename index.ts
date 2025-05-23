const themeToggleBtn = document.getElementById('themeToggleBtn') as HTMLButtonElement;
const body = document.body;

function setTheme(mode: 'light' | 'dark') {
    if (mode === 'dark') {
        body.classList.add('dark-mode');
        themeToggleBtn.innerHTML = '<ion-icon name="sunny-outline"></ion-icon> Toggle Theme';
    } else {
        body.classList.remove('dark-mode');
        themeToggleBtn.innerHTML = '<ion-icon name="moon-outline"></ion-icon> Toggle Theme';
    }
    localStorage.setItem('themeMode', mode);
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('themeMode') as 'light' | 'dark' | null;
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
    renderUsers();
    renderTasks();
});

themeToggleBtn.addEventListener('click', () => {
    if (body.classList.contains('dark-mode')) {
        setTheme('light');
    } else {
        setTheme('dark');
    }
});


interface User {
    id: string;
    name: string;
}

interface Task {
    id: string;
    title: string;
    dueDate: string;
    priority: 'Low' | 'Medium' | 'High';
    assignedUserId: string | null;
    status: 'Pending' | 'In Progress' | 'Completed';
}

function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

class ToastBox {
    private toastBox: HTMLElement;
    private toastText: HTMLElement;
    private closeButton: HTMLElement;

    constructor() {
        this.toastBox = document.getElementById('toastBox') as HTMLElement;
        this.toastText = document.getElementById('toastText') as HTMLElement;
        this.closeButton = document.getElementById('closeToastBox') as HTMLElement;
        this.closeButton.addEventListener('click', () => this.hide());
    }

    show(toast: string, duration: number = 3000) {
        this.toastText.textContent = toast;
        this.toastBox.classList.add('show');
        this.toastBox.classList.remove('hidden');

        setTimeout(() => {
            this.hide();
        }, duration);
    }

    hide() {
        this.toastBox.classList.remove('show');
        this.toastBox.classList.add('hidden');
    }
}


class ConfirmationModal {
    private modal: HTMLElement;
    private messageElement: HTMLElement;
    private confirmButton: HTMLElement;
    private cancelButton: HTMLElement;
    private resolvePromise: ((confirmed: boolean) => void) | null = null;

    constructor() {
        this.modal = document.getElementById('confirmationModal') as HTMLElement;
        this.messageElement = document.getElementById('modalMessage') as HTMLElement;
        this.confirmButton = document.getElementById('confirmDeleteBtn') as HTMLElement;
        this.cancelButton = document.getElementById('cancelDeleteBtn') as HTMLElement;

        this.confirmButton.addEventListener('click', () => this.handleConfirm(true));
        this.cancelButton.addEventListener('click', () => this.handleConfirm(false));
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) { 
                this.handleConfirm(false);
            }
        });
    }

    show(message: string): Promise<boolean> {
        this.messageElement.textContent = message;
        this.modal.classList.remove('hidden');
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
        });
    }

    private hide() {
        this.modal.classList.add('hidden');
        this.resolvePromise = null;
    }

    private handleConfirm(confirmed: boolean) {
        if (this.resolvePromise) {
            this.resolvePromise(confirmed);
        }
        this.hide();
    }
}


class TaskManager {
    private users: User[] = [];
    private tasks: Task[] = [];
    private readonly USER_STORAGE_KEY = 'users-storage';
    private readonly TASK_STORAGE_KEY = 'tasks-storage';

    constructor() {
        this.loadFromLocalStorage();
    }

    addUser(name: string): User {
        const newUser: User = { id: generateId(), name };
        this.users.push(newUser);
        this.saveToLocalStorage();
        return newUser;
    }

    getUsers(): User[] {
        return [...this.users];
    }

    updateUser(id: string, newName: string): boolean {
        const userIndex = this.users.findIndex(user => user.id === id);
        if (userIndex > -1) {
            this.users[userIndex].name = newName;
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    deleteUser(id: string): boolean {
        const initialLength = this.users.length;
        this.users = this.users.filter(user => user.id !== id);
        this.tasks.forEach(task => {
            if (task.assignedUserId === id) {
                task.assignedUserId = null;
            }
        });
        if (this.users.length < initialLength) {
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    addTask(
        title: string,
        dueDate: string,
        priority: 'Low' | 'Medium' | 'High',
        assignedUserId: string | null,
        status: 'Pending' | 'In Progress' | 'Completed'
    ): Task {
        const newTask: Task = {
            id: generateId(),
            title,
            dueDate,
            priority,
            assignedUserId,
            status
        };
        this.tasks.push(newTask);
        this.saveToLocalStorage();
        return newTask;
    }

    getTasks(): Task[] {
        return [...this.tasks];
    }

    updateTask(
        id: string,
        updatedFields: Partial<Omit<Task, 'id'>>
    ): boolean {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex > -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updatedFields };
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    deleteTask(id: string): boolean {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(task => task.id !== id);
        if (this.tasks.length < initialLength) {
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    private saveToLocalStorage(): void {
        localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(this.users));
        localStorage.setItem(this.TASK_STORAGE_KEY, JSON.stringify(this.tasks));
    }

    private loadFromLocalStorage(): void {
        const usersJson = localStorage.getItem(this.USER_STORAGE_KEY);
        const tasksJson = localStorage.getItem(this.TASK_STORAGE_KEY);

        if (usersJson) {
            this.users = JSON.parse(usersJson);
        }
        if (tasksJson) {
            this.tasks = JSON.parse(tasksJson);
        }
    }
}

const addUserBtn = document.getElementById('addUserBtn') as HTMLButtonElement;
const userFormContainer = document.getElementById('userFormContainer') as HTMLElement;
const userForm = document.getElementById('userForm') as HTMLFormElement;
const userNameInput = document.getElementById('userName') as HTMLInputElement;
const userIdInput = document.getElementById('userId') as HTMLInputElement;
const cancelUserBtn = document.getElementById('cancelUserBtn') as HTMLButtonElement;
const userListUl = document.getElementById('userList') as HTMLUListElement;
const userFormTitle = document.getElementById('userFormTitle') as HTMLSpanElement;

const addTaskBtn = document.getElementById('addTaskBtn') as HTMLButtonElement;
const taskFormContainer = document.getElementById('taskFormContainer') as HTMLElement;
const taskForm = document.getElementById('taskForm') as HTMLFormElement;
const taskIdInput = document.getElementById('taskId') as HTMLInputElement;
const taskTitleInput = document.getElementById('taskTitle') as HTMLInputElement;
const taskDueDateInput = document.getElementById('taskDueDate') as HTMLInputElement;
const taskPrioritySelect = document.getElementById('taskPriority') as HTMLSelectElement;
const taskAssignedUserSelect = document.getElementById('taskAssignedUser') as HTMLSelectElement;
const taskStatusSelect = document.getElementById('taskStatus') as HTMLSelectElement;
const cancelTaskBtn = document.getElementById('cancelTaskBtn') as HTMLButtonElement;
const taskListUl = document.getElementById('taskList') as HTMLUListElement;
const taskFormTitle = document.getElementById('taskFormTitle') as HTMLSpanElement;

const taskManager = new TaskManager();
const confirmationModal = new ConfirmationModal();
const toastBox = new ToastBox();


function renderUsers(): void {
    userListUl.innerHTML = '';
    const users = taskManager.getUsers();
    if (users.length === 0) {
        userListUl.innerHTML = '<li class="list-item-details">No users.</li>';
        return;
    }
    users.forEach(user => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="list-item-header">
                <span><ion-icon name="person"></ion-icon> ${user.name}</span>
                <div class="list-item-actions">
                    <button class="btn primary-btn edit-user-btn" data-id="${user.id}"><ion-icon name="create"></ion-icon> Edit</button>
                    <button class="btn danger-btn delete-user-btn" data-id="${user.id}"><ion-icon name="trash"></ion-icon> Delete</button>
                </div>
            </div>
        `;
        userListUl.appendChild(li);
    });

    document.querySelectorAll('.edit-user-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = (e.currentTarget as HTMLElement).dataset.id!;
            editUser(id);
        });
    });

    document.querySelectorAll('.delete-user-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = (e.currentTarget as HTMLElement).dataset.id!;
            deleteUser(id);
        });
    });

    populateAssignedUserSelect();
}

function renderTasks(): void {
    taskListUl.innerHTML = '';
    const tasks = taskManager.getTasks();
    const users = taskManager.getUsers();

    if (tasks.length === 0) {
        taskListUl.innerHTML = '<li class="list-item-details">No tasks.</li>';
        return;
    }

    tasks.forEach(task => {
        const assignedUser = users.find(user => user.id === task.assignedUserId);
        const assignedUserName = assignedUser ? assignedUser.name : 'Unassigned';

        const li = document.createElement('li');
        li.className = `task-status-${task.status.toLowerCase().replace(' ', '-')}`;
        li.innerHTML = `
            <div class="list-item-header">
                <span><ion-icon name="clipboard"></ion-icon> ${task.title}</span>
                <div class="list-item-actions">
                    <button class="btn primary-btn edit-task-btn" data-id="${task.id}"><ion-icon name="create"></ion-icon> Edit</button>
                    ${task.status !== 'Completed' ? `<button class="btn success-btn complete-task-btn" data-id="${task.id}"><ion-icon name="checkmark-circle"></ion-icon> Complete</button>` : ''}
                    <button class="btn danger-btn delete-task-btn" data-id="${task.id}"><ion-icon name="trash"></ion-icon> Delete</button>
                </div>
            </div>
            <div class="list-item-details">
                <p><strong>Due Date:</strong> ${task.dueDate || 'N/A'}</p>
                <p><strong>Priority:</strong> <span class="task-priority-${task.priority.toLowerCase()}">${task.priority}</span></p>
                <p><strong>Assigned To:</strong> ${assignedUserName}</p>
                <p><strong>Status:</strong> ${task.status}</p>
            </div>
        `;
        taskListUl.appendChild(li);
    });

    document.querySelectorAll('.edit-task-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = (e.currentTarget as HTMLElement).dataset.id!;
            editTask(id);
        });
    });

    document.querySelectorAll('.complete-task-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = (e.currentTarget as HTMLElement).dataset.id!;
            markTaskComplete(id);
        });
    });

    document.querySelectorAll('.delete-task-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = (e.currentTarget as HTMLElement).dataset.id!;
            deleteTask(id);
        });
    });
}

function populateAssignedUserSelect(): void {
    taskAssignedUserSelect.innerHTML = '<option value="">Unassigned</option>';
    taskManager.getUsers().forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        taskAssignedUserSelect.appendChild(option);
    });
}

function showUserForm(isEditing: boolean = false, user?: User): void {
    userFormContainer.classList.remove('hidden');
    if (isEditing && user) {
        userFormTitle.textContent = 'Edit User';
        userIdInput.value = user.id;
        userNameInput.value = user.name;
    } else {
        userFormTitle.textContent = 'Add New User';
        userIdInput.value = '';
        userNameInput.value = '';
    }
    userNameInput.focus();
}

function hideUserForm(): void {
    userFormContainer.classList.add('hidden');
    userForm.reset();
}

function showTaskForm(isEditing: boolean = false, task?: Task): void {
    populateAssignedUserSelect();
    taskFormContainer.classList.remove('hidden');
    if (isEditing && task) {
        taskFormTitle.textContent = 'Edit Task';
        taskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskDueDateInput.value = task.dueDate;
        taskPrioritySelect.value = task.priority;
        taskAssignedUserSelect.value = task.assignedUserId || '';
        taskStatusSelect.value = task.status;
    } else {
        taskFormTitle.textContent = 'Add New Task';
        taskIdInput.value = '';
        taskTitleInput.value = '';
        taskDueDateInput.value = '';
        taskPrioritySelect.value = 'Medium'; // Default
        taskAssignedUserSelect.value = ''; // Default unassigned
        taskStatusSelect.value = 'Pending'; // Default
    }
    taskTitleInput.focus();
}

function hideTaskForm(): void {
    taskFormContainer.classList.add('hidden');
    taskForm.reset();
}


addUserBtn.addEventListener('click', () => showUserForm());
cancelUserBtn.addEventListener('click', () => hideUserForm());

userForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = userIdInput.value;
    const name = userNameInput.value.trim();

    if (!name) {
        toastBox.show('User name cannot be empty.');
        return;
    }

    if (id) {
        // Editing existing user
        taskManager.updateUser(id, name);
        toastBox.show('User updated successfully!');
    } else {
        // Adding new user
        taskManager.addUser(name);
        toastBox.show('User added successfully!');
    }
    hideUserForm();
    renderUsers();
    renderTasks(); // Re-render tasks to update assigned user names if needed
});

addTaskBtn.addEventListener('click', () => showTaskForm());
cancelTaskBtn.addEventListener('click', () => hideTaskForm());

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = taskIdInput.value;
    const title = taskTitleInput.value.trim();
    const dueDate = taskDueDateInput.value;
    const priority = taskPrioritySelect.value as 'Low' | 'Medium' | 'High';
    const assignedUserId = taskAssignedUserSelect.value || null;
    const status = taskStatusSelect.value as 'Pending' | 'In Progress' | 'Completed';

    if (!title) {
        toastBox.show('Task title cannot be empty.');
        return;
    }

    if (id) {
        taskManager.updateTask(id, {
            title,
            dueDate,
            priority,
            assignedUserId,
            status
        });
        toastBox.show('Task updated successfully!');
    } else {
        taskManager.addTask(title, dueDate, priority, assignedUserId, status);
        toastBox.show('Task added successfully!');
    }
    hideTaskForm();
    renderTasks();
});


function editUser(id: string): void {
    const user = taskManager.getUsers().find(u => u.id === id);
    if (user) {
        showUserForm(true, user);
    }
}

async function deleteUser(id: string): Promise<void> {
    const user = taskManager.getUsers().find(u => u.id === id);
    if (!user) return;

    const tasksAssignedToUser = taskManager.getTasks().filter(task => task.assignedUserId === id);

    let toast = `Are you sure you want to delete user "${user.name}"?`;
    if (tasksAssignedToUser.length > 0) {
        toast += ` This user has ${tasksAssignedToUser.length} task(s) assigned. Their tasks will become unassigned.`;
    }

    const confirmed = await confirmationModal.show(toast);

    if (confirmed) {
        if (taskManager.deleteUser(id)) {
            toastBox.show(`User "${user.name}" deleted successfully.`);
            renderUsers();
            renderTasks();
        } else {
            toastBox.show('Failed to delete user.');
        }
    }
}

function editTask(id: string): void {
    const task = taskManager.getTasks().find(t => t.id === id);
    if (task) {
        showTaskForm(true, task);
    }
}

function markTaskComplete(id: string): void {
    if (taskManager.updateTask(id, { status: 'Completed' })) {
        toastBox.show('Task marked as completed!');
        renderTasks();
    } else {
        toastBox.show('Failed to mark task as complete.');
    }
}

async function deleteTask(id: string): Promise<void> {
    const task = taskManager.getTasks().find(t => t.id === id);
    if (!task) return;

    const confirmed = await confirmationModal.show(`Are you sure you want to delete task "${task.title}"?`);

    if (confirmed) {
        if (taskManager.deleteTask(id)) {
            toastBox.show(`Task "${task.title}" deleted successfully.`);
            renderTasks();
        } else {
            toastBox.show('Failed to delete task.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderUsers();
    renderTasks();
});

