import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import {
  USER_ID,
  addTodo,
  deleteTodo,
  getTodos,
  updateTodo,
} from './api/todos';
import { Todo } from './types/Todo';
import { Filter } from './types/Filter';
import { TodoList } from './components/TodoList';
import { TodoFooter } from './components/TodoFooter';
import { TodoError } from './components/TodoError';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const [deletingTodoIds, setDeletingTodoIds] = useState<number[]>([]);
  const [updatingTodoIds, setUpdatingTodoIds] = useState<number[]>([]);

  const [filter, setFilter] = useState<Filter>(Filter.All);
  const [errorMessage, setErrorMessage] = useState('');

  const newTodoField = useRef<HTMLInputElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = (message: string) => {
    setErrorMessage(message);

    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }

    errorTimerRef.current = setTimeout(() => {
      setErrorMessage('');
      errorTimerRef.current = null;
    }, 3000);
  };

  const handleHideError = () => {
    setErrorMessage('');

    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  };

  const loadTodos = async () => {
    try {
      const loadedTodos = await getTodos();

      setTodos(loadedTodos);
    } catch {
      showError('Unable to load todos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTodos();

    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

  const handleAddTodo = async (title: string): Promise<boolean> => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      showError('Title should not be empty');
      newTodoField.current?.focus();

      return false;
    }

    const temporaryTodo: Todo = {
      id: 0,
      userId: USER_ID,
      title: trimmedTitle,
      completed: false,
    };

    setTempTodo(temporaryTodo);

    try {
      const newTodo = await addTodo(trimmedTitle);

      setTodos(currentTodos => [...currentTodos, newTodo]);

      setTempTodo(null);

      return true;
    } catch {
      setTempTodo(null);
      showError('Unable to add a todo');

      return false;
    }
  };

  const handleDeleteTodo = async (todoId: number): Promise<boolean> => {
    setDeletingTodoIds(currentIds => [...currentIds, todoId]);

    try {
      await deleteTodo(todoId);

      setTodos(currentTodos => currentTodos.filter(todo => todo.id !== todoId));

      return true;
    } catch {
      showError('Unable to delete a todo');

      return false;
    } finally {
      setDeletingTodoIds(currentIds => currentIds.filter(id => id !== todoId));
    }
  };

  const handleToggleTodo = async (todo: Todo): Promise<void> => {
    setUpdatingTodoIds(currentIds => [...currentIds, todo.id]);

    try {
      const updatedTodo = await updateTodo(todo.id, {
        completed: !todo.completed,
      });

      setTodos(currentTodos =>
        currentTodos.map(currentTodo =>
          currentTodo.id === todo.id ? updatedTodo : currentTodo,
        ),
      );
    } catch {
      showError('Unable to update a todo');
    } finally {
      setUpdatingTodoIds(currentIds => currentIds.filter(id => id !== todo.id));
    }
  };

  const handleUpdateTodo = async (
    todo: Todo,
    title: string,
  ): Promise<boolean> => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return handleDeleteTodo(todo.id);
    }

    if (trimmedTitle === todo.title) {
      return true;
    }

    setUpdatingTodoIds(currentIds => [...currentIds, todo.id]);

    try {
      const updatedTodo = await updateTodo(todo.id, {
        title: trimmedTitle,
      });

      setTodos(currentTodos =>
        currentTodos.map(currentTodo =>
          currentTodo.id === todo.id ? updatedTodo : currentTodo,
        ),
      );

      return true;
    } catch {
      showError('Unable to update a todo');

      return false;
    } finally {
      setUpdatingTodoIds(currentIds => currentIds.filter(id => id !== todo.id));
    }
  };

  const handleToggleAll = async () => {
    if (todos.length === 0) {
      return;
    }

    const shouldCompleteAll = todos.some(todo => !todo.completed);

    const todosToUpdate = todos.filter(
      todo => todo.completed !== shouldCompleteAll,
    );

    await Promise.all(todosToUpdate.map(todo => handleToggleTodo(todo)));
  };

  const handleClearCompleted = async () => {
    const completedTodos = todos.filter(todo => todo.completed);

    await Promise.all(completedTodos.map(todo => handleDeleteTodo(todo.id)));
  };

  const visibleTodos = todos.filter(todo => {
    switch (filter) {
      case Filter.Active:
        return !todo.completed;

      case Filter.Completed:
        return todo.completed;

      case Filter.All:
      default:
        return true;
    }
  });

  const activeTodosCount = todos.filter(todo => !todo.completed).length;

  const hasCompletedTodos = todos.some(todo => todo.completed);

  const areAllTodosCompleted =
    todos.length > 0 && todos.every(todo => todo.completed);

  return (
    <>
      <div className="todoapp">
        <h1 className="todoapp__title">todos</h1>

        <div className="todoapp__content">
          <header className="todoapp__header">
            {todos.length > 0 && (
              <button
                type="button"
                className={`todoapp__toggle-all ${
                  areAllTodosCompleted ? 'active' : ''
                }`}
                data-cy="ToggleAllButton"
                aria-label="Toggle all todos"
                onClick={handleToggleAll}
              />
            )}

            <form
              onSubmit={event => {
                event.preventDefault();

                const input = newTodoField.current;

                if (!input) {
                  return;
                }

                void handleAddTodo(input.value).then(success => {
                  if (success) {
                    input.value = '';
                  }

                  input.focus();
                });
              }}
            >
              <input
                ref={newTodoField}
                name="newTodo"
                type="text"
                className="todoapp__new-todo"
                data-cy="NewTodoField"
                placeholder="What needs to be done?"
                disabled={tempTodo !== null}
                autoFocus
              />
            </form>
          </header>

          <TodoList
            todos={visibleTodos}
            isLoading={isLoading}
            tempTodo={tempTodo}
            deletingTodoIds={deletingTodoIds}
            updatingTodoIds={updatingTodoIds}
            onDelete={handleDeleteTodo}
            onToggle={handleToggleTodo}
            onUpdate={handleUpdateTodo}
          />

          {todos.length > 0 && (
            <TodoFooter
              filter={filter}
              activeTodosCount={activeTodosCount}
              hasCompletedTodos={hasCompletedTodos}
              onFilterChange={setFilter}
              onClearCompleted={handleClearCompleted}
            />
          )}
        </div>
      </div>

      <TodoError message={errorMessage} onHide={handleHideError} />

      <UserWarning />
    </>
  );
};
