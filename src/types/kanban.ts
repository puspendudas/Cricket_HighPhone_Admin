import type { UniqueIdentifier } from '@dnd-kit/core';

import type { IDateValue } from './common';

// UI Display Types
export type IKanbanComment = {
  id: UniqueIdentifier;
  name: string;
  message: string;
  avatarUrl: string;
  messageType: 'image' | 'text';
  createdAt: IDateValue;
};

export type IKanbanAssignee = {
  id: string;
  _id: string;
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  status: string;
  address: string;
  avatarUrl: string;
  phoneNumber: string;
  lastActivity: IDateValue;
};

export type IKanbanTask = {
  id: UniqueIdentifier;
  name: string;
  status: string;
  priority: string;
  labels: string[];
  description?: string;
  attachments: string[];
  comments: IKanbanComment[];
  assignee: IKanbanAssignee[];
  due: [IDateValue, IDateValue];
  reporter: {
    id: string;
    name: string;
    avatarUrl: string;
  };
};

// API Payload Types
export type IKanbanCommentPayload = {
  employee: string; // Employee ObjectId
  messageType: 'text' | 'image';
  message: string;
  createdAt: string;
};

export type IKanbanAssigneePayload = {
  employee: string; // Employee ObjectId
};

export type IKanbanTaskPayload = {
  id: string;
  columnId: string;
  name: string;
  status: string;
  priority: string;
  labels: string[];
  description?: string;
  attachments: string[];
  comments: IKanbanCommentPayload[];
  assignee: IKanbanAssigneePayload[];
  due: string[];
};

export type ICreateTaskPayload = {
  boardId: string;
  columnId: string;
  task: IKanbanTaskPayload;
};

// Kanban Column Type
export type IKanbanColumn = {
  name: string;
  boardId: string;
  columnName: string;
  id: string;
};

// Kanban Board Type
export type IKanban = {
  tasks: Record<UniqueIdentifier, IKanbanTask[]>;
  columns: IKanbanColumn[];
};

// Board List Type
export type IKanbanBoard = {
  _id: string;
  name: string;
};

export type IKanbanBoardList = IKanbanBoard[];

export type IKanbanBoardResponse = {
  _id: string;
  name: string;
  tasks: Record<string, IKanbanTask[]>;
  columns: IKanbanColumn[];
  __v: number;
};
