import React from 'react';
import { Todo } from '../types/Todo';
import { TodoItem } from './TodoItem';

type Props = {
  todos: Todo[];
  isLoading: boolean;
  tempTodo: Todo | null;
  deletingTodoIds: number[];
  updatingTodoIds: number[];
  onDelete: (todoId: number) => Promise<boolean>;
  onToggle: (todo: Todo) => void;
  onUpdate: (
    todoId: number,
    data: Partial<Pick<Todo, 'title' | 'completed'>>,
  ) => Promise<boolean>;
};

export const TodoList: React.FC<Props> = ({
  todos,
  isLoading,
  tempTodo,
  deletingTodoIds,
  updatingTodoIds,
  onDelete,
  onToggle,
  onUpdate,
}) => {
  if (isLoading) {
    return (
      <section className="todoapp__main" data-cy="TodoList">
        <div className="loader" />
      </section>
    );
  }

  return (
    <section className="todoapp__main" data-cy="TodoList">
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          isProcessed={
            deletingTodoIds.includes(todo.id) ||
            updatingTodoIds.includes(todo.id)
          }
          onDelete={onDelete}
          onToggle={onToggle}
          onUpdate={onUpdate}
        />
      ))}

      {tempTodo && (
        <TodoItem
          todo={tempTodo}
          isProcessed
          onDelete={onDelete}
          onToggle={onToggle}
          onUpdate={onUpdate}
        />
      )}
    </section>
  );
};
