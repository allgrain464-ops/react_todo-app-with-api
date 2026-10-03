import React, { FormEvent, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { Todo } from '../types/Todo';

type Props = {
  todo: Todo;
  isProcessed: boolean;
  onDelete: (todoId: number) => Promise<boolean>;
  onToggle: (todo: Todo) => void;
  onUpdate: (
    todoId: number,
    data: Partial<Pick<Todo, 'title' | 'completed'>>,
  ) => Promise<boolean>;
};

export const TodoItem: React.FC<Props> = ({
  todo,
  isProcessed,
  onDelete,
  onToggle,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);

  const inputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setTitle(todo.title);
    }
  }, [todo.title, isEditing]);

  const startEditing = () => {
    if (isProcessed) {
      return;
    }

    setTitle(todo.title);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (savingRef.current) {
      return;
    }

    setTitle(todo.title);
    setIsEditing(false);
  };

  const saveTitle = async () => {
    if (savingRef.current) {
      return;
    }

    const newTitle = title.trim();

    if (newTitle === todo.title) {
      setTitle(todo.title);
      setIsEditing(false);

      return;
    }

    if (newTitle === '') {
      savingRef.current = true;

      const success = await onDelete(todo.id);

      savingRef.current = false;

      if (success) {
        setIsEditing(false);
      }

      return;
    }

    savingRef.current = true;

    const success = await onUpdate(todo.id, {
      title: newTitle,
    });

    savingRef.current = false;

    if (success) {
      setTitle(newTitle);
      setIsEditing(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    void saveTitle();
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      cancelEditing();
    }
  };

  const handleBlur = () => {
    void saveTitle();
  };

  const checkboxId = `todo-status-${todo.id}`;

  return (
    <li
      className={classNames('todo', {
        completed: todo.completed,
        editing: isEditing,
      })}
      data-cy="Todo"
    >
      {!isEditing && (
        <div className="view">
          <input
            id={checkboxId}
            data-cy="TodoStatus"
            className="todo__status"
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo)}
            disabled={isProcessed}
            aria-label="Toggle todo status"
          />

          <span
            data-cy="TodoTitle"
            className="todo__title"
            onDoubleClick={startEditing}
          >
            {todo.title}
          </span>

          <button
            type="button"
            className="todo__remove"
            data-cy="TodoDelete"
            onClick={() => {
              void onDelete(todo.id);
            }}
            disabled={isProcessed}
          >
            ×
          </button>
        </div>
      )}

      {isEditing && (
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            data-cy="TodoTitleField"
            className="todo__edit"
            type="text"
            value={title}
            onChange={event => setTitle(event.target.value)}
            onBlur={handleBlur}
            onKeyUp={handleKeyUp}
            disabled={isProcessed}
          />
        </form>
      )}

      <div
        data-cy="TodoLoader"
        className={classNames('modal', 'overlay', {
          'is-active': isProcessed,
        })}
      >
        <div className="modal-background" />
        <div className="loader" />
      </div>
    </li>
  );
};
