import type { PreregStatus } from '@fdm/shared';

export interface PreregistrationEntity {
  id: string;
  hostId: string;
  locationId: string;
  visitorData: unknown;
  purpose: string | null;
  scheduledAt: Date;
  qrToken: string;
  status: PreregStatus;
  visitId: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
