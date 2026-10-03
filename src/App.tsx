import React, { FormEvent, useEffect, useRef, useState } from 'react';

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

const USER_ID_REQUIRED = USER_ID;

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>(Filter.All);

  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const [deletingTodoIds, setDeletingTodoIds] = useState<number[]>([]);
  const [updatingTodoIds, setUpdatingTodoIds] = useState<number[]>([]);

  const [errorMessage, setErrorMessage] = useState('');

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => {
        setErrorMessage('Unable to load todos');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, [todos, tempTodo]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    setErrorMessage('');

    const newTodo: Todo = {
      id: 0,
      userId: USER_ID_REQUIRED,
      title: trimmedTitle,
      completed: false,
    };

    setTempTodo(newTodo);

    try {
      const createdTodo = await addTodo(trimmedTitle);

      setTodos(currentTodos => [...currentTodos, createdTodo]);
      setTitle('');
    } catch {
      setErrorMessage('Unable to add a todo');
    } finally {
      setTempTodo(null);
    }
  };

  const handleDeleteTodo = async (todoId: number): Promise<boolean> => {
    setErrorMessage('');

    setDeletingTodoIds(currentIds => [...currentIds, todoId]);

    try {
      await deleteTodo(todoId);

      setTodos(currentTodos => currentTodos.filter(todo => todo.id !== todoId));

      return true;
    } catch {
      setErrorMessage('Unable to delete a todo');

      return false;
    } finally {
      setDeletingTodoIds(currentIds => currentIds.filter(id => id !== todoId));
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    setErrorMessage('');

    setUpdatingTodoIds(currentIds => [...currentIds, todo.id]);

    try {
      const updatedTodo = await updateTodo(todo.id, {
        completed: !todo.completed,
      });

      setTodos(currentTodos =>
        currentTodos.map(currentTodo =>
          currentTodo.id === updatedTodo.id ? updatedTodo : currentTodo,
        ),
      );
    } catch {
      setErrorMessage('Unable to update a todo');
    } finally {
      setUpdatingTodoIds(currentIds => currentIds.filter(id => id !== todo.id));
    }
  };

  const handleUpdateTodo = async (
    todo: Todo,
    newTitle: string,
  ): Promise<boolean> => {
    setErrorMessage('');

    setUpdatingTodoIds(currentIds => [...currentIds, todo.id]);

    try {
      const updatedTodo = await updateTodo(todo.id, {
        title: newTitle,
      });

      setTodos(currentTodos =>
        currentTodos.map(currentTodo =>
          currentTodo.id === updatedTodo.id ? updatedTodo : currentTodo,
        ),
      );

      return true;
    } catch {
      setErrorMessage('Unable to update a todo');

      return false;
    } finally {
      setUpdatingTodoIds(currentIds => currentIds.filter(id => id !== todo.id));
    }
  };

  const handleClearCompleted = async () => {
    const completedTodos = todos.filter(todo => todo.completed);

    if (completedTodos.length === 0) {
      return;
    }

    setErrorMessage('');

    setDeletingTodoIds(completedTodos.map(todo => todo.id));

    const results = await Promise.allSettled(
      completedTodos.map(todo => deleteTodo(todo.id)),
    );

    const successfulIds = completedTodos
      .filter((_, index) => results[index].status === 'fulfilled')
      .map(todo => todo.id);

    const hasErrors = results.some(result => result.status === 'rejected');

    setTodos(currentTodos =>
      currentTodos.filter(todo => !successfulIds.includes(todo.id)),
    );

    setDeletingTodoIds([]);

    if (hasErrors) {
      setErrorMessage('Unable to delete a todo');
    }
  };

  const activeTodos = todos.filter(todo => !todo.completed);

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

  const handleToggleAll = async () => {
    const shouldComplete = activeTodos.length > 0;

    const todosToUpdate = todos.filter(todo =>
      shouldComplete ? !todo.completed : todo.completed,
    );

    if (todosToUpdate.length === 0) {
      return;
    }

    setErrorMessage('');

    setUpdatingTodoIds(todosToUpdate.map(todo => todo.id));

    const results = await Promise.allSettled(
      todosToUpdate.map(todo =>
        updateTodo(todo.id, {
          completed: shouldComplete,
        }),
      ),
    );

    const successfulTodos = results
      .map((result, index) => ({
        result,
        todo: todosToUpdate[index],
      }))
      .filter(item => item.result.status === 'fulfilled')
      .map(item => {
        if (item.result.status === 'fulfilled') {
          return item.result.value;
        }

        return item.todo;
      });

    setTodos(currentTodos =>
      currentTodos.map(todo => {
        const updatedTodo = successfulTodos.find(item => item.id === todo.id);

        return updatedTodo || todo;
      }),
    );

    setUpdatingTodoIds([]);

    if (results.some(result => result.status === 'rejected')) {
      setErrorMessage('Unable to update a todo');
    }
  };

  if (!USER_ID_REQUIRED) {
    return <UserWarning />;
  }

  const hasTodos = todos.length > 0;

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {hasTodos && (
            <button
              type="button"
              className={`
                todoapp__toggle-all
                ${activeTodos.length === 0 ? 'active' : ''}
              `}
              data-cy="ToggleAllButton"
              onClick={handleToggleAll}
              disabled={isLoading || updatingTodoIds.length > 0}
            />
          )}

          <form onSubmit={handleSubmit}>
            <input
              ref={titleInputRef}
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={title}
              onChange={event => setTitle(event.target.value)}
              disabled={tempTodo !== null}
              data-cy="NewTodoField"
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

        {hasTodos && (
          <TodoFooter
            todos={todos}
            filter={filter}
            setFilter={setFilter}
            onClearCompleted={handleClearCompleted}
          />
        )}
      </div>

      {errorMessage && (
        <TodoError message={errorMessage} onClose={() => setErrorMessage('')} />
      )}
    </div>
  );
};
