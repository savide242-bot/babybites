import { CustomToast } from '@/components/ui/custom-toast';
import { useCustomToast } from '@/hooks/useCustomToast';

export const CustomToastContainer = () => {
  const { toasts } = useCustomToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <CustomToast key={toast.id} {...toast} />
      ))}
    </div>
  );
};
