import React, { useEffect, useRef, useState } from 'react';
import { Todo } from '../types/Todo';

type Props = {
  todo: Todo;
  isProcessed: boolean;
  onDelete?: (todoId: number) => void;
  onToggle: () => void;
  onUpdate: (todo: Todo, title: string) => Promise<boolean>;
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

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setTitle(todo.title);
  }, [todo.title]);

  const startEditing = () => {
    if (isProcessed) {
      return;
    }

    setTitle(todo.title);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setTitle(todo.title);
    setIsEditing(false);
  };

  const saveTitle = async () => {
    const newTitle = title.trim();

    if (!newTitle) {
      if (onDelete) {
        onDelete(todo.id);
      }

      return;
    }

    if (newTitle === todo.title) {
      setIsEditing(false);

      return;
    }

    const success = await onUpdate(todo, newTitle);

    if (success) {
      setIsEditing(false);
    }
  };

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Enter') {
      await saveTitle();
    }

    if (event.key === 'Escape') {
      cancelEditing();
    }
  };

  if (isEditing) {
    return (
      <div className="todo">
        <div className="todo__status-label">
          <input
            type="checkbox"
            className="todo__status"
            checked={todo.completed}
            onChange={onToggle}
            disabled
          />
        </div>

        <form
          onSubmit={event => {
            event.preventDefault();
            void saveTitle();
          }}
          className="todo__form"
        >
          <input
            ref={inputRef}
            type="text"
            className="todo__title-field"
            value={title}
            onChange={event => setTitle(event.target.value)}
            onBlur={() => {
              void saveTitle();
            }}
            onKeyDown={handleKeyDown}
            disabled={isProcessed}
            data-cy="TodoTitleField"
          />
        </form>
      </div>
    );
  }

  return (
    <div className={`todo ${todo.completed ? 'completed' : ''}`} data-cy="Todo">
      <div className="todo__status-label">
        <input
          type="checkbox"
          className="todo__status"
          checked={todo.completed}
          onChange={onToggle}
          disabled={isProcessed}
          data-cy="TodoStatus"
        />
      </div>

      <span
        className="todo__title"
        onDoubleClick={startEditing}
        data-cy="TodoTitle"
      >
        {todo.title}
      </span>

      <button
        type="button"
        className="todo__remove"
        onClick={() => onDelete?.(todo.id)}
        disabled={isProcessed}
        data-cy="TodoDelete"
      >
        ×
      </button>

      {isProcessed && (
        <div className="modal overlay" data-cy="TodoLoader">
          <div className="modal-background has-background-white-ter" />
          <div className="loader" />
        </div>
      )}
    </div>
  );
};
