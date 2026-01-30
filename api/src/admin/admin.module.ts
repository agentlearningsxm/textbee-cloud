import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { User, UserSchema } from '../users/schemas/user.schema'
import { Device, DeviceSchema } from '../gateway/schemas/device.schema'
import { SMS, SMSSchema } from '../gateway/schemas/sms.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: SMS.name, schema: SMSSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
