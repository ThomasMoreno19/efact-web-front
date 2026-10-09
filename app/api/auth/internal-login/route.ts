import { handleInternalLogin } from "@/features/auth/services/internal-login.service";

export async function POST(request: Request) {
  return handleInternalLogin(request);
}
