import type { FundiWanguClient } from '../client.js';
import type { PaymentTransaction, InitiatePaymentPayload, TipPayload } from '@fundi-wangu/shared-types';

export function createPaymentEndpoints(client: FundiWanguClient) {
  return {
    /** Initiate mobile money payment */
    initiate(data: InitiatePaymentPayload) {
      return client.post<PaymentTransaction>('/api/v1/payments/initiate', data);
    },

    /** Get payments for a job */
    getJobPayments(jobId: string) {
      return client.get<PaymentTransaction[]>(`/api/v1/payments/job/${jobId}`);
    },

    /** Get payment status */
    getStatus(transactionId: string) {
      return client.get<PaymentTransaction>(`/api/v1/payments/${transactionId}`);
    },

    /** Send a tip to the Fundi */
    sendTip(jobId: string, data: TipPayload) {
      return client.post<PaymentTransaction>(`/api/v1/payments/job/${jobId}/tip`, data);
    },
  };
}
