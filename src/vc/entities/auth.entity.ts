import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { VC } from "./vc.entity";
import { Guardian } from "./guardian.entity";
import { Shelter } from "./shelter.entity";

@Entity('auth')
export class Auth {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  walletAddress: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // OneToOne 관계 (선택적)
  @OneToOne(() => Guardian, guardian => guardian.auth, { nullable: true })
  guardian?: Guardian;

  @OneToOne(() => Shelter, shelter => shelter.auth, { nullable: true })
  shelter?: Shelter;

  // OneToMany (VC들)
  @OneToMany(() => VC, vc => vc.auth)
  vcs: VC[];
}