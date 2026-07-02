import {
  usePopupQueue as useSharedPopupQueue,
} from "@esparex/shared";

type UsePopupQueueOptions = Parameters<typeof useSharedPopupQueue>[0];

export function usePopupQueue(options: Omit<UsePopupQueueOptions, "deferReceive">) {
  return useSharedPopupQueue({
    ...options,
    deferReceive: true,
  });
}
