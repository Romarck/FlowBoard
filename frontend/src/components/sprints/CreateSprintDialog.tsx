import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { useCreateSprint } from '@/hooks/useSprints';

interface CreateSprintDialogProps {
  projectId: string;
  onSuccess?: () => void;
}

export function CreateSprintDialog({ projectId, onSuccess }: CreateSprintDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const createSprint = useCreateSprint(projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createSprint.mutateAsync({
        name,
        goal: goal || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });

      // Reset form
      setName('');
      setGoal('');
      setStartDate('');
      setEndDate('');
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create sprint:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ New Sprint</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Sprint</DialogTitle>
          <DialogDescription>
            Create a new sprint to organize and track your team's work.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sprint Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Sprint Name *
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sprint 1, Q1 Planning"
              required
              disabled={createSprint.isPending}
            />
          </div>

          {/* Sprint Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Sprint Goal
            </label>
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What do you want to accomplish in this sprint?"
              rows={3}
              disabled={createSprint.isPending}
            />
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={createSprint.isPending}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={createSprint.isPending}
              />
            </div>
          </div>

          {/* Error Display */}
          {createSprint.isError && (
            <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">
                {(createSprint.error as any)?.response?.data?.detail ||
                  'Failed to create sprint. Please try again.'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createSprint.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name || createSprint.isPending}>
              {createSprint.isPending ? 'Creating...' : 'Create Sprint'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
