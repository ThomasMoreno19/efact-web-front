import { handleAdminRefresh } from "@/features/auth/services/auth-refresh.service";

export async function POST() {
  return handleAdminRefresh();
}
