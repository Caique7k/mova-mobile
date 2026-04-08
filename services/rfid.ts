import { post } from "@/services/api";

export type LinkStudentRfidInput = {
  rfidTag: string;
  studentId: string;
};

export type LinkedRfidCard = {
  active: boolean;
  companyId: string;
  createdAt?: string;
  id: string;
  studentId?: string | null;
  tag: string;
};

function normalizeRfidTag(value: string) {
  return value.trim().toUpperCase();
}

export async function linkStudentRfid(input: LinkStudentRfidInput) {
  return post<LinkedRfidCard>("/rfid/link", {
    rfidTag: normalizeRfidTag(input.rfidTag),
    studentId: input.studentId,
  });
}
