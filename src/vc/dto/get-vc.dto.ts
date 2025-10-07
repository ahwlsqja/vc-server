export class GetVCDto {
  petDID: string;
  guardianAddress: string;
}

export class GetVCResponseDto {
  success: boolean;
  vcJwt?: string;
  metadata?: string;
  createdAt?: string;
  error?: string;
}

export class VCDto {
  petDID: string;
  vcJwt: string;
  vcType: string;
  createdAt: string;
}

export class GetVCsByWalletDto {
  walletAddress: string;
}

export class GetVCsByWalletResponseDto {
  vcs: VCDto[];
  error?: string;
}