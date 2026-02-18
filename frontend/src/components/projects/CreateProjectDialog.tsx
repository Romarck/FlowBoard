import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { projectsApi } from '@/api/projects';
import type { CreateProjectData, ProjectMethodology } from '@/types/project';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function generateKeyPreview(name: string): string {
  const words = name.trim().split(' ');
  if (words.length === 0) return '';
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }
  return words.slice(0, 4).map(w => w[0]).join('').toUpperCase();
}

export function CreateProjectDialog({ isOpen, onClose, onSuccess }: CreateProjectDialogProps) {
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    key: '',
    description: '',
    methodology: 'kanban',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      key: generateKeyPreview(name),
    }));
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      key: e.target.value.toUpperCase(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const dataToSend = {
        name: formData.name,
        key: formData.key || undefined,
        description: formData.description || undefined,
        methodology: formData.methodology,
      };
      await projectsApi.create(dataToSend);
      setFormData({
        name: '',
        key: '',
        description: '',
        methodology: 'kanban',
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Project
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={255}
              value={formData.name}
              onChange={handleNameChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Mobile App Redesign"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Key
            </label>
            <input
              type="text"
              maxLength={10}
              value={formData.key}
              onChange={handleKeyChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="Auto-generated"
            />
            <p className="mt-1 text-xs text-gray-500">
              Auto-generated from project name
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What is this project about?"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Methodology
            </label>
            <select
              value={formData.methodology}
              onChange={(e) => setFormData(prev => ({ ...prev, methodology: e.target.value as ProjectMethodology }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="kanban">Kanban</option>
              <option value="scrum">Scrum</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading && <Loader className="h-4 w-4 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
