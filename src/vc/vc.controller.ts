// vc-service/src/vc/vc.controller.ts
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { VcService } from './vc.service';

@Controller()
export class VcController {
  constructor(private readonly vcService: VcService) {}

  @GrpcMethod('VCService', 'RegisterAuth')
  async registerAuth(data: { walletAddress: string }) {
    return this.vcService.registerAuth(data.walletAddress);
  }

  @GrpcMethod('VCService', 'UpdateGuardianInfo')
  async updateGuardianInfo(data: any) {
    return this.vcService.updateGuardianInfo(data);
  }

  @GrpcMethod('VCService', 'UpdateShelterInfo')
  async updateShelterInfo(data: any) {
    return this.vcService.updateShelterInfo(data);
  }

  @GrpcMethod('VCService', 'StoreVC')
  async storeVC(data: any) {
    return this.vcService.storeVC(data);
  }

  @GrpcMethod('VCService', 'GetVC')
  async getVC(data: any) {
    return this.vcService.getVC(data);
  }

  @GrpcMethod('VCService', 'GetVCsByWallet')
  async getVCsByWallet(data: { walletAddress: string }) {
    return this.vcService.getVCsByWallet(data.walletAddress);
  }
}