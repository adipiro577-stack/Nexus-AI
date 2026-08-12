import React, { useState } from 'react';
import { TaskItem } from '../types';
import { Kanban, Plus, User, Clock, AlertCircle, CheckCircle2, ChevronRight, Tag } from 'lucide-react';

interface TasksViewProps {
  tasks: TaskItem[];
  onAddTask: (task: TaskItem) => void;
  onUpdateTaskStatus: (id: string, status: TaskItem['status']) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ tasks, onAddTask, onUpdateTaskStatus }) => {
  const [filterModule, setFilterModule] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState('Vortex System');
  const [newPriority, setNewPriority] = useState<TaskItem['priority']>('high');
  const [newModule, setNewModule] = useState('Backend');

  const columns: { id: TaskItem['status']; title: string; color: string }[] = [
    { id: 'backlog', title: 'BACKLOG', color: 'border-white/20' },
    { id: 'in-progress', title: 'IN PROGRESS', color: 'border-[#C5A059]' },
    { id: 'review', title: 'CODE REVIEW', color: 'border-blue-400' },
    { id: 'done', title: 'COMPLETED', color: 'border-emerald-400' }
  ];

  const filteredTasks = tasks.filter(t => filterModule === 'all' || t.module.toLowerCase() === filterModule.toLowerCase());

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newTask: TaskItem = {
      id: 'task-' + Date.now(),
      title: newTitle,
      description: newDesc,
      status: 'in-progress',
      priority: newPriority,
      assignee: newAssignee,
      module: newModule,
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
    };

    onAddTask(newTask);
    setNewTitle('');
    setNewDesc('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121212] p-6 rounded-sm border border-white/10">
        <div>
          <div className="flex items-center space-x-2 text-[#C5A059] text-xs font-mono tracking-widest uppercase mb-1">
            <Kanban className="w-4 h-4" />
            <span>SPRINT & KANBAN MANAGEMENT</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">Autonomous Task Board</h1>
          <p className="text-xs text-white/50 mt-1">Track tasks, AI agent assignments, code reviews, and milestone execution across engineering modules.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 text-xs font-mono tracking-wider uppercase bg-[#C5A059] hover:bg-[#d9b36a] text-black font-semibold rounded-sm transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>NEW TASK</span>
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="bg-[#121212] border border-white/10 rounded-sm p-4 space-y-4 flex flex-col">
              <div className={`flex items-center justify-between border-b-2 ${col.color} pb-3`}>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-white tracking-wider">{col.title}</span>
                </div>
                <span className="text-[10px] font-mono text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-xs">
                  {colTasks.length} TASKS
                </span>
              </div>

              {/* Task Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                {colTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs font-mono text-white/30 border border-dashed border-white/5 rounded-sm">
                    NO TASKS IN {col.title}
                  </div>
                ) : (
                  colTasks.map(task => (
                    <div
                      key={task.id}
                      className="bg-[#0A0A0A] border border-white/10 hover:border-[#C5A059]/50 p-4 rounded-sm space-y-3 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono tracking-wider uppercase text-white/40 bg-white/5 px-2 py-0.5 rounded-xs flex items-center space-x-1">
                          <Tag className="w-2.5 h-2.5 text-[#C5A059]" />
                          <span>{task.module}</span>
                        </span>
                        <span className={`text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-xs ${
                          task.priority === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-white group-hover:text-[#C5A059] transition-colors">{task.title}</h4>
                      <p className="text-xs text-white/50 line-clamp-2">{task.description}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono text-white/40">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-[#C5A059]" />
                          <span>{task.assignee}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.dueDate}</span>
                        </div>
                      </div>

                      {/* Move status buttons */}
                      <div className="flex items-center justify-end space-x-1 pt-1">
                        {col.id !== 'backlog' && (
                          <button
                            onClick={() => onUpdateTaskStatus(task.id, col.id === 'done' ? 'review' : col.id === 'review' ? 'in-progress' : 'backlog')}
                            className="text-[9px] font-mono text-white/40 hover:text-white px-2 py-1 bg-white/5 rounded-xs"
                          >
                            ← PREV
                          </button>
                        )}
                        {col.id !== 'done' && (
                          <button
                            onClick={() => onUpdateTaskStatus(task.id, col.id === 'backlog' ? 'in-progress' : col.id === 'in-progress' ? 'review' : 'done')}
                            className="text-[9px] font-mono text-[#C5A059] hover:text-white px-2 py-1 bg-[#C5A059]/10 hover:bg-[#C5A059] hover:text-black rounded-xs transition-colors flex items-center space-x-1"
                          >
                            <span>NEXT</span>
                            <ChevronRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 rounded-sm max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-serif font-bold text-white">Create Sprint Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">TASK TITLE</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement Celery async task queue"
                  className="w-full bg-[#0D0D0D] border border-white/10 rounded-sm px-3 py-2 text-sm text-white focus:border-[#C5A059] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">DESCRIPTION</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Details of the task execution requirement"
                  rows={3}
                  className="w-full bg-[#0D0D0D] border border-white/10 rounded-sm px-3 py-2 text-sm text-white focus:border-[#C5A059] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1">ASSIGNEE AGENT</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full bg-[#0D0D0D] border border-white/10 rounded-sm px-3 py-2 text-xs text-white focus:border-[#C5A059] outline-none"
                  >
                    <option value="Vortex System">Vortex System (Arch)</option>
                    <option value="Aura Full-Stack">Aura Full-Stack (Dev)</option>
                    <option value="Cipher Schema">Cipher Schema (DB)</option>
                    <option value="Sentinel Security">Sentinel Security (Auditor)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1">MODULE</label>
                  <input
                    type="text"
                    value={newModule}
                    onChange={(e) => setNewModule(e.target.value)}
                    className="w-full bg-[#0D0D0D] border border-white/10 rounded-sm px-3 py-2 text-xs text-white focus:border-[#C5A059] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-white/60 hover:text-white uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-mono bg-[#C5A059] hover:bg-[#d9b36a] text-black font-semibold rounded-sm uppercase"
                >
                  CREATE TASK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
