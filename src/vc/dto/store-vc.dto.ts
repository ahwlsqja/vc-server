export class StoreVCDto {
  guardianAddress: string;
  petDID: string;
  vcJwt: string;
  metadata?: string;
}

export class StoreVCResponseDto {
  success: boolean;
  vcId?: number;
  message?: string;
  error?: string;
}