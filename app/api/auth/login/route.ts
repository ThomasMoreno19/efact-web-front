import { handleAdminLogin } from "@/features/auth/services/auth-login.service";

export async function POST(request: Request) {
  return handleAdminLogin(request);
}
