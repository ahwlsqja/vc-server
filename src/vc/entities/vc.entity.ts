// vc-service/src/vc/entities/pet-vc.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Auth } from './auth.entity';


@Entity('vc')
export class VC {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Auth, (auth) => auth.vcs, { onDelete: 'CASCADE' })
  @JoinColumn()
  auth: Auth;

  @Column()
  petDID: string;

  @Column({ type: 'text' })
  vcJwt: string;

  @Column()
  vcType: string;

  @Column({ type: 'text', nullable: true })
  metadata: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}