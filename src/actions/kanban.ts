import type { UniqueIdentifier } from '@dnd-kit/core';
import type { 
  IKanban, 
  IKanbanTask, 
  IKanbanColumn, 
  IKanbanAssignee,
  IKanbanBoardList,
  IKanbanTaskPayload,
  ICreateTaskPayload,
  IKanbanBoardResponse,
} from 'src/types/kanban';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher } from 'src/utils/axios';

// ----------------------------------------------------------------------

const enableServer = true;

const KANBAN_ENDPOINT = '/board';
const EMPLOYEE_ENDPOINT = '/employees';

// Fetch all employees
export function useGetEmployees() {
  const { data, isLoading, error } = useSWR<{ data: IKanbanAssignee[] }>(
    EMPLOYEE_ENDPOINT,
    fetcher,
    swrOptions
  );

  return {
    employees: data?.data ?? [],
    employeesLoading: isLoading,
    employeesError: error,
    employeesEmpty: !isLoading && !data?.data?.length,
  };
}

const swrOptions = {
  revalidateIfStale: enableServer,
  revalidateOnFocus: enableServer,
  revalidateOnReconnect: enableServer,
};

export function useGetBoards() {
  const { data, isLoading, error } = useSWR<IKanbanBoardList>(`${KANBAN_ENDPOINT}`, fetcher, swrOptions);

  return {
    boards: data ?? [],
    boardsLoading: isLoading,
    boardsError: error,
    boardsEmpty: !isLoading && !data?.length,
  };
}

export function useGetBoard(boardId?: string) {
  const { data, isLoading, error, isValidating } = useSWR<IKanbanBoardResponse>(
    boardId ? `${KANBAN_ENDPOINT}/${boardId}` : null,
    fetcher,
    swrOptions
  );

  const memoizedValue = useMemo(() => {
    const tasks = data?.tasks ?? {};
    const currentBoardId = data?._id;
    
    console.log('useGetBoard data:', { 
      currentBoardId, 
      originalColumns: data?.columns,
      _id: data?._id 
    });
    
    // Only process columns if we have a valid boardId
    const columns = currentBoardId 
      ? (data?.columns ?? []).map((column: IKanbanColumn) => {
          console.log('Processing column:', { column, currentBoardId });
          return {
            ...column,
            boardId: currentBoardId
          };
        })
      : [];
    
    const columnIds = columns.map((column: IKanbanColumn) => column.id);

    const board = {
      tasks,
      columns,
    };

    return {
      board,
      boardId: currentBoardId,
      columnIds,
      boardLoading: isLoading,
      boardError: error,
      boardValidating: isValidating,
      boardEmpty: !isLoading && !columns.length,
    };
  }, [data?.columns, data?.tasks, data?._id, error, isLoading, isValidating]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function createColumn(columnData: IKanbanColumn) {
  try {
    const data = columnData;
    await axios.post(`${KANBAN_ENDPOINT}/column`, data);

    mutate<IKanbanBoardResponse>(
      `${KANBAN_ENDPOINT}/${columnData.boardId}`,
      (currentData) => {
        if (!currentData) return undefined;
        const columns = [...currentData.columns, columnData];
        const tasks = { ...currentData.tasks, [columnData.id]: [] };
        return { ...currentData, columns, tasks };
      },
      { revalidate: true }
    );
    
  } catch (error) {
    console.error('Error creating column:', error);
    throw new Error('Failed to create column');
  }
}

// ----------------------------------------------------------------------

export async function updateColumn(columnId: string, columnName: string, boardId: string) {
  try {
    await axios.put(`${KANBAN_ENDPOINT}/column`, { columnName, columnId, boardId });

    mutate<IKanbanBoardResponse>(
      `${KANBAN_ENDPOINT}/${boardId}`,
      (currentData) => {
        if (!currentData) return undefined;
        const updatedColumns = currentData.columns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                name: columnName,
              }
            : column
        );
        return { ...currentData, columns: updatedColumns };
      },
      { revalidate: false }
    );
  } catch (error) {
    console.error("Failed to update column:", error);
    throw new Error("Server error while updating the column");
  }
}

// ----------------------------------------------------------------------
export async function deleteColumn(boardId: string, columnIds: string) {
  try {
    await axios.delete(`${KANBAN_ENDPOINT}/column/${columnIds}/${boardId}`);

    mutate<IKanbanBoardResponse>(
      `${KANBAN_ENDPOINT}/${boardId}`,
      (currentData) => {
        if (!currentData) return undefined;
        const updatedColumns = currentData.columns.filter(
          (column) => column.id !== columnIds
        );
        const tasks = Object.keys(currentData.tasks)
          .filter((key) => key !== columnIds)
          .reduce((obj: Record<string, IKanbanTask[]>, key) => {
            obj[key] = currentData.tasks[key];
            return obj;
          }, {});
        return { ...currentData, columns: updatedColumns, tasks };
      },
      { revalidate: true }
    );
  } catch (error) {
    console.error('Error deleting column:', error);
    throw new Error('Failed to delete column');
  }
}

// ----------------------------------------------------------------------

