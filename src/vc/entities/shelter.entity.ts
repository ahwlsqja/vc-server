import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Auth } from "./auth.entity";

@Entity('shelter')
export class Shelter {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Auth)
  @JoinColumn()
  auth: Auth;

  @Column()
  name: string;

  @Column()
  location: string;

  @Column()
  licenseNumber: string;

  @Column()
  capacity: number;

  @Column({ default: 'PENDING' })
  status: string;
}