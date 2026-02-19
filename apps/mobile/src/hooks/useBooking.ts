import { useMutation, useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useBookingStore } from '@/stores/booking.store';
import { queryClient } from '@/config/query';
import type { JobStatus } from '@fundi-wangu/shared-types';

export function useSearchMafundi(categoryId: string | null, lat?: number, lng?: number) {
  return useQuery({
    queryKey: ['mafundi', categoryId, lat, lng],
    queryFn: () =>
      api.mafundi.search({
        category_id: categoryId!,
        latitude: lat!,
        longitude: lng!,
        radius_km: 10,
      }),
    enabled: !!categoryId && lat !== undefined && lng !== undefined,
  });
}

export function useCreateJob() {
  const reset = useBookingStore((s) => s.reset);

  return useMutation({
    mutationFn: (data: {
      category_id: string;
      description: string;
      latitude: number;
      longitude: number;
      address: string;
      scheduled_at?: string;
      fundi_id?: string;
      images?: string[];
    }) => api.jobs.create(data),
    onSuccess: () => {
      reset();
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useJobs(status?: JobStatus) {
  return useInfiniteQuery({
    queryKey: ['jobs', status],
    queryFn: ({ pageParam }) =>
      api.jobs.list({ status, page: pageParam as number, per_page: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

export function useJob(jobId: string) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.jobs.get(jobId),
    enabled: !!jobId,
  });
}

export function useUpdateJobStatus() {
  return useMutation({
    mutationFn: (params: { jobId: string; status: JobStatus; cancellationReason?: string }) =>
      api.jobs.updateStatus(params.jobId, params.status, params.cancellationReason),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['job', vars.jobId] });
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useInitiatePayment() {
  return useMutation({
    mutationFn: (params: { jobId: string; phone: string }) =>
      api.payments.initiate({ job_id: params.jobId, phone: params.phone }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['job', vars.jobId] });
    },
  });
}

export function useSendTip() {
  return useMutation({
    mutationFn: (params: { jobId: string; amountTzs: number; phone: string }) =>
      api.payments.sendTip({
        job_id: params.jobId,
        amount_tzs: params.amountTzs,
        phone: params.phone,
      }),
  });
}
