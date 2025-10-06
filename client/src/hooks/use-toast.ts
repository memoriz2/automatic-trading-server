import type {
//   ToastProps as ShadcnToastProps,
} from "@/components/ui/toast"

import { toast as shadcnToast } from '@/components/ui/use-toast';

type ToastProps = Parameters<typeof shadcnToast>[0];

export const useToast = () => {
  const toast = (props: ToastProps) => {
    return shadcnToast(props);
  };
  
  return { toast };
};
