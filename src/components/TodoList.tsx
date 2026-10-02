import React from 'react';
import { Todo } from '../types/Todo';
import { TodoItem } from './TodoItem';

type Props = {
  todos: Todo[];
  isLoading: boolean;
  tempTodo: Todo | null;
  deletingTodoIds: number[];
  updatingTodoIds: number[];
  onDelete: (todoId: number) => void;
  onToggle: (todo: Todo) => void;
};

export const TodoList: React.FC<Props> = ({
  todos,
  isLoading,
  tempTodo,
  deletingTodoIds,
  updatingTodoIds,
  onDelete,
  onToggle,
}) => {
  if (isLoading) {
    return (
      <section className="todoapp__main">
        <div data-cy="Loader" className="loader" />
      </section>
    );
  }

  return (
    <section className="todoapp__main">
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          isProcessed={
            deletingTodoIds.includes(todo.id) ||
            updatingTodoIds.includes(todo.id)
          }
          onDelete={() => onDelete(todo.id)}
          onToggle={() => onToggle(todo)}
        />
      ))}

      {tempTodo && <TodoItem todo={tempTodo} isProcessed onToggle={() => {}} />}
    </section>
  );
};
