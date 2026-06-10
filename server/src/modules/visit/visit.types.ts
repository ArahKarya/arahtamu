import type { VisitStatus } from '@arahtamu/shared';

export interface VisitEntity {
  id: string;
  visitorId: string;
  hostId: string;
  locationId: string;
  purpose: string | null;
  status: VisitStatus;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  photoUrl: string | null;
  signatureUrl: string | null;
  badgeCode: string | null;
  formData: unknown;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
