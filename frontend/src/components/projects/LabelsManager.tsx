import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLabels, useCreateLabel, useUpdateLabel, useDeleteLabel } from '@/hooks/useProjects';
import type { LabelCreateData, LabelUpdateData } from '@/types/project';

const COLOR_PRESETS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
];

function isValidHex(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function LabelsManager({
  projectId,
  currentUserRole,
}: {
  projectId: string;
  currentUserRole: string;
}) {
  const { data: labels = [] } = useLabels(projectId);
  const createLabel = useCreateLabel(projectId);
  const updateLabel = useUpdateLabel(projectId);
  const deleteLabel = useDeleteLabel(projectId);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#6B7280');
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const canManage = ['admin', 'project_manager'].includes(currentUserRole);

  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !isValidHex(newLabelColor)) return;

    try {
      await createLabel.mutateAsync({
        name: newLabelName,
        color: newLabelColor,
      });
      setNewLabelName('');
      setNewLabelColor('#6B7280');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create label:', error);
    }
  };

  const handleUpdateLabel = async (labelId: string) => {
    if (!editName.trim()) return;
    if (editColor && !isValidHex(editColor)) return;

    try {
      const data: LabelUpdateData = {};
      if (editName.trim()) data.name = editName;
      if (editColor && isValidHex(editColor)) data.color = editColor;

      await updateLabel.mutateAsync({ labelId, data });
      setEditingId(null);
      setEditName('');
      setEditColor('');
    } catch (error) {
      console.error('Failed to update label:', error);
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    if (!confirm('Are you sure you want to delete this label?')) return;

    try {
      await deleteLabel.mutateAsync(labelId);
    } catch (error) {
      console.error('Failed to delete label:', error);
    }
  };

  const startEdit = (labelId: string, name: string, color: string) => {
    setEditingId(labelId);
    setEditName(name);
    setEditColor(color);
  };

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      {!showCreateForm && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create and manage project labels for better organization
          </p>
          {canManage && (
            <Button
              onClick={() => setShowCreateForm(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Label
            </Button>
          )}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && canManage && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Label Name</Label>
                <Input
                  placeholder="e.g., bug, feature, docs"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  disabled={createLabel.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Color</Label>
                <Input
                  type="text"
                  placeholder="#6B7280"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value.toUpperCase())}
                  disabled={createLabel.isPending}
                  maxLength={7}
                />
              </div>
            </div>

            {/* Color Presets */}
            <div className="space-y-2">
              <Label className="text-xs">Color Presets</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewLabelColor(color)}
                    className="h-6 w-6 rounded border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: newLabelColor === color ? '#000' : 'transparent',
                    }}
                    disabled={createLabel.isPending}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            {newLabelName && (
              <div className="rounded bg-gray-200 p-2 dark:bg-gray-800">
                <div
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: newLabelColor }}
                >
                  {newLabelName}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCreateLabel}
                disabled={!newLabelName.trim() || !isValidHex(newLabelColor) || createLabel.isPending}
                size="sm"
              >
                Create
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={createLabel.isPending}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Labels List */}
      {labels.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-900/50">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No labels yet. Create your first label to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {labels.map((label) =>
            editingId === label.id && canManage ? (
              // Edit Form
              <div
                key={label.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50"
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Label name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={updateLabel.isPending}
                      size={1}
                    />
                    <Input
                      type="text"
                      placeholder="#6B7280"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value.toUpperCase())}
                      disabled={updateLabel.isPending}
                      maxLength={7}
                      size={1}
                    />
                  </div>

                  {/* Color Presets for Edit */}
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditColor(color)}
                        className="h-5 w-5 rounded border-2 transition-all"
                        style={{
                          backgroundColor: color,
                          borderColor: editColor === color ? '#000' : 'transparent',
                        }}
                        disabled={updateLabel.isPending}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* Edit Preview */}
                  {editName && (
                    <div className="rounded bg-gray-200 p-2 dark:bg-gray-800">
                      <div
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: editColor || label.color }}
                      >
                        {editName}
                      </div>
                    </div>
                  )}

                  {/* Edit Buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={() => handleUpdateLabel(label.id)}
                      disabled={
                        !editName.trim() ||
                        (editColor && !isValidHex(editColor)) ||
                        updateLabel.isPending
                      }
                      size="sm"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingId(null)}
                      disabled={updateLabel.isPending}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Display Form
              <div
                key={label.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-card p-3 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {label.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {label.color}
                  </span>
                </div>

                {canManage && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(label.id, label.name, label.color)}
                      disabled={updateLabel.isPending}
                      className="h-8 px-2 text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLabel(label.id)}
                      disabled={deleteLabel.isPending}
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
