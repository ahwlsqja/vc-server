export class RegisterAuthDto {
  walletAddress: string;
}

export class RegisterAuthResponseDto {
  success: boolean;
  authId?: number;
  message?: string;
  error?: string;
}