import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Bell, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface ReminderSetting {
  id: string;
  label: string;
  emoji: string;
  enabled: boolean;
  hour: number;
  minute: number;
}

interface StepRemindersProps {
  value: ReminderSetting[];
  onChange: (value: ReminderSetting[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const DEFAULT_REMINDERS: ReminderSetting[] = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🍳', enabled: true, hour: 7, minute: 30 },
  { id: 'morning-snack', label: 'Morning snack', emoji: '🍎', enabled: false, hour: 10, minute: 0 },
  { id: 'lunch', label: 'Lunch', emoji: '🥗', enabled: true, hour: 12, minute: 30 },
  { id: 'afternoon-snack', label: 'Afternoon snack', emoji: '🍌', enabled: false, hour: 15, minute: 30 },
  { id: 'dinner', label: 'Dinner', emoji: '🍽️', enabled: true, hour: 18, minute: 0 },
];

const formatTime = (hour: number, minute: number) => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const StepReminders = ({ value, onChange, onNext, onBack }: StepRemindersProps) => {
  const reminders = value.length > 0 ? value : DEFAULT_REMINDERS;

  const toggleReminder = (id: string) => {
    const updated = reminders.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    onChange(updated);
  };

  const updateTime = (id: string, hour: number, minute: number) => {
    const updated = reminders.map(r => 
      r.id === id ? { ...r, hour, minute } : r
    );
    onChange(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(reminders);
    onNext();
  };

  const enabledCount = reminders.filter(r => r.enabled).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in" style={{ colorScheme: 'light', color: '#111827' }}>
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 mb-4">
          <Bell className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: '#111827' }}>
          Meal reminders
        </h2>
        <p className="text-sm" style={{ color: '#4b5563' }}>
          Get notified at meal times
        </p>
      </div>

      <div className="space-y-3">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
              reminder.enabled
                ? "border-[#1E5E3A] bg-[#f0fdf4]"
                : "border-stone-200 bg-white"
            )}
            style={{
              backgroundColor: reminder.enabled ? '#f0fdf4' : '#ffffff',
              borderColor: reminder.enabled ? '#1E5E3A' : '#e5e7eb',
            }}
          >
            <span className="text-2xl">{reminder.emoji}</span>
            <div className="flex-1">
              <p className="font-medium" style={{ color: '#111827' }}>{reminder.label}</p>
              {reminder.enabled && (
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-[#1E5E3A]" />
                  <input
                    type="time"
                    value={formatTime(reminder.hour, reminder.minute)}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number);
                      updateTime(reminder.id, h, m);
                    }}
                    style={{
                      color: '#111827',
                      colorScheme: 'light',
                      WebkitTextFillColor: '#111827',
                    }}
                    className="text-sm bg-transparent border-none p-0 focus:outline-none focus:ring-0 font-medium"
                  />
                </div>
              )}
            </div>
            <Switch
              checked={reminder.enabled}
              onCheckedChange={() => toggleReminder(reminder.id)}
            />
          </div>
        ))}
      </div>

      {enabledCount === 0 && (
        <p className="text-center text-sm" style={{ color: '#6b7280' }}>
          You can always enable reminders later in settings
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 py-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-primary to-mint text-white font-semibold py-6 text-lg hover:shadow-glow transition-all duration-300"
        >
          <span className="flex items-center gap-2">
            Continue
            <ArrowRight className="w-5 h-5" />
          </span>
        </Button>
      </div>
    </form>
  );
};

export default StepReminders;
