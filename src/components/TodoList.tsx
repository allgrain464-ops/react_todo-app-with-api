import React from 'react';
import classNames from 'classnames';
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
  onUpdate: (todo: Todo, title: string) => Promise<boolean>;
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
          onDelete={todoId => {
            void onDelete(todoId);
          }}
          onToggle={() => onToggle(todo)}
          onUpdate={onUpdate}
        />
      ))}

      {tempTodo && (
        <TodoItem
          key={tempTodo.id}
          todo={tempTodo}
          isProcessed
          onToggle={() => {}}
          onUpdate={async () => false}
        />
      )}

      {isLoading && (
        <div className="todoapp__main-loader">
          <div
            className={classNames('loader', {
              'is-loading': isLoading,
            })}
          />
        </div>
      )}
    </section>
  );
};