export async function moveColumn(updateColumns: IKanbanColumn[]) {
  const boardId = updateColumns[0]?.boardId;
  if (!boardId) {
    console.error('No board ID found in columns');
    return;
  }

  try {
    // First update the local state optimistically
    mutate<IKanbanBoardResponse>(
      `${KANBAN_ENDPOINT}/${boardId}`,
      (currentData) => {
        if (!currentData) return undefined;
        return { ...currentData, columns: updateColumns };
      },
      { revalidate: false }
    );

    if (enableServer) {
      // Prepare the payload as expected by the backend
      const payload = {
        boardId,
        columns: updateColumns.map((col, index) => ({
          columnId: col.id,
          order: index,
        })),
      };

      // Make the API call
      await axios.post(`${KANBAN_ENDPOINT}/column/move`, payload);
      
      // Revalidate after successful move
      mutate(`${KANBAN_ENDPOINT}/${boardId}`);
    }
  } catch (error) {
    console.error('Error moving column:', error);
    // Revert the optimistic update on error
    mutate(`${KANBAN_ENDPOINT}/${boardId}`);
    throw new Error('Failed to move column');
  }
}

// ----------------------------------------------------------------------

export async function clearColumn(columnId: UniqueIdentifier, boardId: string) {
  if (enableServer) {
    const data = { columnId };
    await axios.post(`${KANBAN_ENDPOINT}/column/clear`, data);
  }

  mutate<IKanbanBoardResponse>(
    `${KANBAN_ENDPOINT}/${boardId}`,
    (currentData) => {
      if (!currentData) return undefined;
      const tasks = { ...currentData.tasks, [columnId]: [] };
      return { ...currentData, tasks };
    },
    { revalidate: false }
  );
}

// ----------------------------------------------------------------------

export async function createTask(columnId: UniqueIdentifier, boardId: string, taskData: IKanbanTask) {
  if (enableServer) {
    try {
      if (!boardId) {
        throw new Error('Board ID is required to create a task');
      }

      const taskPayload: IKanbanTaskPayload = {
        id: String(taskData.id),
        columnId: String(columnId),
        name: taskData.name,
        status: taskData.status,
        priority: taskData.priority,
        labels: taskData.labels,
        description: taskData.description,
        attachments: taskData.attachments,
        comments: taskData.comments.map(comment => ({
          employee: comment.id as string,
          messageType: comment.messageType,
          message: comment.message,
          createdAt: comment.createdAt ? new Date(comment.createdAt).toISOString() : new Date().toISOString()
        })),
        assignee: taskData.assignee.map(assignee => ({
          employee: assignee.id
        })),
        due: [taskData.due[0] ? new Date(taskData.due[0]).toISOString() : new Date().toISOString()],
      };

      const payload: ICreateTaskPayload = {
        columnId: String(columnId),
        boardId,
        task: taskPayload,
      };

      await axios.post(`${KANBAN_ENDPOINT}/task`, payload);
    } catch (error: any) {
      console.error('Error creating task:', error.message || error);
      throw new Error(error?.message || 'Failed to create task');
    }
  }

  mutate<IKanbanBoardResponse>(
    `${KANBAN_ENDPOINT}/${boardId}`,
    (currentData) => {
      if (!currentData) return undefined;
      const tasks = {
        ...currentData.tasks,
        [columnId]: [taskData, ...(currentData.tasks[columnId] || [])],
      };
      return { ...currentData, tasks };
    },
    { revalidate: false }
  );
}


// ----------------------------------------------------------------------

export async function updateTask(columnId: UniqueIdentifier, boardId: string, taskData: IKanbanTask) {
  if (enableServer) {
    const data = {
      columnId,
      boardId,
      taskData: {
        ...taskData,
        assignee: taskData.assignee.map(assignee => assignee._id), // Send only _id
        priority: taskData.priority // Include priority
      }
    };
    await axios.put(`${KANBAN_ENDPOINT}/task`, data);
  }

  mutate<IKanbanBoardResponse>(
    `${KANBAN_ENDPOINT}/${boardId}`,
    (currentData) => {
      if (!currentData) return undefined;
      const tasksInColumn = currentData.tasks[columnId];
      const updateTasks = tasksInColumn.map((task) =>
        task.id === taskData.id
          ? {
              ...task,
              ...taskData,
            }
          : task
      );
      const tasks = { ...currentData.tasks, [columnId]: updateTasks };
      return { ...currentData, tasks };
    },
    { revalidate: false }
  );
}

// ----------------------------------------------------------------------

export async function moveTask(updateTasks: IKanban['tasks'], boardId: string) {
  mutate<IKanbanBoardResponse>(
    `${KANBAN_ENDPOINT}/${boardId}`,
    (currentData) => {
      if (!currentData) return undefined;
      return { ...currentData, tasks: updateTasks };
    },
    { revalidate: false }
  );

  if (enableServer) {
    const data = { boardId, updateTasks };
    await axios.post(`${KANBAN_ENDPOINT}/task/move`, data);
  }
}

// ----------------------------------------------------------------------

export async function deleteTask(columnId: UniqueIdentifier, taskId: UniqueIdentifier, boardId: string) {
  if (enableServer) {
    await axios.delete(`${KANBAN_ENDPOINT}/task/${columnId}/${taskId}/${boardId}`);
  }

  mutate<IKanbanBoardResponse>(
    `${KANBAN_ENDPOINT}/${boardId}`,
    (currentData) => {
      if (!currentData) return undefined;
      const tasks = {
        ...currentData.tasks,
        [columnId]: currentData.tasks[columnId].filter((task) => task.id !== taskId),
      };
      return { ...currentData, tasks };
    },
    { revalidate: false }
  );
}
