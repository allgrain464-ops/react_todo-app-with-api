import React, { useEffect, useRef, useState } from 'react';
import { Todo } from '../types/Todo';

type Props = {
  todo: Todo;
  isProcessed: boolean;
  onDelete?: () => void;
  onToggle: () => void;
  onUpdate: (todoId: number, title: string) => void;
};

export const TodoItem: React.FC<Props> = ({
  todo,
  isProcessed,
  onDelete,
  onToggle,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const editInputRef = useRef<HTMLInputElement>(null);
  const submittedTitleRef = useRef<string | null>(null);
  const finishingRef = useRef(false);

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [isEditing]);

  // API update succeeded: todo.title changed from the server.
  useEffect(() => {
    if (
      isEditing &&
      submittedTitleRef.current !== null &&
      todo.title === submittedTitleRef.current
    ) {
      submittedTitleRef.current = null;
      finishingRef.current = false;
      setIsEditing(false);
    }
  }, [todo.title, isEditing]);

  const startEditing = () => {
    if (isProcessed) {
      return;
    }

    setEditTitle(todo.title);
    submittedTitleRef.current = null;
    finishingRef.current = false;
    setIsEditing(true);
  };

  const handleEditChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditTitle(event.target.value);
  };

  const saveEdit = () => {
    if (finishingRef.current) {
      return;
    }

    const trimmedTitle = editTitle.trim();

    // Empty title = delete todo.
    if (!trimmedTitle) {
      finishingRef.current = true;
      setIsEditing(false);
      onDelete?.();

      return;
    }

    // Same title = cancel editing, no API request.
    if (trimmedTitle === todo.title) {
      finishingRef.current = true;
      setIsEditing(false);

      return;
    }

    // Keep the form open while the API request is pending.
    finishingRef.current = true;
    submittedTitleRef.current = trimmedTitle;

    onUpdate(todo.id, trimmedTitle);
  };

  const cancelEdit = () => {
    if (isProcessed) {
      return;
    }

    submittedTitleRef.current = null;
    finishingRef.current = false;
    setEditTitle(todo.title);
    setIsEditing(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    saveEdit();
  };

  const handleEditKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    }
  };

  const handleEditBlur = () => {
    saveEdit();
  };

  return (
    <div data-cy="Todo" className={`todo ${todo.completed ? 'completed' : ''}`}>
      <div className="todo__status-label">
        <input
          data-cy="TodoStatus"
          type="checkbox"
          className="todo__status"
          checked={todo.completed}
          onChange={onToggle}
          disabled={isProcessed || isEditing}
          aria-label={`Mark "${todo.title}" as completed`}
        />
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <input
            ref={editInputRef}
            data-cy="TodoTitleField"
            type="text"
            className="todo__title-field"
            value={editTitle}
            onChange={handleEditChange}
            onBlur={handleEditBlur}
            onKeyUp={handleEditKeyUp}
            disabled={isProcessed}
          />
        </form>
      ) : (
        <span
          data-cy="TodoTitle"
          className="todo__title"
          onDoubleClick={startEditing}
        >
          {todo.title}
        </span>
      )}

      {!isEditing && (
        <button
          type="button"
          className="todo__remove"
          data-cy="TodoDelete"
          onClick={onDelete}
          disabled={isProcessed}
        >
          ×
        </button>
      )}

      <div
        data-cy="TodoLoader"
        className={`modal overlay ${isProcessed ? 'is-active' : ''}`}
      >
        <div className="modal-background has-background-white-ter" />
        <div className="loader" />
      </div>
    </div>
  );
};
